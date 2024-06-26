import record from "../processors/recorder/recorder-main";

export const bufferinator = async (ctx, length, graph) => {
  if (ctx instanceof AudioContext) {
    const {recorder, buffer} = await record(ctx, length);
    recorder.connect(ctx.destination);
    graph.get(ctx)?.forEach(([from, to]) => {
      if (to instanceof AudioDestinationNode) {
        from.disconnect(to);
        from.connect(recorder);
      }
    });

    return await buffer;
  }

  return ctx.startRendering();
};
