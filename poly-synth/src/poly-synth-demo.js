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
 * @class PolySynthDemo
 * @description Triggers synthesizer events based on GUI input.
 */
class PolySynthDemo {
  /**
   * @constructor
   * @param {AudioContext} context The audio context.
   * @param {Object} identifiers
   * @param {String} identifiers.gainEnvelopeDivId The ID of the container for
   *                                               gain envelope elements.
   * @param {String} identifiers.filterDivId The ID of the container for
   *                                         filter elements.
   * @param {String} identifiers.filterEnvelopeDivId The ID of the container for
   *                                                 filter envelope elements.
   * @param {String} identifiers.bitcrusherDivId The ID of the container for
   *                                             bitcrusher parameter elements.
   * @param {String} identifiers.reverbDivId The ID of the container for
   *                                         reverb elements.
   * @param {String} identifiers.reverbSelectorId The ID of the <select>
   *                                              element for impulse
   *                                              response options.
   * @param {String} identifiers.delayDivId The ID of the container for
   *                                        feedback delay elements.
   * @param {String} identifiers.volumeDivId The ID of the container for
   *                                         the volume control.
   * @param {String} identifiers.drumSampleDivId The ID of the container for
   *                                             drum samples.
   * @param {String} identifiers.noiseGateDivId The ID of the container for
   *                                            side chain elements.
   * @param {String} identifiers.noiseGateStartButton The ID of the noisegate
   *                                            start button.
   * @param {String} identifiers.drumSelectorId The ID of the <select>
   *                                            element for drum samples.
   */
  constructor(context, identifiers) {
    this.context_ = context;
    this.reverbSelectorId_ = identifiers.reverbSelectorId;
    this.drumSelectorId_ = identifiers.drumSelectorId;
    this.impulseResponseUrls_ = this.getImpulseResponseUrls_();
    this.drumSampleUrls_ = this.getDrumSampleUrls_();
    this.drumSampleIndex_ = 0;
    
    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});
    this.polySynth_ =
        new PolySynth(this.context_);
    this.polySynth_.output.connect(this.masterGain_)
        .connect(this.context_.destination);

    // The QWERTY keyboard is defined in qwerty-hancock.min.js.
    this.keyboard_ = new QwertyHancock(
        {id: 'keyboard', width: 600, height: 150, octaves: 2});
    this.keyboard_.keyDown = this.keyDown.bind(this);
    this.keyboard_.keyUp = this.keyUp.bind(this);
    
    this.initializeAmplifierEnvelopeGUI_(identifiers.gainEnvelopeDivId);
    this.initializeFilterGUI_(identifiers.filterDivId);
    this.initializeFilterEnvelopeGUI_(identifiers.filterEnvelopeDivId);
    this.initializeNoiseGateGUI_(
        identifiers.noiseGateDivId, identifiers.noiseGateStartButton);
    this.initializeBitcrusherGUI_(identifiers.bitcrusherDivId);
    this.initializeDelayGUI_(identifiers.delayDivId);
    this.initializeReverbGUI_(identifiers.reverbDivId, this.reverbSelectorId_);
    this.initializeMasterVolumeGUI_(identifiers.volumeDivId);

    this.loadSamples(this.impulseResponseUrls_)
        .then((impulseResponseBuffers) => {
          this.impulseResponseBuffers_ = impulseResponseBuffers;
          this.polySynth_.setConvolverBuffer(this.impulseResponseBuffers_[0]);
          document.getElementById(this.reverbSelectorId_).disabled = false;
        });

    this.loadSamples(this.drumSampleUrls_)
        .then((drumSampleBuffers) => {
          this.drumSampleBuffers_ = drumSampleBuffers;
          document.getElementById(this.drumSelectorId_).disabled = false;
        });
  }

  async loadSamples(urls) {
    let audioBuffers = [];
    for (let index in urls) {
      audioBuffers[index] = await this.loadSound(urls[index]);
    }
    return audioBuffers;
  }

  async loadSound(url) {
    const response = await fetch(url);
    const sound = await response.arrayBuffer();
    return this.context_.decodeAudioData(sound);
  }

  initializeFilterGUI_(filterDivId) {
    let lowPassSlider_ = new ParamController(
        filterDivId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Cutoff (hz)',
          id: 'filterCutoff',
          type: 'range',
          min: this.polySynth_.minCutoff,
          max: this.polySynth_.maxCutoff,
          step: 1,
          default: this.polySynth_.getParameters().filterCutoff
        });

    let filterQSlider_ = new ParamController(
        filterDivId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Q (dB)',
          id: 'filterQ',
          type: 'range',
          min: this.polySynth_.minQ,
          max: this.polySynth_.maxQ,
          step: 0.01,
          default: this.polySynth_.getParameters().filterQ
        });
  }

  initializeAmplifierEnvelopeGUI_(filterEnvelopeDivId) {
    let gainAttackSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Attack (s)',
          id: 'gainAttack',
          type: 'range',
          min: this.polySynth_.minAttack,
          max: this.polySynth_.maxAttack,
          step: 0.01,
          default: this.polySynth_.getParameters().gainAttack
        });

    let gainDecaySlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Decay (s)',
          id: 'gainDecay',
          type: 'range',
          min: this.polySynth_.minDecay,
          max: this.polySynth_.maxDecay,
          step: 0.01,
          default: this.polySynth_.getParameters().gainDecay
        });

    let gainSustainSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Sustain',
          id: 'gainSustain',
          type: 'range',
          min: this.polySynth_.minSustain,
          max: this.polySynth_.maxSustain,
          step: 0.01,
          default: this.polySynth_.getParameters().gainSustain
        });

    let gainReleaseSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Release (s)',
          id: 'gainRelease',
          type: 'range',
          min: this.polySynth_.minRelease,
          max: this.polySynth_.maxRelease,
          step: 0.01,
          default: this.polySynth_.getParameters().gainRelease
        });
  }

  initializeFilterEnvelopeGUI_(filterEnvelopeDivId) {
    let filterAttackSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Attack (s)',
          id: 'filterAttack',
          type: 'range',
          min: this.polySynth_.minAttack,
          max: this.polySynth_.maxAttack,
          step: 0.01,
          default: this.polySynth_.getParameters().filterAttack
        });

    let filterDecaySlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Decay (s)',
          id: 'filterDecay',
          type: 'range',
          min: this.polySynth_.minDecay,
          max: this.polySynth_.maxDecay,
          step: 0.01,
          default: this.polySynth_.getParameters().filterDecay
        });

    let filterSustainSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Sustain',
          id: 'filterSustain',
          type: 'range',
          min: this.polySynth_.minSustain,
          max: this.polySynth_.maxSustain,
          step: 0.01,
          default: this.polySynth_.getParameters().filterSustain
        });

    let filterReleaseSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Release (s)',
          id: 'filterRelease',
          type: 'range',
          min: this.polySynth_.minRelease,
          max: this.polySynth_.maxRelease,
          step: 0.01,
          default: this.polySynth_.getParameters().filterRelease
        });

    let filterDetuneSlider_ = new ParamController(
        filterEnvelopeDivId, this.polySynth_.setParameter.bind(this.polySynth_),
        {
          name: 'Filter Amount',
          id: 'filterDetuneAmount',
          type: 'range',
          min: this.polySynth_.minDetuneAmount,
          max: this.polySynth_.maxDetuneAmount,
          step: 0.01,
          default: this.polySynth_.getParameters().filterDetuneAmount
        });
  }
  
  initializeNoiseGateGUI_(noiseGateDivId, noiseGateStartButton) {
    this.drumSamplePlaybackRateSlider_ = new ParamController(
        noiseGateDivId,
        this.polySynth_.setDrumSamplePlaybackRate.bind(this.polySynth_), {
          name: 'Playback rate',
          id: 'playbackRate',
          type: 'range',
          min: 0.1,
          max: 30,
          step: 0.1,
          default: this.polySynth_.playbackRate
        });

    this.drumSampleVolume_ = new ParamController(
        noiseGateDivId,
        this.polySynth_.setDrumSampleVolume.bind(this.polySynth_), {
          name: 'Beat volume',
          id: 'beatVolume',
          type: 'range',
          min: 0,
          max: 5,
          step: 0.05,
          default: this.polySynth_.drumVolume
        });

    this.noiseGateThresholdSlider_ = new ParamController(
        noiseGateDivId,
        this.polySynth_.setNoisegateThreshold.bind(this.polySynth_), {
          name: 'Threshold',
          id: 'threshold',
          type: 'range',
          min: -100,
          max: 0,
          step: 1,
          default: this.polySynth_.noisegateThreshold
        });

    this.noiseGateAttackSlider_ = new ParamController(
        noiseGateDivId,
        this.polySynth_.setNoisegateAttack.bind(this.polySynth_), {
          name: 'Attack',
          id: 'noisegateAttack',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.05,
          default: this.polySynth_.noisegateAttack
        });

    this.noiseGateReleaseSlider_ = new ParamController(
        noiseGateDivId,
        this.polySynth_.setNoisegateRelease.bind(this.polySynth_), {
          name: 'Release',
          id: 'noisegateRelease',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.05,
          default: this.polySynth_.noisegateRelease
        });

    document.getElementById(noiseGateStartButton).onclick = (event) => {
      // The change is scheduled slightly into the future to avoid glitching.
      if (event.target.textContent === 'Start') {
        event.target.textContent = 'Stop';
        this.polySynth_.setDrumSample(
            this.drumSampleBuffers_[this.drumSampleIndex_]);
        this.polySynth_.activeNoisegateRoute.gain.value = 1;
        this.polySynth_.bypassNoisegateRoute.gain.value = 0;
      } else {
        event.target.textContent = 'Start';
        this.polySynth_.stopDrumSample();
        this.polySynth_.activeNoisegateRoute.gain.value = 0;
        this.polySynth_.bypassNoisegateRoute.gain.value = 1;
      }
    }

    let selector = document.getElementById(this.drumSelectorId_);
    this.displayOptions_(selector, this.drumSampleUrls_);

    selector.onchange = (event) => {
      this.drumSampleIndex_ = parseInt(event.target.value);
      this.polySynth_.stopDrumSample();
      this.polySynth_.setDrumSample(
            this.drumSampleBuffers_[this.drumSampleIndex_]);
      // Deselect the target to prevent interference with keyboard.
      event.target.blur();
    }
    
    // The selector will be enabled when the buffers are loaded.
    selector.disabled = true;
  }

  initializeBitcrusherGUI_(bitcrusherDivId) {
    let bitcrusherBitDepthSlider_ = new ParamController(
        bitcrusherDivId, this.polySynth_.setBitDepth.bind(this.polySynth_), {
          name: 'Bit Depth',
          id: 'bitDepth',
          type: 'range',
          min: this.polySynth_.minBitDepth,
          max: this.polySynth_.maxBitDepth,
          step: 0.01,
          default: this.polySynth_.bitcrusher.bitDepth
        });
    bitcrusherBitDepthSlider_.disable();

    let bitcrusherReductionSlider_ = new ParamController(
        bitcrusherDivId, this.polySynth_.setReduction.bind(this.polySynth_), {
          name: 'Reduction',
          id: 'reduction',
          type: 'range',
          min: this.polySynth_.minReduction,
          max: this.polySynth_.maxReduction,
          step: 1,
          default: this.polySynth_.bitcrusher.reduction
        });
    bitcrusherReductionSlider_.disable();

    // Sound is not processed by the bitcrusher if in bypass mode.
    document.getElementById('bitcrusherBypassButton').onclick = (event) => {
      // The change is scheduled slightly into the future to avoid glitching.
      const t = this.context_.currentTime + 0.01;
      if (event.target.textContent === 'Active') {
        event.target.textContent = 'Bypassed';
        this.polySynth_.bypassBitcrusherRoute.gain.linearRampToValueAtTime(
            1, t);
        this.polySynth_.activeBitcrusherRoute.gain.linearRampToValueAtTime(
            0, t);

        bitcrusherBitDepthSlider_.disable();
        bitcrusherReductionSlider_.disable();
      } else {
        event.target.textContent = 'Active';
        this.polySynth_.activeBitcrusherRoute.gain.linearRampToValueAtTime(
            1, t);
        this.polySynth_.bypassBitcrusherRoute.gain.linearRampToValueAtTime(
            0, t);

        bitcrusherBitDepthSlider_.enable();
        bitcrusherReductionSlider_.enable();
      }
    }
  }

  initializeReverbGUI_(reverbDivId) {
    let reverbWetnessSlider_ = new ParamController(
        reverbDivId, this.polySynth_.setReverbWetness.bind(this.polySynth_),
        {
          name: 'Mix',
          id: 'wetness',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.reverbWetness
        });

    // The synth's convolver node buffer changes depending on the selected url.
    let selector = document.getElementById(this.reverbSelectorId_);
    this.displayOptions_(selector, this.impulseResponseUrls_);

    selector.onchange = (event) => {
      let responseIndex = parseInt(event.target.value);
      this.polySynth_.setConvolverBuffer(
          this.impulseResponseBuffers_[responseIndex]);

      // Deselect the target to prevent interference with keyboard.
      event.target.blur();
    }
    
    // The reverb selector will be enabled when the buffers are loaded.
    selector.disabled = true;
  }

  initializeDelayGUI_(delayDivId) {
    let delayWetnessSlider_ = new ParamController(
        delayDivId, this.polySynth_.setDelayWetness.bind(this.polySynth_), {
          name: 'Mix',
          id: 'wetness',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.delayWetness
        });

    let feedbackDelaySlider_ = new ParamController(
        delayDivId, this.polySynth_.setFeedbackDelayTime.bind(this.polySynth_),
        {
          name: 'Delay Time',
          id: 'delay',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.feedbackDelayTime
        });

    let feedbackDelayGainSlider_ = new ParamController(
        delayDivId, this.polySynth_.setFeedbackDelayGain.bind(this.polySynth_),
        {
          name: 'Feedback',
          id: 'feedbackDelayGain',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.feedbackDelayGain
        });
  }

  initializeMasterVolumeGUI_(volumeDivId) {
    let masterGainSlider_ =
        new ParamController(volumeDivId, this.setGain.bind(this), {
          name: 'Volume',
          id: 'masterGain',
          type: 'range',
          min: 0,
          max: 5,
          step: 0.01,
          default: this.masterGain_.gain.value
        });
  }

  displayOptions_(selector, urls) {
    for (let index in urls) {
      // Only the last part of the file name is displayed.
      let urlParts = urls[index].split('/');
      let abbreviatedUrl = urlParts[urlParts.length - 1];
      let option = document.createElement('option');
      option.value = index;
      option.textContent = abbreviatedUrl;
      selector.appendChild(option);
    }
  }
  
  getDrumSampleUrls_() {
    let drumSampleUrls =
        [
          'sound/simple-beat.ogg',
          'sound/d-85.ogg',
          'sound/a-60.ogg',
          'sound/a2-60.ogg',
          'sound/a3-60.ogg',
          'sound/a4-60.ogg',
          'sound/d2-60.ogg',
          'sound/r2-80.ogg',
          'sound/a4-60.ogg',
        ];
    return drumSampleUrls;
  }

  getImpulseResponseUrls_() {
    let impulseResponseUrls =
        [
          '../samples/audio/impulse-responses/matrix-reverb1.wav',
          '../samples/audio/impulse-responses/backslap1.wav',
          '../samples/audio/impulse-responses/backwards-4.wav',
          '../samples/audio/impulse-responses/bright-hall.wav',
          '../samples/audio/impulse-responses/chorus-feedback.wav',
          '../samples/audio/impulse-responses/comb-saw1.wav',
          '../samples/audio/impulse-responses/comb-square1.wav',
          '../samples/audio/impulse-responses/cosmic-ping-long.wav',
          '../samples/audio/impulse-responses/cosmic-ping-longdrive.wav',
          '../samples/audio/impulse-responses/crackle.wav',
          '../samples/audio/impulse-responses/diffusor1.wav',
          '../samples/audio/impulse-responses/echo-chamber.wav',
          '../samples/audio/impulse-responses/feedback-spring.wav',
          '../samples/audio/impulse-responses/filter-lopass160.wav',
          '../samples/audio/impulse-responses/filter-midbandpass.wav',
          '../samples/audio/impulse-responses/filter-rhythm1.wav',
          '../samples/audio/impulse-responses/filter-telephone.wav',
          '../samples/audio/impulse-responses/imp_sequence.wav',
          '../samples/audio/impulse-responses/impulse-rhythm1.wav',
          '../samples/audio/impulse-responses/matrix6-backwards.wav',
          '../samples/audio/impulse-responses/medium-room1.wav',
          '../samples/audio/impulse-responses/noise-spreader1.wav',
          '../samples/audio/impulse-responses/peculiar-backwards.wav',
          '../samples/audio/impulse-responses/sifter.wav',
          '../samples/audio/impulse-responses/smooth-hall.wav',
          '../samples/audio/impulse-responses/spatialized1.wav',
          '../samples/audio/impulse-responses/spreader10-85ms.wav',
          '../samples/audio/impulse-responses/wildecho-old.wav',
          '../samples/audio/impulse-responses/zing-long-stereo.wav',
          '../samples/audio/impulse-responses/zoot.wav'
        ];

    return impulseResponseUrls;
  }

  /**
   * Change the volume.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new gain.
   */
  setGain(value) {
    this.masterGain_.gain.value = value;
  }

  /**
   * Play a note when a mapped key is pressed. This method implements a function
   * triggered in qwerty-hancock.min.js.
   * @param {String} noteName The note to be played, e.g. A4 for an octave 4 A.
   * @param {Number} frequency The corresponding pitch of the note, e.g 440.
   */
  keyDown(noteName, frequency) {
    this.polySynth_.playVoice(noteName, frequency);
  }

  /**
   * Release the note. This method implements a function triggered in
   * qwerty-hancock.min.js.
   * @param {String} noteName The note to be played, e.g. A4 for an octave 4 A.
   * @param {Number} frequency The corresponding pitch of the note, e.g 440.
   */
  keyUp(noteName, frequency) {
    this.polySynth_.releaseVoice(noteName, frequency);
  }
}
