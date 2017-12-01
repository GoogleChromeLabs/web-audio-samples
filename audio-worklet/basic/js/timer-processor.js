/**
 * @class TimerProcessor
 * @extends AudioWorkletProcessor
 *
 * This processor class is for the life cycle and the processor state event.
 * It only lives for 1 second.
 */
class TimerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.createdAt_ = currentTime;
    this.lifetime_ = 1.0;
  }

  process() {
    return currentTime - this.createdAt_ > this.lifetime_ ? false : true;
  }
}

registerProcessor('timer-processor', TimerProcessor);
