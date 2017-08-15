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
   * @param {String} gainADSRId The ID of the container for gain ADSR elements
   *                            (e.g. <div>).
   * @param {String} filterADSRId The ID of the container for filter
   *                              ADSR elements.
   * @param {String} bitcrusherId The ID of the container for bitcrusher
   *                              parameter elements.
   * @param {String} convolverId The ID of the container for convolver
   *                             elements.
   * @param {String} convolverSelectorId The ID of the <select> element for
   *                             convolver impulse response options.
   * @param {String} feedbackId The ID of the container for feedback delay
   *                             elements.
   */
  constructor(
      context, gainADSRId, filterADSRId, bitcrusherId, convolverId,
      convolverSelectorId, feedbackId) {
    this.context_ = context;
    this.gainADSRId_ = gainADSRId;
    this.filterADSRId_ = filterADSRId;
    this.bitcrusherId_ = bitcrusherId;
    this.convolverId_ = convolverId;
    this.convolverSelectorId_ = convolverSelectorId;
    this.feedbackId_ = feedbackId;

    this.impulseResponseUrls_ = this.getImpulseResponseUrls_();

    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});

    this.loadImpulseResponses(this.impulseResponseUrls_)
        .then((impulseResponseBuffers) => {
          this.impulseResponseBuffers_ = impulseResponseBuffers;
          
          this.polySynth_ =
              new PolySynth(this.context_, impulseResponseBuffers[0]);
          this.polySynth_.output.connect(this.masterGain_)
              .connect(this.context_.destination);

          // The QWERTY keyboard is defined in qwerty-hancock.min.js.
          this.keyboard_ = new QwertyHancock(
              {id: 'keyboard', width: 600, height: 150, octaves: 2});
          this.keyboard_.keyDown = this.keyDown.bind(this);
          this.keyboard_.keyUp = this.keyUp.bind(this);
          
          this.initializeAmplifierEnvelopeGUI_(this.gainADSRId_);
          this.initializeFilterEnvelopeGUI_(this.filterADSRId_);
          this.initializeBitcrusherGUI_(this.bitcrusherId_);
          this.initializeConvolverGUI_(
              this.convolverId_, this.convolverSelectorId_);
          this.initializeFeedbackDelayGUI_(this.feedbackId_);
        });
  }

  async loadImpulseResponses(impulseResponses){
    let responseBuffers = [];
    for (let index in impulseResponses) {
      responseBuffers[index] = await this.loadSound(impulseResponses[index]);
    }
    return responseBuffers;
  }

  async loadSound(url) {
    const response = await fetch(url);
    const sound = await response.arrayBuffer();
    return this.context_.decodeAudioData(sound);
  }

  initializeAmplifierEnvelopeGUI_(containerId){
    let masterGainSlider_ =
        new ParamController(containerId, this.setGain.bind(this), {
          name: 'Volume',
          id: 'masterGain',
          type: 'range',
          min: 0,
          max: 5,
          step: 0.01,
          default: this.masterGain_.gain.value
        });

    let gainAttackSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Attack (s)',
          id: 'gainAttack',
          type: 'range',
          min: this.polySynth_.minAttack,
          max: this.polySynth_.maxAttack,
          step: 0.01,
          default: this.polySynth_.getParameters().gainAttack
        });

    let gainDecaySlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Decay (s)',
          id: 'gainDecay',
          type: 'range',
          min: this.polySynth_.minDecay,
          max: this.polySynth_.maxDecay,
          step: 0.01,
          default: this.polySynth_.getParameters().gainDecay
        });

    let gainSustainSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Sustain',
          id: 'gainSustain',
          type: 'range',
          min: this.polySynth_.minSustain,
          max: this.polySynth_.maxSustain,
          step: 0.01,
          default: this.polySynth_.getParameters().gainSustain
        });

    let gainReleaseSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Release (s)',
          id: 'gainRelease',
          type: 'range',
          min: this.polySynth_.minRelease,
          max: this.polySynth_.maxRelease,
          step: 0.01,
          default: this.polySynth_.getParameters().gainRelease
        });
  }
  
  initializeFilterEnvelopeGUI_(containerId){
    let lowPassSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Cutoff (hz)',
          id: 'filterCutoff',
          type: 'range',
          min: this.polySynth_.minCutoff,
          max: this.polySynth_.maxCutoff,
          step: 1,
          default: this.polySynth_.getParameters().filterCutoff
        });

    let filterQSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Q (dB)',
          id: 'filterQ',
          type: 'range',
          min: this.polySynth_.minQ,
          max: this.polySynth_.maxQ,
          step: 0.01,
          default: this.polySynth_.getParameters().filterQ
        });

    let filterAttackSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Attack (s)',
          id: 'filterAttack',
          type: 'range',
          min: this.polySynth_.minAttack,
          max: this.polySynth_.maxAttack,
          step: 0.01,
          default: this.polySynth_.getParameters().filterAttack
        });

    let filterDecaySlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Decay (s)',
          id: 'filterDecay',
          type: 'range',
          min: this.polySynth_.minDecay,
          max: this.polySynth_.maxDecay,
          step: 0.01,
          default: this.polySynth_.getParameters().filterDecay
        });

    let filterSustainSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Sustain',
          id: 'filterSustain',
          type: 'range',
          min: this.polySynth_.minSustain,
          max: this.polySynth_.maxSustain,
          step: 0.01,
          default: this.polySynth_.getParameters().filterSustain
        });

    let filterReleaseSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Release (s)',
          id: 'filterRelease',
          type: 'range',
          min: this.polySynth_.minRelease,
          max: this.polySynth_.maxRelease,
          step: 0.01,
          default: this.polySynth_.getParameters().filterRelease
        });

    let filterDetuneSlider_ = new ParamController(
        containerId, this.polySynth_.setParameter.bind(this.polySynth_), {
          name: 'Detune Amount',
          id: 'filterDetuneAmount',
          type: 'range',
          min: this.polySynth_.minDetuneAmount,
          max: this.polySynth_.maxDetuneAmount,
          step: 0.01,
          default: this.polySynth_.getParameters().filterDetuneAmount
        });
  }
  
  initializeBitcrusherGUI_(containerId){
    let bitcrusherBitDepthSlider_ = new ParamController(
        containerId, this.polySynth_.setBitDepth.bind(this.polySynth_), {
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
        containerId, this.polySynth_.setReduction.bind(this.polySynth_), {
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
      // Only one of |this.polySynth_.activeBitcrusherRoute_| and
      // |this.polySynth_.bypassBitcrusherRoute_| has a non-zero gain.
      if (event.target.textContent === 'Active') {
        event.target.textContent = 'Bypassed';

        // The change is scheduled slightly into the future to avoid glitching.
        const t = this.context_.currentTime + 0.01;
        this.polySynth_.bypassBitcrusherRoute.gain.linearRampToValueAtTime(
            1, t);
        this.polySynth_.activeBitcrusherRoute.gain.linearRampToValueAtTime(
            0, t);

        bitcrusherBitDepthSlider_.disable();
        bitcrusherReductionSlider_.disable();
      } else {
        event.target.textContent = 'Active';
        const t = this.context_.currentTime + 0.01;
        this.polySynth_.activeBitcrusherRoute.gain.linearRampToValueAtTime(
            1, t);
        this.polySynth_.bypassBitcrusherRoute.gain.linearRampToValueAtTime(
            0, t);

        bitcrusherBitDepthSlider_.enable();
        bitcrusherReductionSlider_.enable();
      }
    }
  }

  initializeConvolverGUI_(containerId, selectorId) {
    let convolverWetnessSlider_ = new ParamController(
        containerId, this.polySynth_.setConvolverWetness.bind(this.polySynth_),
        {
          name: 'Wetness',
          id: 'wetness',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.convolverWetness
        });

    // The synth's convolver node buffer changes depending the selected url.
    let selector = document.getElementById(selectorId);
    for (let index in this.impulseResponseUrls_) {
      let urlParts = this.impulseResponseUrls_[index].split('/');
      let abbreviatedUrl = urlParts[urlParts.length - 1];
      let option = document.createElement('option');
      option.value = index;
      option.textContent = abbreviatedUrl;
      selector.appendChild(option);
    }

    selector.onchange = (event) => {
      let responseIndex = parseInt(event.target.value);
      this.polySynth_.setConvolverBuffer(
          this.impulseResponseBuffers_[responseIndex]);

      // Deselect the target to prevent interference with keyboard.
      event.target.blur();
    }
  }

  initializeFeedbackDelayGUI_(containerId){
    let feedbackWetnessSlider_ = new ParamController(
        containerId, this.polySynth_.setFeedbackWetness.bind(this.polySynth_), {
          name: 'Wetness',
          id: 'wetness',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.feedbackWetness
        });

    let feedbackDelaySlider_ = new ParamController(
        containerId, this.polySynth_.setFeedbackDelayTime.bind(this.polySynth_), {
          name: 'Delay',
          id: 'delay',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.feedbackDelayTime
        });

    let feedbackGainSlider_  = new ParamController(
        containerId, this.polySynth_.setFeedbackGain.bind(this.polySynth_), {
          name: 'Gain',
          id: 'feedbackGain',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.1,
          default: this.polySynth_.feedbackGain
        });
  }

  getImpulseResponseUrls_() {
    let impulseResponseUrls =
        [
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
          '../samples/audio/impulse-responses/matrix-reverb1.wav',
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
