import FreeQueue from "./lib/free-queue.js";
import GpuProcessor from "./gpu-processor.js";
import { FRAME_SIZE } from "./constants.js";

/**
 * Worker message event handler.
 * This will initialize worker with FreeQueue instance and set loop for audio
 * processing. 
 */
self.onmessage = (msg) => {
  if (msg.data.type === "init") {
    let { inputQueue, outputQueue, atomicState } = msg.data.data;
    Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
    Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

    const gpuProcessor = new GpuProcessor();
    
    // buffer for storing data pulled out from queue.
    const input = new Float32Array(FRAME_SIZE);
    // loop for processing data.
    while (Atomics.wait(atomicState, 0, 0) === 'ok') {
      console.log('Im inside the while');
      
      // pull data out from inputQueue.
      const didPull = inputQueue.pull([input], FRAME_SIZE);
      if (didPull) {
        // If pulling data out was successfull, process it and push it to
        // outputQueue

        const output = gpuProcessor.process(input);
        
        outputQueue.push([output], FRAME_SIZE);
      } 

      Atomics.store(atomicState, 0, 0);
    }
  }
};
