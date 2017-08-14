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
    this.workletIsAvailable_ = workletIsAvailable;

    this.attack_ = 0;
    this.attackMax_ = 0.1;
    this.attackMin_ = 0;
    this.release_ = 0;
    this.releaseMin_ = 0;
    this.releaseMax_ = 0.1;

    // There are two sound sources (speech and noise), which are mixed
    // together and summed. From this summing junction, the signal splits into
    // three paths, one going through the script processor noise gate, one going
    // through the audio worklet noise gate and one bypassing the noise gate.
    this.noiseGain_ = new GainNode(this.context_, {gain: 0});
    this.speechAndNoiseSummingJunction_ = new GainNode(this.context_);
    this.bypassNoisegateRoute_ = new GainNode(this.context_, {gain: 0});
    this.activeNoisegateRoute_ = new GainNode(this.context_, {gain: 1});
    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});

    // The recorded speech sample is louder than -40db and not muted by default.
    this.threshold_ = -40;
    this.thresholdMin_ = -100;
    this.thresholdMax_ = 0;

    if (this.workletIsAvailable_) {
      this.noisegateAudioWorklet_ =
          new AudioWorkletNode(this.context_, 'noisegate-audio-worklet');

      // The script processor is used by default, and if workletGain_.gain is 0,
      // then scriptProcessorGain_.gain is 1, and vice versa.
      this.workletGain_ = new GainNode(this.context_, {gain: 0});
      this.speechAndNoiseSummingJunction_.connect(this.noisegateAudioWorklet_)
          .connect(this.workletGain_)
          .connect(this.activeNoisegateRoute_);
    }

    const scriptProcessorBufferSize = 4096;
    this.noisegateScriptProcessor_ = new NoiseGate(this.context_, {
      channelCount: 1,
      attack: this.attack_,
      release: this.release_,
      threshold: this.threshold_
    });
    this.scriptProcessorGain_ = new GainNode(this.context_);

    this.noiseGain_.connect(this.speechAndNoiseSummingJunction_);
    this.speechAndNoiseSummingJunction_.connect(this.bypassNoisegateRoute_)
        .connect(this.masterGain_);

    this.speechAndNoiseSummingJunction_.connect(
        this.noisegateScriptProcessor_.input);
    this.noisegateScriptProcessor_.output.connect(this.scriptProcessorGain_)
        .connect(this.activeNoisegateRoute_)
        .connect(this.masterGain_);

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
   * @param {String} containerId ID of parent container element.
   * @param {String} workletButtonId ID of worklet radio button.
   * @param {String} scriptProcessorButtonId ID of scriptProcessor radio button.
   * @param {String} bypassButtonId ID of bypass button.
   */
  initializeGUI(
      containerId, workletButtonId, scriptProcessorButtonId, bypassButtonId) {
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
          step: 0.001,
          default: this.attack_,
          name: 'Attack (s)'
        });
    this.attackSlider_.disable();

    this.releaseSlider_ =
        new ParamController(containerId, this.setRelease.bind(this), {
          type: 'range',
          min: this.releaseMin_,
          max: this.releaseMax_,
          step: 0.001,
          default: this.release_,
          name: 'Release (s)'
        });
    this.releaseSlider_.disable();

    this.masterGainSlider_ =
        new ParamController(containerId, this.setGain.bind(this), {
          type: 'range',
          min: 0,
          max: 5,
          step: 0.01,
          default: this.masterGain_.gain.value,
          name: 'Master Volume'
        });

    this.noiseGainSlider_ =
        new ParamController(containerId, this.setNoiseGain.bind(this), {
          type: 'range',
          min: 0,
          max: 5,
          step: 0.01,
          default: 0,
          name: 'Noise Volume'
        });

    let workletButton = document.getElementById(workletButtonId);
    if (this.workletIsAvailable_)
      workletButton.addEventListener('click', this.workletSelected.bind(this));
    else
      workletButton.disabled = true;

    document.getElementById(scriptProcessorButtonId)
        .addEventListener('click', this.scriptProcessorSelected.bind(this));

    // Sound is not processed by the noise gate if in bypass mode.
    document.getElementById('bypassButton').onclick = (event) => {
      // Only one of |activeNoisegateRoute_| and |bypassNoisegateRoute_|
      // has a non-zero gain.
      if (event.target.textContent === 'Active') {
        event.target.textContent = 'Bypassed';
        const t = this.context_.currentTime + 0.01;
        this.bypassNoisegateRoute_.gain.setValueAtTime(1, t);
        this.activeNoisegateRoute_.gain.setValueAtTime(0, t);

        this.attackSlider_.disable();
        this.releaseSlider_.disable();
        this.thresholdSlider_.disable();
      } else {
        event.target.textContent = 'Active';
        const t = this.context_.currentTime + 0.01;
        this.activeNoisegateRoute_.gain.setValueAtTime(1, t);
        this.bypassNoisegateRoute_.gain.setValueAtTime(0, t);

        if (this.playing) {
          this.attackSlider_.enable();
          this.releaseSlider_.enable();
          this.thresholdSlider_.enable();
        }
      }
    }
  }

  workletSelected() {
    // Switching occurs 10ms into the future for thread synchronization.
    const t = this.context_.currentTime + 0.01;
    this.workletGain_.gain.setValueAtTime(1, t);
    this.scriptProcessorGain_.gain.setValueAtTime(0, t);
  }

  scriptProcessorSelected() {
    const t = this.context_.currentTime + 0.01;
    this.scriptProcessorGain_.gain.setValueAtTime(1, t);
    this.workletGain_.gain.setValueAtTime(0, t);
  }

  /**
   * Change the threshold.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new threshold.
   */
  setThreshold(value) {
    this.noisegateScriptProcessor_.threshold = value;
  }

  /**
   * Change attack.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new attack value.
   */
  setAttack(value) {
    this.noisegateScriptProcessor_.attack = value;
  }

  /**
   * Change release.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new sample rate reduction.
   */
  setRelease(value) {
    this.noisegateScriptProcessor_.release = value;
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
   * Change the volume of the noise source.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value The new gain.
   */
  setNoiseGain(value) {
    this.noiseGain_.gain.value = value;
  }

  /**
   * Start audio processing and configure UI elements.
   */
  start() {
    this.noiseSource_ = new AudioBufferSourceNode(
        this.context_, {buffer: this.noiseBuffer_, loop: true});
    this.speechSource_ = new AudioBufferSourceNode(
        this.context_, {buffer: this.speechBuffer_, loop: true});

    this.noiseSource_.connect(this.noiseGain_);
    this.speechSource_.connect(this.speechAndNoiseSummingJunction_);

    this.speechSource_.onended =
        () => {
          this.sourceButton_.enable();
          this.attackSlider_.disable();
          this.releaseSlider_.disable();
          this.thresholdSlider_.disable();
        }

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
