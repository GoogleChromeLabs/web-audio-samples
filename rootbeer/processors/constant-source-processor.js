class RB_ConstantSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
      return [{
	    name: 'offset',
		  defaultValue: 1,
		  minValue: -100,
		  maxValue: 100,
		  automationRate: 'a-rate'
	  }];
  }

  constructor (options) {
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
	      this._startFrame = this._startFrame * sampleRate;
	      console.log(`processor start ${this._startTime}`);
	  }
      
	  if (event.data.hasOwnProperty('stopTime')) {
	      this._stopTime = event.data.stopTime  || currentTime;
	      this._stopFrame = this._stopTime * sampleRate;
	      console.log(`processor stop ${this._startTime}`);
	  }
      }
      this.port.start();
  }

  process (inputs, outputs, parameters) {
      let output = outputs[0][0];

      if (currentTime > this._stopTime) {
	  // Stop time has passed so output silence
	  output.fill(0);
	  return true;
      }

      if (currentTime + 128 / sampleRate < this._startTime) {
	  // Node won't start anytime in the current render quantum,
	  // so output silence.
	  output.fill(0);
	  return true;
      }

      console.log(`startTime ${this._startTime}, end ${this._stopTime}, current ${currentTime}`);
      // We're playing.  Figure out where in the current quantum we
      // should start and/or stop.
      let startFrame = Math.floor(Math.max(0, (this._startTime - currentTime) * sampleRate));
      let endFrame = Math.floor(Math.min(128, (this._stopTime - currentTime) * sampleRate));

      let offset = parameters.offset;

      console.log(`startFrame ${startFrame}, end ${endFrame}`);
      if (startFrame == 0 && endFrame == 128) {
	  console.log(`Fast case, offset.len = ${offset.length}`)
	  // The fast case
	  if (offset.length == 1) {
	      console.log(`offset value = ${offset[0]}`);
	      // offset AudioParam is constant
	      output.fill(offset[0]);
	  } else {
	      // Copy the offset values to the output.
	      output.set(offset);
	  }
      } else {
	  console.log(`Slow case, start = ${startFrame}, end = ${endFrame}`);
	  // The slow case where the node starts (or ends) somewhere
	  // in the middle of the current render quantum.
	  let k;

	  // Output zero if we haven't started.
	  for (k = 0; k < startFrame; ++k) {
	      output[k] = 0;
	  }
	  
	  // Copy the offset values(s) to the output
	  for (k = startFrame; k < endFrame; ++k) {
	      output[k] = offset.length == 1 ? offset[0] : offset[k];
	  }

	  // If we've ended before the end of the current quantum, output 0.
	  for (k = endFrame; k < 128; ++k) {
	      output[k] = 0;
	  }
      }	  

      return true;
  }
}
	    
registerProcessor("rb-constant-source-processor", RB_ConstantSourceProcessor);
