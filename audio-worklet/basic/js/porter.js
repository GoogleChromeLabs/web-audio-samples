/**
 * ---
 * 
 * @class ---
 * @extends AudioWorkletProcessor
 */
class PorterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastRQ = 0;
    this.port.onmessage = this.handleMessage.bind(this);
    // console.log('processor = ', this.port);
    // this.port.postMessage({timeStamp: currentTime});
  }

  handleMessage(event) {
    console.log('[PROCESSOR:received]', event.data);
  }

  process(inputs, outputs) {
    if (currentTime - this._lastRQ > 1.0) {
      // this.port.postMessage({timeStamp: currentTime});
      this._lastRQ = currentTime;
    }

    return true;
  }
}

registerProcessor('porter', PorterProcessor);
