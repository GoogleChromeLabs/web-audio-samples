import FreeQueue from "./lib/free-queue.js";
import GPUProcessor from "./gpu-processor.js";
import { createTestIR } from "./ir-helper.js"
import { FRAME_SIZE } from "./constants.js";

// Harmful globals
let inputQueue = null;
let outputQueue = null;
let atomicState = null;
let gpuProcessor = null;
let inputBuffer = null;

// Performance metrics
let lastCallback = 0;
let averageTimeSpent = 0;

// This will initialize worker with FreeQueue instance and set loop for audio
// processing.
const initialize = async (messageDataFromMainThread) => {
  inputQueue = messageDataFromMainThread.inputQueue;
  outputQueue = messageDataFromMainThread.outputQueue;
  atomicState = messageDataFromMainThread.atomicState;
  Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
  Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

  // A local buffer to store data pulled out from `inputQueue`.
  inputBuffer = new Float32Array(FRAME_SIZE);

  // Create an instance of GPUProcessor and provide an IR array.
  gpuProcessor = new GPUProcessor();
  gpuProcessor.setIRArray(createTestIR());
  await gpuProcessor.initialize();

  console.log('[worker.js] initialize()');
};

const process = async () => {
  const processStart = performance.now();
  
  if (!inputQueue.pull([inputBuffer], FRAME_SIZE)) {
    console.error('[worker.js] Pulling from inputQueue failed.');
    return;
  }
  const output = await gpuProcessor.processInputAndReturn(inputBuffer);
  outputQueue.push([output], FRAME_SIZE);

  // Rolling average of process() time.
  const timeSpent = performance.now() - processStart;
  averageTimeSpent -= averageTimeSpent / 20;
  averageTimeSpent += timeSpent / 20;

  console.log(`[worker.js] process() = ${timeSpent.toFixed(2)}ms : ` +
              `avg = ${averageTimeSpent.toFixed(2)}ms : ` +
              `interval = ${(processStart - lastCallback).toFixed(2)}ms`);
  lastCallback = processStart;
};

self.onmessage = async (message) => {
  if (message.data.type !== 'init') {
    console.error(`[worker.js] Invalid message type: ${message.data.type}`);
    return;
  }

  await initialize(message.data.data);
  while (Atomics.wait(atomicState, 0, 0) === 'ok') {
    await process();
    Atomics.store(atomicState, 0, 0);
  }
};

console.log('[worker.js] loaded.');
