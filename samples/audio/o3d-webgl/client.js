/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * A namespace to hold the list of all clients.
 * @namespace
 */
o3d.Renderer = {};


/**
 * @type {number}
 */
o3d.Renderer.InitStatus = goog.typedef;

/**
 * The initialization status of the renderer.
 *
 *  InitStatus,
 *  UNINITIALIZED,
 *  SUCCESS,  The renderer is initialized.
 *  GPU_NOT_UP_TO_SPEC,  The renderer determined the user's machine cannot
 *     run O3D.
 *  OUT_OF_RESOURCES,  The user's machine does not have enough graphic
 *     resources available to start another instance of the O3D renderer.
 *  INITIALIZATION_ERROR,  Some unknown error such as e.g. drivers not
 *     being installed correctly.
 */
o3d.Renderer.UNINITIALIZED = 0;
o3d.Renderer.SUCCESS = 1;
o3d.Renderer.GPU_NOT_UP_TO_SPEC = 2;
o3d.Renderer.OUT_OF_RESOURCES = 3;
o3d.Renderer.INITIALIZATION_ERROR = 4;


/**
 * @type {number}
 */
o3d.Renderer.DisplayMode = goog.typedef;

/**
 * This is used in SetFullscreenClickRegion to request the current display
 * mode, such that the change to full-screen mode won't change the screen
 * resolution or refresh rate.
 *
 *  DisplayModes,
 *  DISPLAY_MODE_DEFAULT
 */
o3d.Renderer.DISPLAY_MODE_DEFAULT = 0;


/**
 * The interval timer for the render callback.
 * @type {Object}
 */
o3d.Renderer.render_callback_interval_ = null;


/**
 * Global private list of all clients to be rendered every frame.
 * @type {!Array.<!o3d.Client>}
 */
o3d.Renderer.clients_ = [];


/**
 * Renders all clients associated with this renderer.
 */
o3d.Renderer.renderClients = function() {
  for (var i = 0; i < o3d.Renderer.clients_.length; ++i) {
    var client = o3d.Renderer.clients_[i];

    client.render();
  }
};


/**
 * Sets a timer to traverse the rendergraph every sixtieth of a second.
 */
o3d.Renderer.installRenderInterval = function() {
  o3d.Renderer.render_callback_interval_ = setInterval(
      "o3d.Renderer.renderClients()", 1000.0 / 60.0);
};


/**
 * The ClientInfo is used to get information about the client.
 * @constructor
 */
o3d.ClientInfo = function() {
  o3d.NamedObject.call(this);
};
o3d.inherit('ClientInfo', 'NamedObject');


/**
 * The number of objects the client is currently tracking.
 * You can use this to check that you are correctly freeing resources.
 * @type {number}
 */
o3d.ClientInfo.prototype.num_objects = 0;



/**
 * The amount of texture memory used.
 * @type {number}
 */
o3d.ClientInfo.prototype.texture_memory_used = 0;



/**
 * The amount of texture memory used.
 * @type {number}
 */
o3d.ClientInfo.prototype.buffer_memory_used = 0;



/**
 * Whether or not O3D is using the software renderer.
 *
 * For testing purposes you can force O3D to use the software renderer
 * by setting the environment variable O3D_FORCE_SOFTWARE_RENDERER to
 * anything.
 *
 *
 * set O3D_FORCE_SOFTWARE_RENDERER=foo
 *
 * or
 *
 * export O3D_FORCE_SOFTWARE_RENDERER=foo
 *
 *
 * You can set it at a system level if you want to set it for all
 * browser instances or set it from a command line and start your
 * browser from that same command line if you want to effect just
 * that instance of the browser.
 *
 * Note that many browers require special command line options to
 * run in a separate process, otherwise they default to finding
 * the browser process already running and using that. For example
 * firefox requires the option -no-remote.
 *
 * @type {boolean}
 */
o3d.ClientInfo.prototype.software_renderer = false;



/**
 * Whether or not the GPU supports non power of two textures.
 * NOTE: O3D always allows non power of two textures.
 *
 * The only reason to look at this flag is for things like video that are
 * updating the texture every frame. In that case, you might want to know
 * that you could run faster if you used a power of 2 texture instead of
 * a non power of 2 texture.
 *
 * @type {boolean}
 */
o3d.ClientInfo.prototype.non_power_of_two_textures = true;


/**
 * The Client class is the main point of entry to O3D.  It defines methods
 * for creating and deleting packs. Each new object created by the Client is
 * assigned a unique ID.
 *
 * The Client has a root transform for the transform graph and a root render
 * node for the render graph.
 * @constructor
 */
o3d.Client = function() {
  o3d.NamedObject.call(this);

  var tempPack = this.createPack();
  this.root = tempPack.createObject('Transform');
  this.renderGraphRoot = tempPack.createObject('RenderNode');
  this.clientId = o3d.Client.nextId++;
  this.packs_ = [tempPack];

  if (o3d.Renderer.clients_.length == 0)
    o3d.Renderer.installRenderInterval();

  o3d.Renderer.clients_.push(this);
};
o3d.inherit('Client', 'NamedObject');

/**
 * @type {function(!o3d.RenderEvent): void}
 */
o3d.Client.RenderCallback = goog.typedef;

/**
 * @type {function(!o3d.TickEvent): void}
 */
o3d.Client.TickCallback = goog.typedef;

/**
 * @type {function(string): void}
 */
o3d.Client.ErrorCallback = goog.typedef;

/**
 * The root of the render graph.
 * @type {o3d.RenderNode}
 */
o3d.Client.prototype.renderGraphRoot = null;


/**
 * Global counter to give the client a unique ID number.
 * @type {number}
 */
o3d.Client.nextId = 0;


/**
 * The time of the last render in seconds.
 * @type {number}
 */
o3d.Client.prototype.then_ = 0;


/**
 * The transform graph root.
 * @type {o3d.Transform}
 */
o3d.Client.prototype.root = null;


/**
 * A list of all packs for this client.
 * @type {!Array.<!o3d.Pack>}
 */
o3d.Client.prototype.packs_ = [];


/**
 * Function that gets called when the client encounters an error.
 */
o3d.Client.prototype.error_callback = function(error_message) {
  alert(error_message);
};


/**
 * Function that gets called right before the client renders.
 */
o3d.Client.prototype.render_callback = function(render_event) {};


/**
 * Function that gets called every tick.
 */
o3d.Client.prototype.tick_callback = function(tick_event) {};


/**
 * Call this function from window.onunload to ensure the browser does not
 * continue to call callbacks (like the render callback) after the page is
 * unloaded.  It is possible that during unload the browser unloads all the
 * javascript code, but then, after that, still asks the plugin to render.  The
 * browser then calls javascript functions that no longer exist which causes an
 * error. To prevent that situation you need to clear all your callbacks on
 * unload. cleanup handles that for you so you don't have to dispose each and
 * every callback by hand.
 */
o3d.Client.prototype.cleanup = function () {
  this.clearRenderCallback();
  this.clearTickCallback();
  this.clearErrorCallback();
};


/**
 * Creates a pack object.
 *   A pack object.
 * @return {!o3d.Pack} A new pack object.
 */
o3d.Client.prototype.createPack =
    function() {
  var pack = new o3d.Pack;
  pack.client = this;
  pack.gl = this.gl;
  this.packs_.push(pack);
  return pack;
};


/**
 * Creates a pack object.
 *   A pack object.
 * @param {!o3d.Pack} pack The pack to remove.
 */
o3d.Client.prototype.destroyPack =
    function(pack) {
  o3d.removeFromArray(this.packs_, pack);
};



/**
 * Searches the Client for an object matching the given id.
 *
 * @param {number} id The id of the object to look for.
 * @return {o3d.ObjectBase}  The object or null if a object
 *     with the given id is not found.
 */
o3d.Client.prototype.getObjectById =
    function(id) {
  o3d.notImplemented();
};


/**
 * Searches the Client for objects of a particular name and type.
 * @param {string} name name of object to look for.
 * @param {string} class_name name of class to look for.
 * @return {!Array.<!o3d.ObjectBase>}  Array of objects found.
 */
o3d.Client.prototype.getObjects =
    function(name, class_name) {
  var objects = [];

  for (var i = 0; i < this.packs_.length; ++i) {
    var pack = this.packs_[i];
    objects = objects.concat(pack.getObjects(name, class_name));
  }

  return objects;
};


/**
 * Searches the Client for objects of a particular type.
 * @param {string} class_name name of class to look for.
 * @return {!Array.<!Object>}  Array of objects found.
 */
o3d.Client.prototype.getObjectsByClassName =
    function(class_name) {
  var objects = [];

  for (var i = 0; i < this.packs_.length; ++i) {
    var pack = this.packs_[i];
    objects = objects.concat(pack.getObjectsByClassName(class_name));
  }

  return objects;
};


/**
 * @type {number}
 */
o3d.Client.RenderMode = goog.typedef;

/**
 *  RENDERMODE_CONTINUOUS,  Draw as often as possible up to refresh rate.
 *  RENDERMODE_ON_DEMAND,   Draw once then only when the OS requests it
 *      (like uncovering part of a window.)
 */
o3d.Client.RENDERMODE_CONTINUOUS = 0;
o3d.Client.RENDERMODE_ON_DEMAND = 1;


/**
 * The current render mode. The default mode is RENDERMODE_CONTINUOUS.\n
 * Valid values are:
 *  RENDERMODE_CONTINUOUS,  Draw as often as possible up to refresh rate.
 *  RENDERMODE_ON_DEMAND,   Draw when the OS requests it (like uncovering
 *                             part of a window.)
 * @type {o3d.Client.RenderMode}
 */
o3d.Client.prototype.renderMode = o3d.Client.RENDERMODE_CONTINUOUS;



/**
 * Forces a render of the current scene if the current render mode is
 * RENDERMODE_ON_DEMAND.
 */
o3d.Client.prototype.render = function() {
  // Synthesize a render event.
  var render_event = new o3d.RenderEvent;

  var now = (new Date()).getTime() * 0.001;
  if(this.then_ == 0.0)
    render_event.elapsedTime = 0.0;
  else
    render_event.elapsedTime = now - this.then_;

  if (this.render_callback) {
    for (var stat in this.render_stats_) {
      render_event[stat] = this.render_stats_[stat];
    }
    this.render_callback(render_event);
  }
  this.then_ = now;
  this.renderTree(this.renderGraphRoot);
};


/**
 * An object for various statistics that are gather during the render tree
 * tranversal.
 *
 * @type {Object}
 */
o3d.Client.prototype.render_stats = {}


/**
 * Renders a render graph.
 *
 * Normally the client calls this function automatically for you effectively
 * doing a client.renderTree(client.renderGraphRoot) but there are cases
 * where it is beneficial to be able to call this yourself and pass it
 * different roots when you need to manipulate something between calls.
 *
 * This function can only be called from inside a render callback. If you call
 * it the client will not do its default call as mentioned above.
 *
 * @param {!o3d.RenderNode} render_node root RenderNode to start rendering from.
 */
o3d.Client.prototype.renderTree =
    function(render_node) {

  this.render_stats_ = {
    drawElementsCulled: 0,
    drawElementsProcessed: 0,
    drawElementsRendered: 0,
    primitivesRendered: 0,
    transformsCulled: 0,
    transformsProcessed: 0
  };

  render_node.render();
};


/**
 * Returns an array of DisplayModes which are available for use in full-screen
 * mode.
 *  An array of DisplayModes.
 * @type {!Array.<!o3d.Client.DispalyMode>}
 */
o3d.Client.prototype.getDisplayModes = [];


/**
 * Makes a region of the plugin area that will invoke full-screen mode if
 * clicked.  The developer is responsible for communicating this to the user,
 * as this region has no visible marker.  The developer is also responsible for
 * updating this region if the plugin gets resized, as we don't know whether or
 * how to scale it.  There can be only one full-screen click region at a time;
 * calling this again will override any previous call.
 *
 * @param {number} x x position in pixels.
 * @param {number} y y position in pixels.
 * @param {number} width width in pixels.
 * @param {number} height height in pixels.
 * @param {number} mode_id Id of mode to use.
 */
o3d.Client.prototype.setFullscreenClickRegion =
    function(x, y, width, height, mode_id) {
  o3d.notImplemented();
};


/**
 * Deactivates the plugin click region that was previously created with
 * SetFullscreenClickRegion().
 */
o3d.Client.prototype.clearFullscreenClickRegion = function() {
  o3d.notImplemented();
};



/**
 * Cancels full-screen display, reverting to displaying content only in the
 * plugin region.  If the plugin is already not in full-screen mode, this has
 * no effect.  This does not deactivate the plugin click region--if the user
 * clicks there again, we'll go back to full-screen display.
 */
o3d.Client.prototype.cancelFullscreenDisplay = function() {
  render_node.render();
};



/**
 * Gets info about the client.
 * @type {!o3d.ClientInfo}
 */
o3d.Client.prototype.client_info = null;



/**
 * Whether content is displayed in full-screen mode or in a plugin window.  The
 * default is false [not full-screen].
 * @type {boolean}
 */
o3d.Client.prototype.fullscreen = false;


/**
 * Returns the width of the current drawing area [plugin or full-screen] in
 * pixels.
 */
o3d.Client.prototype.__defineGetter__('width',
    function() {
      return this.gl.hack_canvas.width;
    }
);

o3d.Client.prototype.__defineSetter__('width',
    function(x) {
      this.gl.hack_canvas.width = x;
    }
);


/**
 * Returns the height of the current drawing area [plugin or full-screen] in
 * pixels.
 */
o3d.Client.prototype.__defineGetter__('height',
    function() {
      return this.gl.hack_canvas.height;
    }
);

o3d.Client.prototype.__defineSetter__('height',
    function(x) {
      this.gl.hack_canvas.height = x;
    }
);


/**
 * Initializes this client using the canvas.
 * @param {Canvas}
 */
o3d.Client.prototype.initWithCanvas = function(canvas) {
  var gl;

  var standard_attributes = {
    alpha : true,
    depth : true,
    stencil : true,
    antialias : true,
    premultipliedAlpha : true
  };

  try {gl = canvas.getContext("experimental-webgl", standard_attributes) } catch(e) { }
  if (!gl)
      try {gl = canvas.getContext("moz-webgl") } catch(e) { }
  if (!gl) {
      alert("No WebGL context found");
      return null;
  }

  // TODO(petersont): hack workaround for WebGLRenderingContext.canvas
  // not being implemented in Firefox. Remove.
  gl.hack_canvas = canvas;
  this.gl = gl;
  this.root.gl = gl;
  this.renderGraphRoot.gl = gl;

  gl.client = this;
  gl.displayInfo = {width: canvas.width,
                    height: canvas.height};
};


/**
 * Sets the per frame render callback.
 *
 * Note: The callback will not be called recursively. When your callback is
 * called if you somehow manage to cause the client to render more frames
 * before you've returned from the callback you will not be called for those
 * frames.
 *
 * g_client.setRenderCallback(onrender);
 *
 * function onrender(render_event) {
 *   var elapsedTime = render_event.elapsedTime;
 * }
 *
 * @param {!o3d.RenderCallback} render_callback The callback to call
 *     each frame.
 */
o3d.Client.prototype.setRenderCallback =
    function(render_callback) {
  if (this.render_callback) {
    this.clearRenderCallback();
  }
  this.render_callback = render_callback;
};


/**
 * Clears the per frame render callback.
 */
o3d.Client.prototype.clearRenderCallback = function() {
  clearInterval(this.render_callback_interval_);
  this.render_callback = null;
};


/**
 * Sets a render callback to be called at the end of the
 * rendering cycle of each frame.
 *
 * Note: The callback will not be called recursively. When your callback is
 * called if you somehow manage to cause the client to render more frames
 * before you've returned from the callback you will not be called for those
 * frames.
 *
 *
 * g_client.setPostRenderCallback(onpostrender);
 *
 * function onpostrender(render_event) {
 *   var elapsedTime = render_event.elapsedTime;
 * }
 *
 * @param {!o3d.RenderCallback} post_render_callback The callback to call
 *     each frame.
 */
o3d.Client.prototype.setPostRenderCallback =
    function(post_render_callback) {
  this.postRenderCallback = post_render_callback;
};


/**
 * Clears the post render callback.
 */
o3d.Client.prototype.clearPostRenderCallback = function() {
  this.postRenderCallback = null;
};



/**
 * Sets the lost resources callback.
 *
 * The contents of certain resources, RenderSurfaces, can get discarded by the
 * system under certain circumstances. If you application needs that contents
 * to be in a certain state then you can set a callback giving your program the
 * opportunity to restore that state if and when it is lost.
 *
 * @param {!o3d.LostResourcesCallback} lost_resources_callback The callback when
 *     resources are lost.
 */
o3d.Client.prototype.setLostResourcesCallback =
    function(lost_resources_callback) {
  this.lostResourcesCallback = lost_resources_callback;
};


/**
 * Clears the lost resources callback.
 */
o3d.Client.prototype.clearLostResourcesCallback =
    function() {
  this.lostResourcesCallback = null;
};


/**
 * Returns the event object for processing.
 * @param {Event} event A mouse-related DOM event.
 * @private
 */
o3d.Client.getEvent_ = function(event) {
  return event ? event : window.event;
};


/**
 * Returns an object with event, element, name and wheel in a semi cross
 * browser way. Note: this can only be called from since an event because
 * depending on the browser it expects that window.event is valid.
 * @param {!Event} event A mouse-related DOM event.
 * @return {!EventInfo} Info about the event.
 * @private
 */
o3d.Client.getEventInfo_ = function(event) {
  var elem = event.target ? event.target : event.srcElement;
  var name = elem.id ? elem.id : ('->' + elem.toString());
  var wheel = event.detail ? event.detail : -event.wheelDelta;
  return { event: event,
           element: elem,
           name: name,
           wheel: wheel };
};


/**
 * Returns the absolute position of an element for certain browsers.
 * @param {!HTMLElement} element The element to get a position for.
 * @return {!Object} An object containing x and y as the absolute position
 *     of the given element.
 * @private
 */
o3d.Client.getAbsolutePosition_ = function(element) {
  var r = { x: element.offsetLeft, y: element.offsetTop };
  if (element.offsetParent) {
    var tmp = o3d.Client.getAbsolutePosition_(element.offsetParent);
    r.x += tmp.x;
    r.y += tmp.y;
  }
  return r;
};

/**
 * Retrieve the coordinates of the given event relative to the center
 * of the widget.
 *
 * @param {!Object} eventInfo As returned from
 *     o3d.Client.getEventInfo.
 * @param {HTMLElement} opt_reference A DOM element whose position we want
 *     to transform the mouse coordinates to. If it is not passed in the
 *     element in the eventInfo will be used.
 * @return {!Object} An object containing keys 'x' and 'y'.
 * @private
 */
o3d.Client.getRelativeCoordinates_ = function(eventInfo, opt_reference) {
  var x, y;
  var event = eventInfo.event;
  var element = eventInfo.element;
  var reference = opt_reference || eventInfo.element;
  if (!window.opera && typeof event.offsetX != 'undefined') {
    // Use offset coordinates and find common offsetParent
    var pos = { x: event.offsetX, y: event.offsetY };
    // Send the coordinates upwards through the offsetParent chain.
    var e = element;
    while (e) {
      e.mouseX_ = pos.x;
      e.mouseY_ = pos.y;
      pos.x += e.offsetLeft;
      pos.y += e.offsetTop;
      e = e.offsetParent;
    }
    // Look for the coordinates starting from the reference element.
    var e = reference;
    var offset = { x: 0, y: 0 }
    while (e) {
      if (typeof e.mouseX_ != 'undefined') {
        x = e.mouseX_ - offset.x;
        y = e.mouseY_ - offset.y;
        break;
      }
      offset.x += e.offsetLeft;
      offset.y += e.offsetTop;
      e = e.offsetParent;
    }
    // Reset stored coordinates
    e = element;
    while (e) {
      e.mouseX_ = undefined;
      e.mouseY_ = undefined;
      e = e.offsetParent;
    }
  } else {
    // Use absolute coordinates
    var pos = o3d.Client.getAbsolutePosition_(reference);
    x = event.pageX - pos.x;
    y = event.pageY - pos.y;
  }
  return { x: x, y: y };
};


/**
 * Wraps a user's event callback with one that properly computes
 * relative coordinates for the event.
 * @param {!o3d.EventCallback} handler Function to call on event.
 * @return {!o3d.EventCallback} Wrapped handler function.
 * @private
 */
o3d.Client.wrapEventCallback_ = function(handler) {
  return function(event) {
    event = o3d.Client.getEvent_(event);
    var info = o3d.Client.getEventInfo_(event);
    var relativeCoords = o3d.Client.getRelativeCoordinates_(info);
    event.x = relativeCoords.x;
    event.y = relativeCoords.y;
    handler(event);
  };
};


/**
 * Sets a callback for a given event type.
 * types.
 * There can be only one callback for a given event type at a time; setting a
 * new one deletes the old one.
 *
 * @param {string} type Type of event to set callback for.
 * @param {!o3d.EventCallback} handler Function to call on event.
 */
o3d.Client.prototype.setEventCallback =
    function(type, handler) {
  var listener = this.gl.hack_canvas;
  // TODO(petersont): Figure out a way for a canvas to listen to a key event
  // directly.
  var forKeyEvent = type.substr(0, 3) == 'key';
  if (forKeyEvent) {
    listener = document;
  } else {
    handler = o3d.Client.wrapEventCallback_(handler);
  }
  listener.addEventListener(type, handler, true);
};


/**
 * Removes the previously-registered callback for an event of the given type.
 * @param {string} type Type of event to clear callback for.
 */
o3d.Client.prototype.clearEventCallback =
    function(type) {
  var forKeyEvent = type.substr(0, 3) == 'key';
  if (forKeyEvent) {
    listener = document;
  }
  listener.removeEventListener(type);
};


/**
 * Sets the texture to use when a Texture or Sampler is missing while
 * rendering. The default is a red texture with a yellow no symbol.
 * <span style="color:yellow; background-color: red;">&Oslash;.
 * If you set it to null you'll get an error if you try to render something
 * that is missing a needed Texture, Sampler or ParamSampler.
 *
 * For example if you don't care about missing textures, setting it to a black
 * texture would be one option. Another example is if you want to write all
 * your shaders to expect a texture then set this to a white texture. If you
 * want to make sure you are not missing any textures set it null and see if
 * you get any errors using Client.setErrorCallback or Client.lastError.
 *
 * var t = g_pack.createTexture2D('', 1, 1, g_o3d.Texture.XRGB8, 1);
 * t.set(0, [0, 0, 0]);
 * g_client.setErrorTexture(t);
 *
 * @param {o3d.Texture} texture texture to use for missing textures or null.
 */
o3d.Client.prototype.setErrorTexture =
    function(texture) {
  o3d.notImplemented();
};


/**
 * Sets a callback for when the client ticks. The client processes some things
 * like animation timers at up to 100hz.  This callback will get called before
 * each of those process ticks.
 *
 * NOTE: The client takes ownership of the TickCallback you
 * pass in. It will be deleted if you call SetTickCallback a
 * second time or if you call clearTickCallback.
 *
 * Note: The callback will not be called recursively.
 *
 * @param {o3d.TickCallback} tick_callback TickCallback to call when the
 *     Client ticks.
 */
o3d.Client.prototype.setTickCallback =
    function(tick_callback) {
  this.tickCallback = tick_callback;
};


/**
 * Clears the tick callback
 *
 * NOTE: The client takes ownership of the TickCallback you
 * pass in. It will be deleted if you call SetTickCallback a second
 * time or if you call clearTickCallback
 */
o3d.Client.prototype.clearTickCallback = function() {
  this.tickCallback = null;
};


/**
 * Sets a callback for when the client gets an error. For example when a shader
 * is compiled and there is an error or if you attempt to bind a param to a
 * param of an incompatible type.
 *
 * NOTE: The client takes ownership of the ErrorCallback you
 * pass in. It will be deleted if you call SetErrorCallback a
 * second time or if you call ClearErrorCallback.
 *
 * NOTE: The callback will not be called recursively. If you are in a
 * callback, and do something that causes another error before you have
 * returned from the callback, your callback will not be called a second time.
 *
 * NOTE: If you put up an alert in response to an error it is best if you
 * clear the error callback before you put up the alert. Otherwise you'll get
 * an alert everytime the client tries to render which is every time you close
 * the current alert which means you'll be in an infinite loop of alerts.
 *
 * @param {o3d.ErrorCallback} error_callback ErrorCallback to call when the
 *     Client gets an error.
 */
o3d.Client.prototype.setErrorCallback =
    function(error_callback) {
  // Other code expects to not see a null error callback.
  if (error_callback) {
    this.error_callback = error_callback;
  } else {
    this.error_callback = function(string) {};
  }
};


/**
 * Clears the Error callback
 *
 * NOTE: The client takes ownership of the ErrorCallback you
 * pass in. It will be deleted if you call SetErrorCallback a second
 * time or if you call ClearErrorCallback.
 */
o3d.Client.prototype.clearErrorCallback = function() {
  this.setErrorCallback(null);
};



/**
 * Makes all parameters get re-evaluated.
 */
o3d.Client.prototype.invalidateAllParameters = function() {
  o3d.notImplemented();
};


/**
 * Gets a copy of the current backbuffer of O3D as a data: url.
 * @param {string} mime_type The type of data url you want.
 *    Currently O3D only supports image/png. See HTML5 canvas tag
 *    for info about toDataURL.
 * @return {string}  A Data URL for the backbuffer.
 */
o3d.Client.prototype.toDataURL =
    function(opt_mime_type) {
  o3d.notImplemented();
};


/**
 * Returns the status of initializing the renderer so we can display the
 * appropriate message. We require a certain minimum set of graphics
 * capabilities. If the user's computer does not have his minimum
 * set this will be GPU_NOT_UP_TO_SPEC. If the user is out of graphics
 * resources this will be OUT_OF_RESOURCES. If some other error happened this
 * will be INITIALIZATION_ERROR. Otherwise it will be SUCCESS.
 */
o3d.Client.prototype.renderer_init_status = 0;



/**
 * Gets / Sets the cursor's shape.
 *
 * @type {o3d.Cursor}
 */
o3d.Client.prototype.cursor = null;


/**
 * The last error reported by the plugin.
 *
 * @type {string}
 */
o3d.Client.prototype.last_error_ = '';



/**
 * All the objects managed by this client.
 *
 * Each access to this field gets the entire list so it is best to get it
 * just once. For example:
 *
 * var objects = client.objects;
 * for (var i = 0; i < objects.length; i++) {
 *   var object = objects[i];
 * }
 *
 *
 * Note that modifications to this array [e.g. push()] will not affect
 * the underlying Client, while modifications to the array's members
 * will affect them.
 *
 * @type {!Array.<!o3d.ObjectBase>}
 */
o3d.Client.prototype.objects = [];



/**
 * Clears the error returned in lastError.
 */
o3d.Client.prototype.clearLastError = function () {
  o3d.notImplemented();
};



/**
 * Resets the profiling information.
 */
o3d.Client.prototype.profileReset = function() {
  o3d.notImplemented();
};



/**
 * Returns the profiling information as a string.
 *  The profiling info.
 * @return {string}
 */
o3d.Client.prototype.profileToString = function() {
  o3d.notImplemented();
};



/**
 * A unique id for this client.
 * @type {number}
 */
o3d.Client.prototype.clientId = 0;



/**
 * The canvas associated with this client.
 * @type {Element}
 */
o3d.Client.prototype.canvas = null;


