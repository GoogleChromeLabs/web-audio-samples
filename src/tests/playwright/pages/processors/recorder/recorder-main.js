export default async (ctx, length) => {
  console.assert(ctx instanceof AudioContext);
  console.assert(typeof length === 'number' && length > 0);

  const maxSamps = length * ctx.sampleRate;

  await ctx.audioWorklet.addModule('./processors/recorder/recorder-processor.js');

  const recorder = new AudioWorkletNode(ctx, 'recorder', {
    processorOptions: {
      maxSamps
    }
  });

  let bufferResolve;
  recorder.port.onmessage = (e) => {
    if (e.data.message === 'RECORD_DONE') {
      // Resolve bufferData to buffer
      const bufferData = e.data.buffer;
      const audioBuffer = new AudioBuffer({
        length: maxSamps,
        sampleRate: ctx.sampleRate,
        numberOfChannels: bufferData.length
      })
      bufferData.forEach((array, i) => audioBuffer.copyToChannel(array, i));

      bufferResolve(audioBuffer)
    }
  };

  // eslint-disable-next-line no-async-promise-executor
  const buffer = new Promise(async (resolve) => {
    bufferResolve = resolve;
  });

  return {recorder, buffer};
};
