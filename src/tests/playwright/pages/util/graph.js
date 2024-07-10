/**
 * Creates a cache for the graph of connected nodes in AudioContexts.
 *
 * @return {Map} The map containing the graph of connected nodes.
 */
export const createGraphCache = () => {
  const graph = new Map();

  const connect = AudioNode.prototype.connect;
  const disconnect = AudioNode.prototype.disconnect;

  AudioNode.prototype._webAudioConnect = connect;
  AudioNode.prototype._webAudioDisconnect = disconnect;

  AudioNode.prototype.connect = function(...args) {
    if (!graph.has(this.context)) {
      graph.set(this.context, new Set());
    }
    graph.get(this.context).add([this, args[0]]);
    return connect.apply(this, args);
  };
  AudioNode.prototype.disconnect = function(...args) {
    graph.get(this.context).delete([this, args[0]]);
    return disconnect.apply(this, args);
  };

  return graph;
};
