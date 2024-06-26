import concat from '../../util/concat.js';

export default async (ctx, length) => {
  console.assert(ctx instanceof AudioContext);
  console.assert(length instanceof Number);

  const mutex = new Promise((resolve) =>
    setTimeout(resolve, 1000 * length));

  await ctx.audioWorklet.addModule('./processors/recorder/recorder-processor.js');

  const recorder = new AudioWorkletNode(ctx, 'recorder');

  const arrays = [];
  recorder.port.onmessage = (e) => {
    !(e.data.channel in arrays) && (arrays[e.data.channel] = []);
    arrays[e.data.channel].push(e.data.data);
  };

  // eslint-disable-next-line no-async-promise-executor
  const buffer = new Promise(async (resolve) => {
    await mutex;
    const res = [];
    arrays.forEach((array, i) => res[i] = concat(...array));

    const buf = new AudioBuffer({
      length: res[0].byteLength,
      sampleRate: ctx.sampleRate,
      numberOfChannels: res.length,
    });

    res.forEach((array, i) => buf.copyToChannel(array, i));

    resolve(res[0]);
  });

  return {recorder, buffer};
};
