import FQC from '../build/main.js';
import { FreeQueue } from './freequeue.mjs';

const init = (Module) => {
    Module.callMain();
    
    let fqPointer = Module._getFreeQueue();

    let get_free_queue_pointers = Module.cwrap("get_free_queue_pointers", "number", ["number", "string"]);

    let bufferLengthPointer = get_free_queue_pointers(fqPointer, "bufferLength");
    let channelCountPointer = get_free_queue_pointers(fqPointer, "channelCount");
    let statePointer = get_free_queue_pointers(fqPointer, "state");
    let channelsPointer = get_free_queue_pointers(fqPointer, "channels");

    const pointers = {
        memory: Module.wasmMemory,
        bufferLengthPointer,
        channelCountPointer,
        statePointer,
        channelsPointer
    }

    let fq = FreeQueue.fromPointers(pointers)
    return fq;
}


(async () => {
    let Module = await FQC();
    let fq = init(Module);
    let state = new Int32Array(new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT));
    
    postMessage({ fq, state });
    
    while (Atomics.wait(state, 0, 0) === 'ok') {
        Module._process();
    }
})();