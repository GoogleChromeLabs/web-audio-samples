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
   */
  constructor(context) {
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

    this.minBitDepth = 1;
    this.maxBitDepth = 24;
    this.minReduction = 1;
    this.maxReduction = 10;

    // By default no delay is applied. The gain and delay time are
    // experimentally determined.
    this.delayWetness = 0;
    this.feedbackDelayGain = 0.5;
    this.feedbackDelayTime = 0.2;

    this.reverbWetness = 0.5;

    this.playbackRate = 1.0;
    this.noisegateAttack = 0.1;
    this.noisegateRelease = 0.1;
    this.noisegateThreshold = -100;
    this.drumVolume = 1;

    // The initial values for the parameters are experimentally determined.
    this.parameters_ = {
      gainAttack: 0.0,
      gainDecay: 0.32,
      gainSustain: this.minSustain,
      gainRelease: 0.13,
      filterCutoff: 60,
      filterQ: 15.35,
      filterAttack: 0,
      filterDecay: 0.58,
      filterSustain: this.minSustain,
      filterRelease: 0.48,
      filterDetuneAmount: 3.27,
    };

    // Each voice is connected to |this.voiceOutput_|.
    this.voiceOutput_ = new GainNode(this.context_);
    
    // The client is responsible for connecting |this.output| to a destination.
    this.output = new GainNode(this.context_);

    // The output of |this.voiceOutput_| is processed by four effects:
    // noisegate-sidechaining, bitcrushing, delay, and reverb.
    let noisegateInputNode = new GainNode(this.context_);
    let noisegateOutputNode =
        this.createNoisegateSideChainGraph_(noisegateInputNode);

    let bitcrusherInputNode = new GainNode(this.context_);
    let bitcrusherOutputNode = this.createBitcrusherGraph_(bitcrusherInputNode);

    let delayInputNode = new GainNode(this.context_);
    let delayOutputNode = this.createDelayGraph_(delayInputNode);

    let reverbInputNode = new GainNode(this.context_);
    let reverbOutputNode = this.createReverbGraph_(reverbInputNode);

    this.voiceOutput_.connect(noisegateInputNode);
    noisegateOutputNode.connect(bitcrusherInputNode);
    bitcrusherOutputNode.connect(delayInputNode);
    delayOutputNode.connect(reverbInputNode);
    reverbOutputNode.connect(this.output);
  }

  createNoisegateSideChainGraph_(inputNode) {
    this.noisegate = new NoiseGateSideChain(this.context_, {
      numberOfChannels: 2,
      attack: this.noisegateAttack,
      release: this.noisegateRelease,
      threshold: this.threshold
    });

    this.drumSource_ = new AudioBufferSourceNode(this.context_);
    this.activeNoisegateRoute = new GainNode(this.context_, {gain: 0});
    this.bypassNoisegateRoute = new GainNode(this.context_, {gain: 1});
    this.synthAndDrumMerger_ =
        new ChannelMergerNode(this.context_, {numberOfInputs: 3});
    let noisegateOutputNode = new GainNode(this.context_);
    let synthSplitter =
        new ChannelSplitterNode(this.context_, {numberOfOutputs: 2});

    // The noise gate will build an envelope on the output of the drum sample
    // (in channel 2) but the noise gate will modify the output of the
    // synthesizer (channels 0 and 1).
    inputNode.connect(synthSplitter);
    synthSplitter.connect(this.synthAndDrumMerger_, 0, 0);
    synthSplitter.connect(this.synthAndDrumMerger_, 0, 1);
    this.synthAndDrumMerger_.connect(this.noisegate.input);
    this.noisegate.output.connect(
        this.activeNoisegateRoute.connect(noisegateOutputNode));

    inputNode.connect(this.bypassNoisegateRoute).connect(noisegateOutputNode);

    // If |this.drumVolume| is positive, the drum sample is audible but bypasses
    // the other synthesizer effects.
    this.drumGain_ = new GainNode(this.context_, {gain: this.drumVolume});
    this.drumGain_.connect(this.output);

    return noisegateOutputNode;
  }

  createDelayGraph_(inputNode) {
    // The sum of the gain of the wet and dry signal is always 1, and the output
    // always routes through both nodes.
    this.delayWetSignalGain_ =
        new GainNode(this.context_, {gain: this.delayWetness});
    this.delayDrySignalGain_ =
        new GainNode(this.context_, {gain: 1 - this.delayWetness});
    this.feedbackDelayNode_ =
        new DelayNode(this.context_, {delayTime: this.feedbackDelayTime});
    this.feedbackDelayGainNode_ =
        new GainNode(this.context_, {gain: this.feedbackDelayGain});
    let delayEffectOutputNode = new GainNode(this.context_, {gain: 1});

    inputNode.connect(this.delayDrySignalGain_)
        .connect(delayEffectOutputNode);

    // The output of the delay node routes through the wet path as well as a
    // gain node which echoes the delay node's output back to it at a gain
    // specified by the user.
    inputNode.connect(this.feedbackDelayNode_)
        .connect(this.delayWetSignalGain_)
        .connect(delayEffectOutputNode);
    this.feedbackDelayNode_.connect(this.feedbackDelayGainNode_)
        .connect(this.feedbackDelayNode_);

    return delayEffectOutputNode;
  }

  createBitcrusherGraph_(inputNode) {
    this.bitcrusher = new Bitcrusher(
        this.context_,
        {bitDepth: this.maxBitDepth, reduction: this.minReduction});

    this.activeBitcrusherRoute = new GainNode(this.context_, {gain: 0});
    this.bypassBitcrusherRoute = new GainNode(this.context_, {gain: 1});
    let bitcrusherOutputNode = new GainNode(this.context_);

    inputNode.connect(this.activeBitcrusherRoute)
        .connect(this.bitcrusher.input);
    this.bitcrusher.output.connect(bitcrusherOutputNode);
    inputNode.connect(this.bypassBitcrusherRoute).connect(bitcrusherOutputNode);
   
    return bitcrusherOutputNode;
  }

  createReverbGraph_(inputNode) {
    // The sum of the gain of the wet and dry signal is always 1.
    this.reverbWetSignal_ =
        new GainNode(this.context_, {gain: this.reverbWetness});
    this.reverbDrySignal_ =
        new GainNode(this.context_, {gain: 1 - this.reverbWetness});
    this.convolver_ =
        new ConvolverNode(this.context_);
    let reverbOutputNode = new GainNode(this.context_);

    inputNode.connect(this.convolver_)
        .connect(this.reverbWetSignal_)
        .connect(reverbOutputNode);
    inputNode.connect(this.reverbDrySignal_)
        .connect(reverbOutputNode);
    
    return reverbOutputNode;
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
   * @param {Number} value The new gain of |this.reverbWetSignal_|.
   */
  setReverbWetness(value) {
    this.reverbWetSignal_.gain.value = value;
    this.reverbDrySignal_.gain.value = 1 - value;
  }

  /**
   * Set the impulse response of the convolver node used by the reverb effect.
   * @param {AudioBuffer} impulseResponseBuffer The new impulse response buffer.
   */
  setConvolverBuffer(impulseResponseBuffer) {
    this.convolver_.buffer = impulseResponseBuffer;
  }

  /**
   * Set the AudioBuffer of the drum sample used for side chaining.
   * @param {AudioBuffer} drumSampleBuffer The new drum sample buffer.
   */
  setDrumSample(drumSampleBuffer) {
    this.drumSource_ = new AudioBufferSourceNode(this.context_, {
      buffer: drumSampleBuffer,
      loop: true,
      playbackRate: this.playbackRate
    });

    let drumDownMixer_ = new GainNode(
        this.context_, {channelCountMode: 'explicit', channelCount: 1});

    // The synthesizer will connect to the first two inputs of the merger node.
    this.drumSource_.connect(drumDownMixer_)
        .connect(this.synthAndDrumMerger_, 0, 2);
    this.drumSource_.connect(this.drumGain_);
    this.drumSource_.start();
  }
  
  /**
   * Sets the playback rate of the drum sample.
   * @param {Number} value The new playback rate.
   */
  setDrumSamplePlaybackRate(value) {
    this.playbackRate = value;
    this.drumSource_.playbackRate.value = value;
  }
  
  /**
   * Sets the volume of the drum sample.
   * @param {Number} value [description]
   */
  setDrumSampleVolume(value) {
    this.drumGain_.gain.value = value;
  }

  /**
   * Sets the threshold of the noise gate.
   * @param {Number} value The new threshold level.
   */
  setNoisegateThreshold(value) {
    this.noisegate.threshold = value;
  }

  /**
   * Sets the attack of the noise gate.
   * @param {Number} value The new attack value.
   */
  setNoisegateAttack(value) {
    this.noisegate.attack = value;
  }

  /**
   * Sets the release of the noise gate.
   * @param {Number} value The new release value.
   */
  setNoisegateRelease(value) {
    this.noisegate.release = value;
  }

  /**
   * Stop the drum sample.
   */
  stopDrumSample() {
    this.drumSource_.stop();
    this.drumSource_.disconnect();
  }

  /**
   * Set the amount feedback delay to apply.
   * @param {Number} value The new gain of |this.delayWetSignalGain_|.
   */
  setDelayWetness(value) {
    this.delayWetSignalGain_.gain.value = value;
    this.delayDrySignalGain_.gain.value = 1 - value;
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
  setFeedbackDelayGain(value) {
    this.feedbackDelayGainNode_.gain.value = value;
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
