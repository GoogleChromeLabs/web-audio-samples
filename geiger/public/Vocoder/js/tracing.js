(function (TraceAudioContext) {

  'use strict';

  // Stashing original context constructors.
  var AG = {
    AudioContext: AudioContext,
    OfflineAudioContext: OfflineAudioContext
  };

  const audioNodeNames = [
    "BufferSource",
    "ConstantSource",
    "Gain",
    "Delay",
    "BiquadFilter",
    "IIRFilter",
    "WaveShaper",
    "Panner",
    "Convolver",
    "DynamicsCompressor",
    "Analyser",
    "ScriptProcessor",
    "StereoPanner",
    "Oscillator",
    "ChannelSplitter",
    "ChannelMerger",
    "MediaElementSource",
    "MediaStreamSource",
    "MediaStreamDestination"
  ];

  let constructors = {};

  // The current context being tracked.
  var currentContext = null;

  // Generate unique ID string of 16 digits hexadecimal.
  function _generateUID() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  // Override object prototype with a specified function.
  function overridePrototype(prototype, methodName, func) {
    prototype['_' + methodName] = prototype[methodName];
    prototype[methodName] = func;
  }

  // the source and destination nodes cannot be cloned and sent
  // as message directly; therefore, we need to serialize them
  // into proper format
  function serialize(node) {
    if (!node) return undefined;

    var props = {
      nodeType: node.constructor.name,
      nodeId: node._uid,
    }

    var paramNames = [];
    for (var property in node) {
      // Find AudioParam objects and save its name
      const prop = node[property];
      if (prop instanceof AudioParam) {
        paramNames.push(property);
      } else if (property.indexOf('_') === -1
          && typeof prop !== 'function'
          && property !== 'context') {
        // save all public property that is not a function nor context
        props[property] = prop;
      }
    }
    props.contextId = getContextId(node);
    props['audioParamNames'] = paramNames;

    return props;
  }

  function getContextId(node) {
    return node.context['__resource_id__']
  }

  /**
   * Determines the channel to use in the graph visualization based on a user
   * argument for either input or output channel. This function is necessary
   * because the values passed into those arguments are sometimes not numbers, and
   * in those cases, the Web Audio API behaves gracefully (defaults to 0), but the
   * extension throws an exception.
   * @param {*} channelValue Whatever the caller passed as the channel. This could
   *     be anything. Ideally, it's either a number or undefined.
   * @credit copied from Audion tracing.js
   */
  function determineChannelValue(channelValue) {
    // Try converting value into a number if it is not one already. If it is a
    // string, this will convert as expected, ie "42" to 42. Otherwise, we default
    // to 0 as the Web Audio API does. For instance, unexpected objects passed as
    // a channel argument get converted to 0.
    return Number(channelValue) || 0;
  };

  // Extension for (Offline)AudioContext.
  var contextExtension = {
    // Get unique ID.
    _getUID: {
      value: function () {
        // TODO: check duplicates.
        return _generateUID();
      }
    },

    // If in iframe, send message from iframe to the parent page.
    _postMessage: {
      value: function(eventType, message) {
        var isInIframe = (window !== window.parent);
        if (isInIframe) {
          window.parent.postMessage({eventType, ...message})
        }
      }
    },

    _postNodeCreatedMessage: {
      value: function(node) {
        this._postMessage('KNodeCreated', serialize(node));
      }
    },

    _postNodesConnectionMessage: {
      value: function(source, destination, outputIndex, inputIndex) {
        this._postMessage('KNodesConnected', {
          contextId: getContextId(source),
          sourceNodeId: source._uid,
          destinationNodeId: destination._uid,
          fromChannel: determineChannelValue(outputIndex),
          toChannel: determineChannelValue(inputIndex),
        })
      }
    },

    _postNodeParamConnectionMessage: {
      value: function(source, destination, outputIndex) {
        this._postMessage('kNodeParamConnected', {
          contextId: getContextId(source),
          sourceNodeId: source._uid,
          destinationNodeId: destination.parentNode._uid,
          fromChannel: determineChannelValue(outputIndex),
          destinationParamName: destination.paramName,
        })
      }
    },

    _postDisconnectMessage: {
      value: function(sourceOrSourceId, destination) {
        if (typeof sourceOrSourceId === 'string' && !destination) {
          // TODO: remove all connections from this source?
        } else {
          // TODO: check if it's NodeToNode or NodeToParam
          this._postMessage('kNodesDisconnected', {});
        }
      }
    },

    // Register a node in the context.
    _addNode: {
      value: function (node) {
        if (node.context !== currentContext)
          return;

        node._uid = this._getUID();
        this._nodes.push(node);
        this._postNodeCreatedMessage(node);
      }
    },

    // Register a connection between two nodes in the context.
    _addConnection: {
      value: function (source, destination, outputIndex, inputIndex) {

        // TODO: Take care duplicate connection for AudioParam.
        if (destination instanceof AudioParam) {
          // Add uid for destination AudioParam.
          destination._uid = destination.parentNode._uid + '.' + destination.paramName;
          this._nodes.push(destination);

          this._postNodeParamConnectionMessage(source, destination, outputIndex, inputIndex);
          return;
        }

        // If source and destination are same, do nothing.
        if (source._uid === destination._uid)
          return;

        // If this is the first time, create the storage for the source.
        if (!this._connections.hasOwnProperty(source._uid))
          this._connections[source._uid] = [];

        // If the destination is already connected to the source, do nothing.
        if (this._connections[source._uid].indexOf(destination._uid) !== -1)
          return;

        this._connections[source._uid].push(destination._uid);
        this._postNodesConnectionMessage(source, destination, outputIndex, inputIndex);
      }
    },

    // Remove a registered connection from the context.
    _removeConnection: {
      value: function (source, destination) {
        if (!this._connections.hasOwnProperty(source._uid))
          return;

        if (!destination) {
          this._connections[source._uid] = [];
          this._postDisconnectMessage(source._uid);
          return;
        }

        var where = this._connections[source._uid].indexOf(destination._uid);
        if (where > -1) {
          this._connections[source._uid].splice(where, 1);
          this._postDisconnectMessage(source, destination);
        }
      }
    },

    // Get AudioNode by UID.
    getNodeByUID: {
      value: function (uid) {
        for (var i = 0; i < this._nodes.length; i++) {
          if (this._nodes[i]._uid === uid)
            return this._nodes[i];
        }

        return null;
      }
    }
  };

  // Minitask for replacing factory method.
  function replaceFactory(prototype, method) {
    // Caching the original factory.
    prototype['_' + method] = prototype[method];

    // Override the factory method.
    prototype[method] = function () {
      var node = this['_' + method].apply(this, arguments);

      // Find AudioParam objects and assign the node reference.
      for (var property in node) {
        if (node[property] instanceof AudioParam) {
          node[property].parentNode = node;
          node[property].paramName = property;
        }
      }

      // Add the node to the context's storage and fire event.
      this._addNode(node);

      return node;
    };
  }

  // Minitask for replacing constructor method.
  function replaceConstructor(nodeName) {
    switch (nodeName) {
      case 'BufferSource':
        nodeName = 'AudioBufferSourceNode';
        break;
      case 'ScriptProcessor':
        // ScriptProcessor does not have a constructor.
        nodeName = null;
        break;
      default:
        nodeName += 'Node';
        break;
    }

    if (!nodeName)
      return;

    constructors[nodeName] = window[nodeName];
    window[nodeName] = function (baseAudioContext, options) {
      var node = new constructors[nodeName](baseAudioContext, options);

      // Find AudioParam objects and assign the node reference.
      for (var property in node) {
        if (node[property] instanceof AudioParam) {
          node[property].parentNode = node;
          node[property].paramName = property;
        }
      }

      // Add the node to the context's storage and fire event.
      baseAudioContext._addNode(node);

      return node;
    };
  }

  // Wrap context constructor with additional features.
  function wrapContextForAudioNodeFactory(contextName) {
    var prototype = AG[contextName].prototype;

    // Override 'create*' factory methods.
    for (var method in prototype) {
      if (method.indexOf('create') === -1 || method.indexOf('_') > -1)
        continue;

      replaceFactory(prototype, method);
    }
  }

  function wrapAudioNodeConstructor() {
    for (let index in audioNodeNames)
      replaceConstructor(audioNodeNames[index]);
  }

  overridePrototype(AudioNode.prototype, 'connect', function () {
    this._connect.apply(this, arguments);
    this.context._addConnection(this, arguments[0], arguments[1], arguments[2]);
    if (arguments[0] instanceof AudioNode)
      return arguments[0];
  });

  overridePrototype(AudioNode.prototype, 'disconnect', function () {
    this._disconnect.apply(this, arguments);
    this.context._removeConnection(this, arguments[0]);
  });

  // TODO: this means OfflineAudioContext is needs patching due to the
  // BaseAudioContext class.
  if (!AudioContext.prototype.hasOwnProperty('createGain')) {
    Object.defineProperties(OfflineAudioContext.prototype, contextExtension);
    wrapContextForAudioNodeFactory('OfflineAudioContext');
  }

  // Then patch AudioContext.
  Object.defineProperties(AudioContext.prototype, contextExtension);
  wrapContextForAudioNodeFactory('AudioContext');

  // Wrap AudioNode constructors.
  wrapAudioNodeConstructor();

  // Public methods.
  Object.defineProperties(TraceAudioContext, {

    // Start track a specified context.
    trackContext: {
      value: function (context) {
        currentContext = context;
        context._isTracked = true;
        context._nodes = [];
        context._connections = {};
        context._addNode(context.destination);
      }
    },

    getCurrentContext: {
      value: function () {
        return currentContext;
      }
    },

    // Release the context from tracking.
    releaseContext: {
      value: function () {
        if (!currentContext)
          return;

        currentContext._isTracked = null;
        currentContext._nodes = null;
        currentContext._connections = null;
        currentContext = null;
      }
    }

  });

})(TraceAudioContext = {});