import FreeQueue from "./lib/free-queue.js";
import GPUProcessor from "./gpu-processor.js";
import IRHelper from "./ir-helper.js"
import { FRAME_SIZE } from "./constants.js";

/**
 * Worker message event handler.
 * This will initialize worker with FreeQueue instance and set loop for audio
 * processing. 
 */
self.onmessage = async (msg) => {
  if (msg.data.type === "init") {
    let { inputQueue, outputQueue, atomicState } = msg.data.data;
    Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
    Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

    const gpuProcessor = new GPUProcessor();
    await gpuProcessor.init();
    
    // buffer for storing data pulled out from queue.
    const input = new Float32Array(FRAME_SIZE);
    // loop for processing data.
    while (Atomics.wait(atomicState, 0, 0) === 'ok') {      
      // pull data out from inputQueue.
      const start = performance.now();
      const didPull = inputQueue.pull([input], FRAME_SIZE);
      if (didPull) {
        // If pulling data out was successfull, process it and push it to
        // outputQueue.

        const output_old = input.map(sample => 0.1 * sample);
        const end_old = performance.now();
        console.log("Time for output using FIFO Queue "+(end_old - start)+" ms");

        const start_new = performance.now();
        const output = await gpuProcessor.processInputAndReturn(input);
        const end_new = performance.now();
        console.log("Time for GPU Processing "+(end_new - start_new)+" ms.");
        outputQueue.push([output], FRAME_SIZE);
      } 

      Atomics.store(atomicState, 0, 0);
    }
  }
};
