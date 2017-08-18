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
 * @class NoiseGateSideChain
 * @description This script-processor-wrapper class is similar to
 * audio-worklet/src/noise-gates-script-processor.js. NoiseGateSideChain builds
 * an envelope on the the input from the third channel and returns the output of
 * the first and second input channels with the samples muted (according to
 * attack and release) when the level in the third channel registers above
 * the specified threshold.
 */
class NoiseGateSideChain {
  /**
   * @constructor
   * @param {BaseAudioContext} context The audio context
   * @param {Object} options Parameters for the noise gate.
   * @param {Number} options.attack Seconds for gate to fully close. The default
   *                                is zero.
   * @param {Number} options.release Seconds for gate to fully open. The default
   *                                 is zero.
   * @param {Number} options.bufferSize The size of an onaudioprocess window.
   *                                    The default lets the script processor
   *                                    decide.
   * @param {Number} options.timeConstant Seconds for envelope follower's
   *                                      smoothing filter delay. The
   *                                      default has been set experimentally to
   *                                      0.0025s.
   * @param {Number} options.threshold Decibel level beneath which sound is
   *                                   muted in the second channel.
   *                                   The default is -100 dBFS.
   */
  constructor(context, options) {
    if (!(context instanceof BaseAudioContext))
      throw 'Not a valid audio context.';
    if (!options) options = {};

    this.context_ = context;
    const bufferSize = options.bufferSize || 0;
    this.attack = options.attack || 0;
    this.release = options.release || 0;

    // The time constant of the filter has been set experimentally to balance
    // roughly delay for high frequency suppression.
    let timeConstant = (typeof options.timeConstant === 'undefined') ?
        0.0025 : options.timeConstant;

    this.threshold = (typeof options.threshold === 'undefined') ?
        -100 : options.threshold;

    // Alpha controls a tradeoff between the smoothness of the
    // envelope and its delay, with a higher value giving more smoothness at
    // the expense of delay and vice versa.
    this.alpha_ = this.getAlphaFromTimeConstant_(
        timeConstant, this.context_.sampleRate);

    this.noiseGateKernel_ = this.context_.createScriptProcessor(
        bufferSize, 3, 2);
    this.noiseGateKernel_.onaudioprocess = this.onaudioprocess_.bind(this);

    // The noise gate is connected to and from by dummy input and output nodes.
    this.input = new GainNode(this.context_);
    this.output = new GainNode(this.context_);
    this.input.connect(this.noiseGateKernel_).connect(this.output);

    // The previous envelope level, a float representing signal amplitude.
    this.previousLevel_ = 0;

    // The last weight (between 0 and 1) assigned, where 1 means the gate
    // is open and 0 means it is closed and the sample in the output buffer is
    // muted. When attacking, the weight will linearly decrease from 1 to 0, and
    // when releasing the weight linearly increase from 0 to 1.
    this.previousWeight_ = 1.0;
    this.channel_ = new Float32Array(this.noiseGateKernel_.bufferSize);
    this.envelope_ = new Float32Array(this.noiseGateKernel_.bufferSize);
    this.weights_ = new Float32Array(this.noiseGateKernel_.bufferSize);
  }

  /**
   * Control the dynamic range of input in the first and second channel based
   * on the measured level of the signal in the third channel relative to a
   * specified threshold.
   * @param {AudioProcessingEvent} event An Event object containing
   *                                     3 input channels and 2 output channels.
   */
  onaudioprocess_(event) {
    let inputBuffer = event.inputBuffer;
    let signalChannel0 = inputBuffer.getChannelData(0);
    let signalChannel1 = inputBuffer.getChannelData(1);
    let sideChainChannel = inputBuffer.getChannelData(2);
    
    let outputChannel0 = event.outputBuffer.getChannelData(0);
    let outputChannel1 = event.outputBuffer.getChannelData(1);
    
    let envelope = this.detectLevel_(sideChainChannel);
    let weights = this.computeWeights_(envelope);
    
    // The output in the second channel will be modifed only when the measured
    // level in the first channel -exceeds- the threshold unlike the noise
    // gate in audio-worklet/src/ which modifies the range of the signal when
    // measured level is -beneath- the threshold.
    for (let j = 0; j < weights.length; j++) {
      outputChannel0[j] = (1 - weights[j]) * signalChannel0[j];
      outputChannel1[j] = (1 - weights[j]) * signalChannel1[j];
    }
  }

  /**
   * Compute an envelope follower for the signal.
   * @param {Float32Array} sideChainChannel Input channel data.
   * @return {Float32Array} The level of the signal.
   */
  detectLevel_(sideChainChannel) {
    // The signal level is determined by filtering the square of the signal
    // with exponential smoothing. See
    // http://www.aes.org/e-lib/browse.cfm?elib=16354 for details.
    this.envelope_[0] = this.alpha_ * this.previousLevel_ +
        (1 - this.alpha_) * Math.pow(sideChainChannel[0], 2);

    for (let j = 1; j < sideChainChannel.length; j++) {
      this.envelope_[j] = this.alpha_ * this.envelope_[j - 1] +
          (1 - this.alpha_) * Math.pow(sideChainChannel[j], 2);
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
      attackSteps = Math.ceil(this.context_.sampleRate * this.attack);
      attackLossPerStep = 1 / attackSteps;
    }
    if (this.release > 0) {
      releaseSteps = Math.ceil(this.context_.sampleRate * this.release);
      releaseGainPerStep = 1 / releaseSteps;
    }

    // Compute an array of weights between 0 and 1 which will be multiplied with
    // the channel depending on if the noise gate is open, attacking, releasing,
    // or closed.
    for (let i = 0; i < envelope.length; i++) {
      // For sine waves, the envelope eventually reaches an average power of
      // a^2 / 2. Sine waves are therefore scaled back to the original
      // amplitude, but other waveforms or constant sources can only be
      // approximated.
      const scaledEnvelopeValue = NoiseGateSideChain.toDecibel(2 * envelope[i]);
      if (scaledEnvelopeValue < this.threshold) {
        const weight = this.previousWeight_ - attackLossPerStep;
        this.weights_[i] = Math.max(weight, 0);
      }
      else {
        const weight = this.previousWeight_ + releaseGainPerStep;
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
}
