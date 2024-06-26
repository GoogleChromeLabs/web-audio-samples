import record from "../processors/recorder/recorder-main.js";

export const bufferinator = async (ctx, length, graph) => {
  if (ctx instanceof AudioContext) {
    const {recorder, buffer} = await record(ctx, length);
    graph.get(ctx)?.forEach(([from, to]) => {
      if (to instanceof AudioDestinationNode) {
        from._WAS_disconnect(to);
        from._WAS_connect(recorder);
      }
    });

    recorder.connect(ctx.destination);
    ctx.resume();

    // for realtime
    return await buffer;
  }

  // for offline
  return  ctx.startRendering();
};
