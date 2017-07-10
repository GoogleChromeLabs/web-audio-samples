/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class NoiseGate {
  /**
   * A Noise gate allows audio signals to pass only when the registered volume
   * is above a specified threshold.
   * @param {BaseAudioContext} context the audio context
   * @param {Number} options.channels the number of input and output
   *                                  channels, a maximum of two
   * @param {Object} options parameters for the noise gate
   * @param {Number} options.attack seconds for gate to fully close
   * @param {Number} options.release seconds for gate to fully open
   * @param {Number} options.bufferSize the size of an onaudioprocess window
   * @param {Number} options.alpha seconds for envelope follower's smoothing
   *                                   filter alpha weight
   * @param {Number} options.threshold decibel level beneath which sound is
   *                                   muted
   */
  constructor(context, options) {
    if (!(context instanceof BaseAudioContext))
      throw 'Not a valid audio context.';
    if (!options) options = {};
    const numberOfChannels = options.numberOfChannels || 1;
    if (numberOfChannels > 2)
      throw 'The maximum supported number of channels is two.';

    this.context_ = context;
    const bufferSize = options.bufferSize || 0;
    this.threshold = options.threshold || 0;
    this.attack = options.attack || 0;
    this.release = options.release || 0;

    // Alpha controls a tradeoff between the smoothness of the
    // envelope and its delay, with a higher value giving more smoothness at
    // the expense of delay and vice versa. The time constant of the filter
    // has been set experimentally to minimize delay while still adequately
    // suppressing high frequency oscillation.
    this.alpha_ = this.getTimeConstant_(0.0025);
   
    this.node_ = this.context_.createScriptProcessor(
        bufferSize, numberOfChannels, numberOfChannels);
    this.node_.onaudioprocess = this.onaudioprocess_.bind(this);

    // The noise gate is connected to and from by dummy input and output nodes.
    this.input = new GainNode(this.context_);
    this.output = new GainNode(this.context_);
    this.input.connect(this.node_).connect(this.output);

    // The last envelope level of a given buffer.
    this.lastLevel_ = 0;

    // The last weight (between 0 and 1) assigned, where 1 means the gate
    // is open and 0 means it is closed and the sample in the output buffer is
    // muted.
    this.lastWeight_ = 1.0;
    this.channel_ = new Float32Array(this.node_.bufferSize);
    this.envelope_ = new Float32Array(this.node_.bufferSize);
    this.weights_ = new Float32Array(this.node_.bufferSize);
  }

  /**
   * Gradually mutes input which registers beneath specified threshold.
   * @param {AudioProcessingEvent} event event object containing
   *                                     input and output buffers
   */
  onaudioprocess_(event) {
    // Stereo input is downmixed to mono input via averaging.
    if (event.inputBuffer.numberOfChannels === 2) {
      for (let i = 0; i < event.inputBuffer.length; i++) {
        this.channel_[i] = (event.inputBuffer.getChannelData(0)[i] +
                           event.inputBuffer.getChannelData(1)[i]) / 2;
      }
    } else {
      this.channel_ = event.inputBuffer.getChannelData(0);
    }

    let envelope = this.detectLevel_(this.channel_);

    for (let i = 0; i < event.inputBuffer.numberOfChannels; i++) {
      let input = event.inputBuffer.getChannelData(i);
      let output = event.outputBuffer.getChannelData(i);
      let weights = this.computeGain_(envelope);

      for (let j = 0; j < input.length; j++) {
        output[j] = weights[j] * input[j];
      }
    }
  }

  /**
   * Detect level using the difference equation for the Root Mean Squared
   * value of the input signal.
   * @param {Float32Array} input audio buffer
   * @return {Float32Array} the level of the signal
   */
  detectLevel_(channel) {
    // The signal level is determined by filtering high frequency oscillation
    // with exponential smoothing.
    // This is equivalent to computing the root-mean-square (RMS) value
    // of the signal. See http://www.aes.org/e-lib/browse.cfm?elib=16354 for
    // details.
    this.envelope_[0] = this.alpha_ * this.lastLevel_ +
        (1 - this.alpha_) * Math.pow(channel[0], 2);

    for (let j = 1; j < channel.length; j++) {
      this.envelope_[j] = this.alpha_ * this.envelope_[j - 1] +
          (1 - this.alpha_) * Math.pow(channel[j], 2);
    }
    this.lastLevel_ = this.envelope_[this.envelope_.length - 1];

    // For sine waves, the envelope eventually reaches an average power of
    // a^2 / 2. Sine waves are therefore scaled back to the original amplitude,
    // but other waveforms or constant sources can only be approximated.
    for (let k = 0; k < this.envelope_.length; k++) {
      this.envelope_[k] =  Math.sqrt(this.envelope_[k]) * Math.sqrt(2);
    }
    return this.envelope_;
  }

  /**
   * Computes an array of weights which determines what samples are silenced.
   * @param {Float32Array} envelope_ the level of the input
   * @return {Float32Array} weights numbers in the range 0 to 1 set in
   *                                accordance with the threshold, the envelope,
   *                                and attack and release
   */
  computeGain_(envelope) {
    // When attack or release are 0, the weight changes between 0 and 1
    // in one step.
    let attackSteps = 1;
    let releaseSteps = 1;
    let attackLossPerStep = 1;
    let releaseGainPerStep = 1;

    // When attack or release are > 0, the associated weight changes between 0
    // and 1 in the number of steps corresponding to the millisecond attack
    // or release time parameters.
    if (this.attack > 0) {
      attackSteps = Math.ceil(this.context_.sampleRate * this.attack);
      attackLossPerStep = 1 / attackSteps;
    }
    if (this.release > 0) {
      releaseSteps = Math.ceil(this.context_.sampleRate * this.release);
      releaseGainPerStep = 1 / releaseSteps;
    }

    // Compute an array of weights which will be multiplied with the channel.
    // Based on the detected level and indexes which persist between subsequent
    // calls to onaudioprocess, the noise gate at iteration i is in one of
    // four states: open, closed, attacking (between open and closed), or
    // releasing (between closed and open).
    for (let i = 0; i < envelope.length; i++) {
      if (this.toDecibel_(envelope[i]) < this.threshold) {
        const weight = this.lastWeight_ - attackLossPerStep;
        this.weights_[i] = weight > 0 ? weight : 0;
      }
      else {
        const weight = this.lastWeight_ + releaseGainPerStep;
        this.weights_[i] = weight < 1 ? weight : 1;
      }
      this.lastWeight_ = this.weights_[i];
    }
    return this.weights_;
  }

  getTimeConstant_(timeConstant) {
    let alpha = Math.exp(-1 / (this.context_.sampleRate * timeConstant));
    return alpha;
  }

  toDecibel_(linearValue) {
    return 20 * Math.log10(linearValue);
  }
}
