registerProcessor('bit-crusher', class BitCrusher extends AudioWorkletProcessor {

  static get parameterDescriptors () {
    return [{
      name: 'bitDepth',
      defaultValue: 12,
      minValue: 1,
      maxValue: 16 
    }, {
      name: 'frequencyReduction',
      defaultValue: 0.5,
      minValue: 0,
      maxValue: 1
    }];
  }

  constructor (options) {
    super(options);
    this._phase = 0;
    this._lastSampleValue = 0;
  }

  process (input, output, parameters) {
    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);
    let bitDepth = parameters.bitDepth;
    let frequencyReduction = parameters.frequencyReduction;

    for (let i = 0; i < 128; ++i) {
      let step = Math.pow(0.5, bitDepth[i]);
      this._phase += frequencyReduction[i];
      if (this._phase >= 1.0) {
        this._phase -= 1.0;
        this._lastSampleValue = 
          step * Math.floor(inputChannelData[i] / step + 0.5);
      }
      outputChannelData[i] = this._lastSampleValue;
    }
  }

});
