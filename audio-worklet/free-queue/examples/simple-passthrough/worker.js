import { FreeQueueSAB } from "../../../../lib/free-queue/free-queue-sab.js";
import { FRAME_SIZE } from "./constants.js";

/**
 * Worker message event handler.
 * This will initialize worker with FreeQueue instance and set loop for audio
 * processing. 
 */
self.onmessage = (msg) => {
  if (msg.data.type === "init") {
    let { inputQueue, outputQueue, atomicState } = msg.data.data;
    Object.setPrototypeOf(inputQueue, FreeQueueSAB.prototype);
    Object.setPrototypeOf(outputQueue, FreeQueueSAB.prototype);
    
    // buffer for storing data pulled out from queue.
    const input = new Float32Array(FRAME_SIZE);
    // loop for processing data.
    while (Atomics.wait(atomicState, 0, 0) === 'ok') {
      
      // pull data out from inputQueue.
      const didPull = inputQueue.pull([input], FRAME_SIZE);
      
      if (didPull) {
        // If pulling data out was successfull, process it and push it to
        // outputQueue
        const output = input.map(sample => 0.1 * sample);
        outputQueue.push([output], FRAME_SIZE);
      } 

      Atomics.store(atomicState, 0, 0);
    }
  }
};
