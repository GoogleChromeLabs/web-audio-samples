import audioBufferToWav from './audioBufferToWav.js';
import record from './recorder/main.js';

// eslint-disable-next-line no-async-promise-executor
window.updateFrequencyPromise = new Promise(async (resolve) => {
  const ctx = new AudioContext();
  const helloSine = new OscillatorNode(ctx);
  const {recorder, buffer} = await record(ctx, helloSine);

  helloSine.connect(recorder).connect(ctx.destination);

  const start = performance.now();

  helloSine.start();
  helloSine.stop(ctx.currentTime + 1);

  const latency = await new Promise((resolve) =>
    helloSine.onended = () => resolve(ctx.baseLatency));

  const end = performance.now();

  const blob = audioBufferToWav(await buffer, false);

  await ctx.close();

  resolve({latency, time: end - start, blob});
});
