const graph = new Map();

export const createGraphCache = () => {
  const connect = AudioNode.prototype.connect;
  const disconnect = AudioNode.prototype.disconnect;

  AudioNode.prototype.connect = function () {
    if (!graph.has(this.context)) {
      graph.set(this.context, new Set());
    }
    graph.get(this.context).add([this, arguments[0]]);
    return connect.apply(this, arguments);
  };
  AudioNode.prototype.disconnect = function () {
    graph.get(this.context).delete([this, arguments[0]]);
    return disconnect.apply(this, arguments);
  };

  return graph;
};
