import FreeQueue from "./lib/free-queue.js";
import GPUProcessor from "./gpu-processor.js";
import { FRAME_SIZE } from "./constants.js";

let inputQueue = null;
let outputQueue = null;
let atomicState = null;
let gpuProcessor = null;
let inputBuffer = null;
let irArray = null;
let sampleRate = null;

// Performance metrics
let lastCallback = 0;
let averageTimeSpent = 0;
let timeElapsed = 0;
let runningAverageFactor = 1;

// This will initialize worker with FreeQueue instance and set loop for audio
// processing.
const initialize = async (messageDataFromMainThread) => {
  ({inputQueue, outputQueue, atomicState, irArray, sampleRate} 
      = messageDataFromMainThread);
  Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
  Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

  // A local buffer to store data pulled out from `inputQueue`.
  inputBuffer = new Float32Array(FRAME_SIZE);

  // Create an instance of GPUProcessor and provide an IR array.
  gpuProcessor = new GPUProcessor();
  gpuProcessor.setIRArray(irArray);
  await gpuProcessor.initialize();

  // How many "frames" gets processed over 1 second (1000ms)?
  runningAverageFactor = sampleRate / FRAME_SIZE;

  console.log('[worker.js] initialize()');
};

const process = async () => {
  if (!inputQueue.pull([inputBuffer], FRAME_SIZE)) {
    console.error('[worker.js] Pulling from inputQueue failed.');
    return;
  }

  // 1. Bypassing
  // const outputBuffer = inputBuffer;

  // 2. Bypass via GPU.
  const outputBuffer = await gpuProcessor.processBypass(inputBuffer);

  // 3. Convolution via GPU
  // const outputBuffer = await gpuProcessor.processConvolution(inputBuffer);

  if (!outputQueue.push([outputBuffer], FRAME_SIZE)) {
    console.error('[worker.js] Pushing to outputQueue failed.');
    return;
  }
};

self.onmessage = async (message) => {
  console.log('[worker.js] onmessage: ' + message.data.type);

  if (message.data.type !== 'init') {
    console.error(`[worker.js] Invalid message type: ${message.data.type}`);
    return;
  }

  await initialize(message.data.data);

  // This loop effectively disables the interaction (postMessage) with the
  // main thread once it kicks off.
  while (true) {
    if (Atomics.wait(atomicState, 0, 1) === 'ok') {
      const processStart = performance.now();
      const callbackInterval = processStart - lastCallback;
      lastCallback = processStart;
      timeElapsed += callbackInterval;

      // Processes "frames" from inputQueue and pass the result to outputQueue.
      await process();

      // Approximate running average of process() time.
      const timeSpent = performance.now() - processStart;
      averageTimeSpent -= averageTimeSpent / runningAverageFactor;
      averageTimeSpent += timeSpent / runningAverageFactor;

      // Throttle the log by 1 second.
      if (timeElapsed >= 1000) {
        console.log(
          `[worker.js] process() = ${timeSpent.toFixed(3)}ms : ` +
          `avg = ${averageTimeSpent.toFixed(3)}ms : ` +
          `callback interval = ${(callbackInterval).toFixed(3)}ms`);  
        timeElapsed -= 1000;
      }

      Atomics.store(atomicState, 0, 0);
    }
  }
};

console.log('[worker.js] loaded.');
