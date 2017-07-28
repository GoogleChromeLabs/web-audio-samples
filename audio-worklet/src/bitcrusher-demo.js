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
class BitcrusherDemo {
  /**
   * @class BitcrusherDemo
   * @constructor Initializes and modifies bitcrusher settings in response to
   * GUI input.
   * @param {AudioContext} context the Audio Context
   * @param {Boolean} workletIsAvailable switch depending on browser
   *                  which determines if both script processor and audio
   *                  worklet should be used. If false, only the script
   *                  processor will be used.
   */
  constructor(context, workletIsAvailable) {
    this.context_ = context;
    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});
    this.workletIsAvailable_ = workletIsAvailable;

    // These default values will be overriden if the browser supports
    // AudioWorklet. If not, these values must be defined here since they
    // cannot be fetched from the getParameterDescriptors method of
    // bitcrusher-audio-worklet.js.
    this.bitDepthDefault_ = 24;
    this.bitDepthMax_ = 24;
    this.bitDepthMin_ = 1;
    this.reductionDefault_ = 1;
    this.reductionMax_ = 20;
    this.reductionMin_ = 1;

    // The user can swap between the script processor and audio worklet node.
    if (this.workletIsAvailable_) {
      this.bitcrusherAudioWorklet_ =
          new AudioWorkletNode(this.context_, 'bitcrusher-audio-worklet');
      this.paramBitDepth_ =
          this.bitcrusherAudioWorklet_.parameters.get('bitDepth');
      this.paramReduction_ =
          this.bitcrusherAudioWorklet_.parameters.get('reduction');
      
      // If the audio worklet is used, then default settings for parameters are
      // defined in the getParameterDescriptors method.
      this.bitDepthDefault_ = this.paramBitDepth_.defaultValue;
      this.bitDepthMax_ = this.paramBitDepth_.maxValue;
      this.bitDepthMin_ = this.paramBitDepth_.minValue;
      this.reductionDefault_ = this.paramReduction_.defaultValue;
      this.reductionMax_ = this.paramReduction_.maxValue;
      this.reductionMin_ = this.paramReduction_.minValue;

      // The script processor is used by default, and if workletGain_.gain is 0,
      // then scriptProcessorGain_.gain is 1, and vice versa.
      this.workletGain_ = new GainNode(this.context_, {gain: 0});
      this.bitcrusherAudioWorklet_.connect(this.workletGain_)
          .connect(this.masterGain_);
    }

    const scriptProcessorBufferSize = 4096;
    this.bitcrusherScriptProcessor_ = new Bitcrusher(this.context_, {
        channelCount: 1,
        bufferSize: scriptProcessorBufferSize,
        bitDepth: this.bitDepthDefault_,
        reduction: this.reductionDefault_
    });
    
    this.scriptProcessorGain_ = new GainNode(this.context_);
    this.bitcrusherScriptProcessor_.output.connect(this.scriptProcessorGain_)
        .connect(this.masterGain_);
    this.masterGain_.connect(this.context_.destination);

    this.loadSong_('sound/revenge.ogg').then((song) => {
      this.songBuffer = song;
      this.sourceButton_.enable();
    });
  }

  async loadSong_(url, loadCompletedCallback) {
    const response = await fetch(url);
    const song = await response.arrayBuffer();
    return this.context_.decodeAudioData(song);
  }

  /**
   * Initalize HTML elements when document has loaded.
   * @param {String} containerId id of parent container
   * @param {String} workletButtonId id of worklet radio button
   * @param {String} scriptProcessorButtonId id of scriptProcessor radio button
   */
  initializeGUI(containerId, workletButtonId, scriptProcessorButtonId) {
    this.sourceButton_ = new SourceController(
        containerId, this.start.bind(this), this.stop.bind(this));

    // Place 3 parameters in container to real-time adjust Bitcrusher settings.
    this.bitDepthSlider_ =
        new ParamController(containerId, this.setBitDepth.bind(this), {
          type: 'range',
          min: this.bitDepthMin_,
          max: this.bitDepthMax_,
          step: 0.1,
          default: this.bitDepthDefault_,
          name: 'Bit Depth'
        });
    this.bitDepthSlider_.disable();

    this.reductionSlider_ =
        new ParamController(containerId, this.setReduction.bind(this), {
          type: 'range',
          min: this.reductionMin_,
          max: this.reductionMax_,
          step: 1,
          default: this.reductionDefault_,
          name: 'Sample Rate Reduction'
        });
    this.reductionSlider_.disable();

    this.gainSlider_ =
        new ParamController(containerId, this.setGain.bind(this), {
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: this.masterGain_.gain.value,
          name: 'Volume'
        });

    let workletButton = document.getElementById(workletButtonId);
    if (this.workletIsAvailable_)
      workletButton.addEventListener('click', this.workletSelected.bind(this));
    else
      workletButton.disabled = true;
    
    document.getElementById(scriptProcessorButtonId)
        .addEventListener('click', this.scriptProcessorSelected.bind(this));
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
   * Change bit depth.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new bit depth
   */
  setBitDepth(value) {
    const numericValue = parseFloat(value);
    if (numericValue < 1) throw 'The minimum bit depth rate is 1.';
    
    if (this.workletIsAvailable_)
      this.paramBitDepth_.value = numericValue;
    this.bitcrusherScriptProcessor_.bitDepth = numericValue;
  }

  /**
   * Change sample rate reduction.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new sample rate reduction
   */
  setReduction(value) {
    const numericValue = parseInt(value);
    if (numericValue < 1) throw 'The minimum reduction rate is 1.';
    
    if (this.workletIsAvailable_)
      this.paramReduction_.value = numericValue;
    this.bitcrusherScriptProcessor_.reduction = numericValue;
  }

  /**
   * Change the volume.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new gain
   */
  setGain(value) {
    this.masterGain_.gain.value = parseFloat(value);
  }

  /**
   * Start audio processing and configure UI elements.
   */
  start() {
    // Play song, running samples through a bitcrusher under user control.
    this.bufferSource_ =
        new AudioBufferSourceNode(this.context_, {buffer: this.songBuffer});
    
    this.bufferSource_.connect(this.bitcrusherScriptProcessor_.input);

    if (this.workletIsAvailable_)
      this.bufferSource_.connect(this.bitcrusherAudioWorklet_);

    this.bufferSource_.onended = () => {
      this.sourceButton_.enable();
      this.bitDepthSlider_.disable();
      this.reductionSlider_.disable();
    }

    this.bufferSource_.start();
    this.bitDepthSlider_.enable();
    this.reductionSlider_.enable();
  }

  /**
   * Stop audio processing and configure UI elements.
   */
  stop() {
    this.bufferSource_.stop();
    this.bitDepthSlider_.disable();
    this.reductionSlider_.disable();
  }
}
