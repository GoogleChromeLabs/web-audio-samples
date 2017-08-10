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

/**
 * @class NoiseGate
 * @extends AudioWorkletProcessor
 * @description A noise gate allows audio signals to pass only when the
 * registered volume is above a specified threshold.
 */
registerProcessor('noisegate-audio-worklet',
                  class NoiseGateAudioWorklet extends AudioWorkletProcessor {
  
  static get parameterDescriptors() {
    return [
    // An upper bound of 100ms for attack and release is sufficiently high
    // to enable smooth transitions between sound and silence.
    // The default value of 50ms has been set experimentally to minimize
    // glitches in the demo.
    {
      name: 'attack',
      defaultValue: 0.05,
      minValue: 0,
      maxValue: 0.1
    },
    {
      name: 'release',
      defaultValue: 0.05,
      minValue: 0,
      maxValue: 0.1
    },
    // The maximum threshold is 0 since that is the defined maximum in dBFS.
    // The minimum is -100 dBFS since the sound is inaudible at that
    // level even without the noise gate's interference. The default is set to
    // -40 since the noise in the demo (with a gain of 1) will be muted during
    // pauses at this value but the recorded voice sample will not be muted.
    {
      name: 'threshold',
      defaultValue: -40,
      minValue: -100,
      maxValue: 0
    },
    // The default timeConstant has been set experimentally to 0.0025s to
    // balance delay for high frequency suppression. The maximum value is set
    // somewhat arbitrarily at 0.1 since the envelope is very delayed at values
    // beyond this.
    {
      name: 'timeConstant',
      defaultValue: 0.0025,
      minValue: 0,
      maxValue: 0.1
    }];
  }

  constructor() {
    super();

    // The previous envelope level, a float representing signal amplitude.
    this.previousLevel_ = 0;

    // The last weight (between 0 and 1) assigned, where 1 means the gate
    // is open and 0 means it is closed and the sample in the output buffer is
    // muted. When attacking, the weight will linearly decrease from 1 to 0, and
    // when releasing the weight linearly increase from 0 to 1.
    this.previousWeight_ = 1.0;
    this.envelope_ = new Float32Array(128);
    this.weights_ = new Float32Array(128);

    // TODO: Use getContextInfo() to get sample rate.
    this.sampleRate = 44100;
  }

  /**
   * Control the dynamic range of input based on specified threshold.
   * @param {AudioBuffer} input Input audio data
   * @param {AudioBuffer} output Output audio data
   * @param {Object} parameters
   * @param {Number} parameters.attack Seconds for gate to fully close.
   * @param {Number} parameters.release Seconds for gate to fully open.
   * @param {Number} parameters.timeConstant Seconds for envelope follower's
   *                                         smoothing filter delay.
   * @param {Number} parameters.threshold Decibel level beneath which sound is
   *                                      muted.
   */
  process(input, output, parameters) {
    // Alpha controls a tradeoff between the smoothness of the
    // envelope and its delay, with a higher value giving more smoothness at
    // the expense of delay and vice versa.
    this.alpha_ = this.getAlphaFromTimeConstant_(
        parameters.timeConstant[0], this.sampleRate);

    // The a-rate audio-params are used as k-rate audio-params.
    this.attack = parameters.attack[0];
    this.release = parameters.release[0];
    this.threshold = parameters.threshold[0];

    let inputChannelData = input.getChannelData(0);
    let outputChannelData = output.getChannelData(0);

    let envelope = this.detectLevel_(inputChannelData);
    let weights = this.computeWeights_(envelope);

    for (let j = 0; j < inputChannelData.length; j++) {
      outputChannelData[j] = weights[j] * inputChannelData[j];
    }
  }

  /**
   * Compute an envelope follower for the signal.
   * @param {Float32Array} channelData Input channel data.
   * @return {Float32Array} The level of the signal.
   */
  detectLevel_(channelData) {
    // The signal level is determined by filtering the square of the signal
    // with exponential smoothing. See
    // http://www.aes.org/e-lib/browse.cfm?elib=16354 for details.
    this.envelope_[0] = this.alpha_ * this.previousLevel_ +
        (1 - this.alpha_) * Math.pow(channelData[0], 2);

    for (let j = 1; j < channelData.length; j++) {
      this.envelope_[j] = this.alpha_ * this.envelope_[j - 1] +
          (1 - this.alpha_) * Math.pow(channelData[j], 2);
    }
    this.previousLevel_ = this.envelope_[this.envelope_.length - 1];

    return this.envelope_;
  }

  /**
   * Computes an array of weights which determines what samples are silenced.
   * @param {Float32Array} envelope The output from envelope follower.
   * @return {Float32Array} weights Numbers in the range 0 to 1 set in
   *                                accordance with the threshold, the envelope,
   *                                and attack and release.
   */
  computeWeights_(envelope) {
    // When attack or release are 0, the weight changes between 0 and 1
    // in one step.
    let attackSteps = 1;
    let releaseSteps = 1;
    let attackLossPerStep = 1;
    let releaseGainPerStep = 1;

    // TODO: Replace this weights-based approach for enabling attack/release
    // parameters with the method described on page 22 in
    // "Signal Processing Techniques for Digital Audio Effects".

    // When attack or release are > 0, the associated weight changes between 0
    // and 1 in the number of steps corresponding to the millisecond attack
    // or release time parameters.
    if (this.attack > 0) {
      attackSteps = Math.ceil(this.sampleRate * this.attack);
      attackLossPerStep = 1 / attackSteps;
    }
    if (this.release > 0) {
      releaseSteps = Math.ceil(this.sampleRate * this.release);
      releaseGainPerStep = 1 / releaseSteps;
    }
    // For sine waves, the envelope eventually reaches an average power of
    // a^2 / 2. Sine waves are therefore scaled back to the original
    // amplitude, but other waveforms or constant sources can only be
    // approximated.
    let scaledEnvelopeValue;
    let weight;

    // Compute an array of weights between 0 and 1 which will be multiplied with
    // the channel depending on if the noise gate is open, attacking, releasing,
    // or closed.
    for (let i = 0; i < envelope.length; i++) {
      scaledEnvelopeValue = NoiseGateAudioWorklet.toDecibel(2 * envelope[i]);
      
      if (scaledEnvelopeValue < this.threshold) {
        weight = this.previousWeight_ - attackLossPerStep;
        this.weights_[i] = Math.max(weight, 0);
      } else {
        weight = this.previousWeight_ + releaseGainPerStep;
        this.weights_[i] = Math.min(weight, 1);
      }
      this.previousWeight_ = this.weights_[i];
    }
    return this.weights_;
  }

  /**
   * Computes the filter coefficent for the envelope filter.
   * @param  {Number} timeConstant The time in seconds for filter to reach
   *                               1 - 1/e of its value given a transition from
   *                               0 to 1.
   * @param  {Number} sampleRate The number of samples per second.
   * @return {Number} Coefficient governing envelope response.
   */
  getAlphaFromTimeConstant_(timeConstant, sampleRate) {
    return Math.exp(-1 / (sampleRate * timeConstant));
  }

  /**
   * Converts number into decibel measure.
   * @param  {Number} powerLevel The power level of the signal.
   * @return {Number} The dBFS of the power level.
   */
  static toDecibel(powerLevel) {
    return 10 * Math.log10(powerLevel);
  }
});
