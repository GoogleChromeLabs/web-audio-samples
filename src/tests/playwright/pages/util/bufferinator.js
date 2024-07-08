import { record } from "../processors/recorder/recorder-main.js";

export const bufferinator = async (ctx, length, graph) => {
  if (ctx instanceof AudioContext) {
    const {recorder, bufferPromise} = await record(ctx, length);
    graph.get(ctx)?.forEach(([from, to]) => {
      if (to instanceof AudioDestinationNode) {
        from._WAS_disconnect(to);
        from._WAS_connect(recorder);
      }
    });

    recorder._WAS_connect(ctx.destination);
    ctx.resume();

    // for realtime
    return await bufferPromise;
  }

  // for offline
  return  ctx.startRendering();
};
