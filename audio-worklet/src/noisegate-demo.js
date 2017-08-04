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
class NoisegateDemo {
  /**
   * @class NoisegateDemo
   * @constructor Initializes and modifies noisegate settings in response to
   * GUI input.
   * @param {AudioContext} context The Audio Context
   * @param {Boolean} workletIsAvailable Switch depending on browser
   *                  which determines if both script processor and audio
   *                  worklet should be used. If false, only the script
   *                  processor will be used.
   */
  constructor(context, workletIsAvailable) {
    this.context_ = context;
    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});
    this.workletIsAvailable_ = workletIsAvailable;

    this.attack_ = 0;
    this.attackMax_ = 1;
    this.attackMin_ = 0;
    this.release_ = 0;
    this.releaseMin_ = 0;
    this.releaseMax_ = 1;
    this.threshold_ = -100;
    this.thresholdMin_ = -100;
    this.thresholdMax_ = 0;

    // TODO: Implement audio worklet logic.

    const scriptProcessorBufferSize = 4096;
    this.noisegateScriptProcessor_ = new NoiseGate(this.context_, {
        channelCount: 1,
        attack: this.attack_,
        release: this.release_,
        threshold: this.threshold_
    });

    // There are two sound sources (speech and noise), which are mixed
    // together. The user can set the gain of the noise, and also whether or
    // not the mixed sound is processed by the noise gate.
    this.speechGain_ = new GainNode(this.context_);
    this.noiseGain_ = new GainNode(this.context_);
    this.speechAndNoiseGain_ = new GainNode(this.context_);
    this.withoutNoisegateGain_ = new GainNode(this.context_, {gain: 0});
    this.noisegateGain_ = new GainNode(this.context_);
    this.scriptProcessorGain_ = new GainNode(this.context_);

    this.noiseGain_.connect(this.speechAndNoiseGain_);
    this.speechGain_.connect(this.speechAndNoiseGain_);
    this.speechAndNoiseGain_.connect(this.withoutNoisegateGain_)
        .connect(this.masterGain_);
    
    this.speechAndNoiseGain_.connect(this.noisegateScriptProcessor_.input);
    this.noisegateScriptProcessor_.output.connect(this.scriptProcessorGain_)
        .connect(this.noisegateGain_).connect(this.masterGain_);

    this.masterGain_.connect(this.context_.destination);

    this.loadSound('sound/speech.ogg').then((sound) => {
      this.speechBuffer_ = sound;
      this.sourceButton_.enable();
    });

    this.loadSound('sound/white_noise.ogg').then((sound) => {
      this.noiseBuffer_ = sound;
    });

    this.playing_ = false;
  }

  async loadSound(url) {
    const response = await fetch(url);
    const sound = await response.arrayBuffer();
    return this.context_.decodeAudioData(sound);
  }

  /**
   * Initalize HTML elements when document has loaded.
   * @param {String} containerId Id of parent container.
   * @param {String} workletButtonId Id of worklet radio button.
   * @param {String} scriptProcessorButtonId Id of scriptProcessor radio button.
   * @param {String} noisegateId Id of noisegate radio button.
   * @param {String} withoutNoisegateId Id of withoutNoisegate radio button.
   */
  initializeGUI(containerId, workletButtonId, scriptProcessorButtonId,
                noisegateId, withoutNoisegateId) {
    this.sourceButton_ = new SourceController(
        containerId, this.start.bind(this), this.stop.bind(this));

    this.thresholdSlider_ =
        new ParamController(containerId, this.setThreshold.bind(this), {
          type: 'range',
          min: this.thresholdMin_,
          max: this.thresholdMax_,
          step: 1,
          default: this.threshold_,
          name: 'Threshold (dBFS)'
        });
    this.thresholdSlider_.disable();

    this.attackSlider_ =
        new ParamController(containerId, this.setAttack.bind(this), {
          type: 'range',
          min: this.attackMin_,
          max: this.attackMax_,
          step: 0.01,
          default: this.attack_,
          name: 'Attack (s)'
        });
    this.attackSlider_.disable();

    this.releaseSlider_ =
        new ParamController(containerId, this.setRelease.bind(this), {
          type: 'range',
          min: this.releaseMin_,
          max: this.releaseMax_,
          step: 0.01,
          default: this.release_,
          name: 'Release (s)'
        });
    this.releaseSlider_.disable();

    this.gainSlider_ =
        new ParamController(containerId, this.setGain.bind(this), {
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: this.masterGain_.gain.value,
          name: 'Master Volume'
        });

     this.noiseGainSlider_ =
        new ParamController(containerId, this.setNoiseGain.bind(this), {
          type: 'range',
          min: 0,
          max: 3,
          step: 0.01,
          default: 1,
          name: 'Noise Volume'
        });

    // Sound is processed by noise gate only if that radio button is selected.
    document.getElementById(noisegateId)
        .addEventListener('click', this.noisegateSelected.bind(this));
    document.getElementById(withoutNoisegateId)
        .addEventListener('click', this.withoutNoisegateSelected.bind(this));

    // TODO: Allow user to switch between audio worklet and noise gate.
  }

  noisegateSelected() {
    const t = this.context_.currentTime + 0.01;
    this.noisegateGain_.gain.setValueAtTime(1, t);
    this.withoutNoisegateGain_.gain.setValueAtTime(0, t);

    if (this.playing) {
      this.attackSlider_.enable();
      this.releaseSlider_.enable();
      this.thresholdSlider_.enable();
    }
  }

  withoutNoisegateSelected() {
    const t = this.context_.currentTime + 0.01;
    this.withoutNoisegateGain_.gain.setValueAtTime(1, t);
    this.noisegateGain_.gain.setValueAtTime(0, t);

    this.attackSlider_.disable();
    this.releaseSlider_.disable();
    this.thresholdSlider_.disable();
  }

  /**
   * Change the threshold.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new threshold.
   */
  setThreshold(value) {
    // TODO: When the param-controller update lands from the synthesizer branch,
    // the stringToNumber conversion in this and subsequent methods should be
    // removed.
    const numericValue = parseInt(value);
    if (numericValue < -100) throw 'The minimum threshold rate is -100.';
    if (numericValue > 0) throw 'The maximum threshold rate is 0.';
    this.noisegateScriptProcessor_.threshold = numericValue;
  }

  /**
   * Change attack.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new attack value.
   */
  setAttack(value) {
    const numericValue = parseFloat(value);
    if (numericValue < 0) throw 'The minimum attack value is 0.';
    this.noisegateScriptProcessor_.attack = numericValue;
  }

  /**
   * Change release.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new sample rate reduction.
   */
  setRelease(value) {
    const numericValue = parseInt(value);
    if (numericValue < 0) throw 'The minimum reduction rate is 0.';
    this.noisegateScriptProcessor_.release = numericValue;
  }

  /**
   * Change the volume.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new gain.
   */
  setGain(value) {
    this.masterGain_.gain.value = parseFloat(value);
  }

  /**
   * Change the volume of the noise source.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new gain.
   */
  setNoiseGain(value) {
    this.noiseGain_.gain.value = parseFloat(value);
  }

  /**
   * Start audio processing and configure UI elements.
   */
  start() {
    this.noiseSource_ =
        new AudioBufferSourceNode(this.context_, {buffer: this.noiseBuffer_});
    this.speechSource_ =
        new AudioBufferSourceNode(this.context_, {buffer: this.speechBuffer_});
    
    this.noiseSource_.connect(this.noiseGain_);
    this.speechSource_.connect(this.speechGain_);

    this.speechSource_.onended = () => {
      this.sourceButton_.enable();
      this.attackSlider_.disable();
      this.releaseSlider_.disable();
      this.thresholdSlider_.disable();
    }
    
    this.noiseSource_.loop = true;
    this.speechSource_.loop = true;

    this.noiseSource_.start();
    this.speechSource_.start();
    this.attackSlider_.enable();
    this.releaseSlider_.enable();
    this.thresholdSlider_.enable();
    this.playing = true;
  }

  /**
   * Stop audio processing and configure UI elements.
   */
  stop() {
    this.noiseSource_.stop();
    this.speechSource_.stop();
    this.attackSlider_.disable();
    this.releaseSlider_.disable();
    this.thresholdSlider_.disable();
    this.playing = false;
  }
}
