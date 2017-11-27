/**
 * A simple MessagePort tester.
 * 
 * @class PortProcessor
 * @extends AudioWorkletProcessor
 */
class PortProcessor extends AudioWorkletProcessor {
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
    // Post a message to the node for every 1 second.
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

registerProcessor('port-processor', PortProcessor);
