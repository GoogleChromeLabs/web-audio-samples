class RB_ConstantSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [ {
      name : 'offset',
      defaultValue : 1,
      minValue : -100,
      maxValue : 100,
      automationRate : 'a-rate'
    } ];
  }

  constructor(options) {
    super(options);
    // Start and stop times for the node.
    this._startTime = Infinity;
    this._stopTime = Infinity;
    this._startFrame = Infinity;
    this._stopFrame = Infinity;

    this.port.onmessage = event => {
      console.log(`Got processor event time = ${currentTime}`);
      console.log(event);
      if (event.data.hasOwnProperty('startTime')) {
        this._startTime = event.data.startTime || currentTime;
        this._startFrame = this._startTime * sampleRate;
        console.log(`processor start ${this._startTime}`);
      }

      if (event.data.hasOwnProperty('stopTime')) {
        this._stopTime = event.data.stopTime || currentTime;
        this._stopFrame = this._stopTime * sampleRate;
        console.log(`processor stop ${this._startTime}`);
      }
      console.log(`Node times: ${this._startTime} (${this._startFrame}) ${
          this._stopTime} (${this._stopFrame})`);
    };
  }

  process(inputs, outputs, parameters) {
    let output = outputs[0][0];
    const framesToProcess = output.length;

    console.log(`Process currentFrame ${currentFrame} start = ${
        this._startFrame}, end = ${this._stopFrame}`);

    if (currentFrame > this._stopFrame) {
      // Stop time has passed so output silence
      console.log('Ended');
      output.fill(0);
      return true;
    }

    if (currentFrame + framesToProcess < this._startFrame) {
      // Node won't start anytime in the current render quantum,
      // so output silence.
      console.log('Not started');
      output.fill(0);
      return true;
    }

    console.log('Node processing');

    const offset = parameters.offset;
    let k = 0;
    let frame = currentFrame;

    // Node hasn't started yet
    for (; frame < this._startFrame; ++frame, ++k) {
      output[k] = 0;
    }

    // Node has started somewhere in this render
    for (; frame < this._stopFrame && k < framesToProcess; ++frame, ++k) {
      output[k] = offset.length == 1 ? offset[0] : offset[k];
    }

    // Node ended somewhere in this render
    for (; this._stopFrame >= frame && k < framesToProcess; ++frame, ++k) {
      output[k] = 0;
    }

    return true;
  }
}

registerProcessor("rb-constant-source-processor", RB_ConstantSourceProcessor);
