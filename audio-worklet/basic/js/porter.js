/**
 * A simple MessagePort tester.
 * 
 * @class PorterProcessor
 * @extends AudioWorkletProcessor
 */
class PorterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastUpdate = currentTime;
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    console.log('[Processor:Received] "' + event.data.message + 
                '" (' + event.data.timeStamp + ')');
  }

  process() {
    if (currentTime - this._lastUpdate > 1.0) {
      this.port.postMessage({
        message: 'Process is called.',
        timeStamp: currentTime
      });
      this._lastUpdate = currentTime;
    }

    return true;
  }
}

registerProcessor('porter', PorterProcessor);
