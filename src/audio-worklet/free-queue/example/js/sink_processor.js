import { FreeQueue } from './freequeue.mjs';

class SinkProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.fq = options.processorOptions.fq;
        this.state = options.processorOptions.state;
        Object.setPrototypeOf(this.fq, FreeQueue.prototype)
        this.time = 0;
    }

    process(inputs, outputs) {
        const output_buffer = outputs[0];
        
        this.fq.pull(output_buffer, 128);
        
        if (!this.fq.isFrameAvailable(512))
            Atomics.notify(this.state, 0, 1);
        
        return true;
    }

}


registerProcessor('sink_processor', SinkProcessor);