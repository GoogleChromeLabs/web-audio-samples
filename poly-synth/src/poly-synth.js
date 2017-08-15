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
 * @class PolySynth
 * @description Manages the life cycle of voices.
 */
class PolySynth {
  /**
   * @constructor
   * @param {AudioContext} context The audio context.
   * @param {AudioBuffer} defaultImpulseResponse The default impulse response.

   */
  constructor(context, defaultImpulseResponse) {
    if (!(context instanceof AudioContext))
      throw context + ' is not a valid audio context.';

    this.context_ = context;
    this.activeVoices_ = [];
    this.releasedVoices_ = [];

    // The maximum and minimum cutoffs are experimentally determined.
    this.maxCutoff = 16000;
    this.minCutoff = 60;

    // The maximum and minimum ADSR values refer to the ADSR for the gain as
    // well as the ADSR for the filter. These values are experimentally
    // determined.
    this.maxAttack = 10;
    this.minAttack = 0;
    this.minSustain = 0.1;
    this.maxSustain = 1;

    // The minimum decay is > 0 since there will be a conflict if the time to
    // the sustain and time to maximum level are identical.
    this.minDecay = 0.01;
    this.maxDecay = 10;
    this.minRelease = 0;
    this.maxRelease = 10;

    // A detune amount of 1 will correspond to 2400 cents detuning from the
    // cutoff value.
    this.minDetuneAmount = 0;
    this.maxDetuneAmount = 5;

    // Q for the low pass filter is in dB and controls how peaked the response
    // is around the cutoff frequency.
    this.minQ = -50;
    this.maxQ = 50;

    // The bitcrusher defaults non-information reducing parameters.
    this.minBitDepth = 1;
    this.maxBitDepth = 24;
    this.minReduction = 1;
    this.maxReduction = 10;

    // By default no feedback is applied. The gain and delay time are
    // experimentally determined.
    this.feedbackWetness = 0;
    this.feedbackGain = 0.5;
    this.feedbackDelayTime = 0.2;

    // By default no convolution is applied.
    this.convolverWetness = 1;
    this.impulseResponse_ = defaultImpulseResponse;

    // The initial values for the parameters are experimentally determined.
    this.parameters_ = {
      gainAttack: 0.1,
      gainDecay: this.minDecay,
      gainSustain: 0.5,
      gainRelease: 0.1,
      filterCutoff: 440,
      filterQ: 0,
      filterAttack: 1,
      filterDecay: 1,
      filterSustain: this.minSustain,
      filterRelease: this.minRelease,
      filterDetuneAmount: 1,
    };

    // Each voice is connected to |this.voiceOutput_|.
    this.voiceOutput_ = new GainNode(this.context_);

    // The output of |this.voiceOutput_| is processed by three effects
    // bitcrusher, feedback delay, and a convolver.
    let feedbackInputNode = new GainNode(this.context_);
    let feedbackOutputNode = this.createFeedbackGraph_(feedbackInputNode);

    let bitcrusherInputNode = new GainNode(this.context_);
    let bitcrusherOutputNode = this.createBitcrusherGraph_(bitcrusherInputNode);

    let convolverInputNode = new GainNode(this.context_);
    let convolverOutputNode = this.createConvolverGraph_(convolverInputNode);

    // The client is responsible for connecting |this.output| to a destination.
    this.output = new GainNode(this.context_);

    // The feedback node occurs prior to the other effects so that the output
    // of the feedback can be modulated by these components.
    this.voiceOutput_.connect(feedbackInputNode);
    feedbackOutputNode.connect(bitcrusherInputNode);
    bitcrusherOutputNode.connect(convolverInputNode);
    convolverOutputNode.connect(this.output);
  }

  createFeedbackGraph_(inputNode) {
    // The sum of the gain of the wet and dry signal is always 1, and the output
    // always routes through both nodes.
    this.feedbackWetSignal_ =
        new GainNode(this.context_, {gain: this.feedbackWetness});
    this.feedbackDrySignal_ =
        new GainNode(this.context_, {gain: 1 - this.feedbackWetness});
    this.feedbackDelayNode_ =
        new DelayNode(this.context_, {delayTime: this.feedbackDelayTime});
    this.feedbackGainNode_ =
        new GainNode(this.context_, {gain: this.feedbackGain});
    let feedbackEffectOutputNode = new GainNode(this.context_, {gain: 1});

    inputNode.connect(this.feedbackDrySignal_)
        .connect(feedbackEffectOutputNode);

    // The output of the delay node routes through the wet path as well as a
    // gain node which echoes the delay node's output back to it at a gain
    // specified by the user.
    inputNode.connect(this.feedbackDelayNode_)
        .connect(this.feedbackWetSignal_)
        .connect(feedbackEffectOutputNode);
    this.feedbackDelayNode_.connect(this.feedbackGainNode_)
        .connect(this.feedbackDelayNode_);

    return feedbackEffectOutputNode;
  }

  createBitcrusherGraph_(inputNode) {
    this.bitcrusher = new Bitcrusher(
        this.context_,
        {bitDepth: this.maxBitDepth, reduction: this.minReduction});

    // Only one of |this.activeBitcrusherRoute_| and
    // |this.bypassBitcrusherRoute_| has a non-zero gain
    this.activeBitcrusherRoute = new GainNode(this.context_, {gain: 0});
    this.bypassBitcrusherRoute = new GainNode(this.context_, {gain: 1});
    let bitcrusherOutputNode = new GainNode(this.context_);

    inputNode.connect(this.activeBitcrusherRoute)
        .connect(this.bitcrusher.input);
    this.bitcrusher.output.connect(bitcrusherOutputNode);
    inputNode.connect(this.bypassBitcrusherRoute).connect(bitcrusherOutputNode);
   
    return bitcrusherOutputNode;
  }

  createConvolverGraph_(inputNode) {
    // The sum of the gain of the wet and dry signal is always 1.
    this.convolverWetSignal_ =
        new GainNode(this.context_, {gain: this.convolverWetness});
    this.convolverDrySignal_ =
        new GainNode(this.context_, {gain: 1 - this.convolverWetness});
    this.convolver_ =
        new ConvolverNode(this.context_, {buffer: this.impulseResponse_});
    let convolverOutputNode = new GainNode(this.context_);

    inputNode.connect(this.convolver_)
        .connect(this.convolverWetSignal_)
        .connect(convolverOutputNode);
    inputNode.connect(this.convolverDrySignal_)
        .connect(convolverOutputNode);
    
    return convolverOutputNode;
  }


  /**
   * Returns parameters that affect how a voice is constructed.
   * @returns {Object} parameters K-rate parameters which affect the output of a
   *                              voice if set before the voice is constructed.
   * @returns {Number} parameters.gainAttack Seconds until full amplitude.
   * @returns {Number} parameters.gainDecay Seconds between full level and
   *                                        sustain and level.
   * @returns {Number} parameters.gainSustain The steady amplitude of the note
   *                                          as it is pressed.
   * @returns {Number} parameters.gainRelease Seconds between the release of a
   *                                          note and zero amplitude.
   * @returns {Number} parameters.filterCutoff The cutoff of the low pass
   *                                           filter.
   * @returns {Number} parameters.filterQ The peak of the response at the cutoff
   *                                      frequency.
   * @returns {Number} parameters.filterAttack Seconds until full detune.
   * @returns {Number} parameters.filterDecay Seconds between full detune and
   *                                          sustain detune.
   * @returns {Number} parameters.filterSustain The steady detune level as a
   *                                            note is pressed.
   * @returns {Number} parameters.filterRelease Seconds betweeen the release of
   *                                            a note and zero detune.
   */
  getParameters() {
    return this.parameters_;
  }

  /**
   * Sets |this.parameters_[id]| to value.
   * @param {Number} value The new value.
   * @param {String} id The name of the parameter to set.
   */
  setParameter(value, id) {
    if (typeof(this.parameters_[id]) === 'undefined')
      throw 'The parameter ' + id + ' is not supported';

    this.parameters_[id] = value;
  }

  /**
   * Sets the bit depth of the bitcrusher.
   * @param {Number} value The new bit depth.
   */
  setBitDepth(value) {
    this.bitcrusher.bitDepth = value;
  }

  /**
   * Sets the sample rate reduction of the bit crusher.
   * @param {Number} value The new sample rate reduction.
   */
  setReduction(value) {
    this.bitcrusher.reduction = value;
  }

  /**
   * Set the amount convolution to apply.
   * @param {Number} value The new gain of |this.convolverWetSignal_|.
   */
  setConvolverWetness(value) {
    this.convolverWetSignal_.gain.value = value;
    this.convolverDrySignal_.gain.value = 1 - value;
  }

  /**
   * Set the impulse response of the convolver node.
   * @param {AudioBuffer} impulseResponseBuffer The new impulse response buffer.
   */
  setConvolverBuffer(impulseResponseBuffer) {
    this.convolver_.buffer = impulseResponseBuffer;
  }

  /**
   * Set the amount feedback delay to apply.
   * @param {Number} value The new gain of |this.feedbackWetSignal_|.
   */
  setFeedbackWetness(value) {
    this.feedbackWetSignal_.gain.value = value;
    this.feedbackDrySignal_.gain.value = 1 - value;
  }

  /**
   * Sets the delay time of the delay node.
   * @param {Number} value The new delayTime of |feedbackDelayNode_|.
   */
  setFeedbackDelayTime(value) {
    this.feedbackDelayNode_.delayTime.value = value;
  }

  /**
   * Sets the gain of the delay feedback node.
   * @param {Number} value The new gain of the feedback node.
   */
  setFeedbackGain(value) {
    this.feedbackGainNode_.gain.value = value;
  }

  /**
   * Create a new voice and add it to |this.activeVoices_|.
   * @param {String} noteName The note to be played, e.g. A4 for an octave 4 A.
   * @param {Number} frequency The corresponding pitch of the note, e.g 440.
   */
  playVoice(noteName, frequency) {
    let voice = new PolySynthVoice(this.context_, noteName, frequency, this);
    voice.output.connect(this.voiceOutput_);
    this.activeVoices_[noteName] = voice;
    voice.start();
  }

  /**
   * Release the note, moving its reference to voice to |this.releasedVoices_|.
   * @param {String} note The name of the note released which corresponds to its
   *                      key in |this.activeVoices_|.
   */
  releaseVoice(noteName) {
    // Move reference to voice to |this.releasedVoices_|.
    let voice = this.activeVoices_[noteName];
    this.releasedVoices_[noteName] = voice;
    voice.release();
    delete this.activeVoices_[noteName];
  }

  /**
   * Remove references to the voice, corresponding to |noteName|. |Voice()|
   * triggers this event.
   * @param {String} noteName The name of the note released which corresponds to
   *                          its key in |this.releasedVoices_|.
   */
  endVoice(noteName) {
    delete this.releasedVoices_[noteName];
  }
}
