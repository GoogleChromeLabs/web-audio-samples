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
   * Initalizes and modifies bitcrusher settings in response to GUI input.
   * @param {AudioContext} context the Audio Context
   * @param {String} containerId container for GUI elements
   */
  constructor(context, containerId) {
    this.context_ = context;
    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});
    
    // Create a bit crusher with the audio worklet node.
    this.bitcrusherAudioWorklet_ =
        new AudioWorkletNode(this.context_, 'bitcrusher-audio-worklet');
    this.paramBitDepth_ =
        this.bitcrusherAudioWorklet_.parameters.get('bitDepth');
    this.paramReduction_ =
        this.bitcrusherAudioWorklet_.parameters.get('reduction');

    // The script processor will have a delay relative to the audio worklet node
    // proportional to the size of its buffersize. This delay can be heard as
    // a glitch as the user switches node.
    const scriptProcessorBufferSize = 4096;

    // The user can swap between the script processor and audio worklet node
    // by checking and unchecking useAudioWorkletCheckBox_.
    this.bitcrusherScriptProcessor_ = new Bitcrusher(this.context_, {
        channelCount: 1,
        bufferSize: scriptProcessorBufferSize,
        bitDepth: this.paramBitDepth_.defaultValue,
        reduction: this.paramReduction_.defaultValue
    });

    this.bitcrusherAudioWorklet_.connect(this.masterGain_);
    this.masterGain_.connect(this.context_.destination);
    this.initializeGUI_(containerId);
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
   * @param {String} containerId the id of parent container
   */
  initializeGUI_(containerId) {
    this.sourceButton_ = new SourceController(
        containerId, this.start.bind(this), this.stop.bind(this));

    // Place 3 parameters in container to real-time adjust Bitcrusher settings.
    this.bitDepthSlider_ =
        new ParamController(containerId, this.setBitDepth.bind(this), {
          type: 'range',
          min: this.paramBitDepth_.minValue,
          max: this.paramBitDepth_.maxValue,
          step: 0.1,
          default: this.paramBitDepth_.defaultValue,
          name: 'Bit Depth'
        });
    this.bitDepthSlider_.disable();

    this.reductionSlider_ =
        new ParamController(containerId, this.setReduction.bind(this), {
          type: 'range',
          min: this.paramReduction_.minValue,
          max: this.paramReduction_.maxValue,
          step: 1,
          default: this.paramReduction_.defaultValue,
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

    // GUI controls allow switching between audio worklet and script processor.
    // The audio worklet node is used by default.
    this.useAudioWorkletCheckBox_ = document.createElement('input');
    this.useAudioWorkletCheckBox_.type = 'checkbox';
    this.useAudioWorkletCheckBox_.checked = true;
    const audioworkletLabel = document.createElement('label');
    audioworkletLabel.textContent =
        'Use AudioWorklet (if unchecked, use ScriptProcessor Bitcrusher).';

    this.useAudioWorkletCheckBox_.addEventListener(
        'change', this.switchBitcrusherNode.bind(this));

    let container = document.getElementById(containerId);
    container.appendChild(this.useAudioWorkletCheckBox_);
    container.appendChild(audioworkletLabel);
  }

  /**
   * Switch between whether the audio worklet node or script processor node
   * connects to the master gain node.
   */
  switchBitcrusherNode() {
    // The function is called after the checkbox switches state.
    const changeToScriptProcessor = !this.useAudioWorkletCheckBox_.checked;
    if (changeToScriptProcessor) {
      this.bitcrusherScriptProcessor_.output.connect(this.masterGain_);
      this.bitcrusherAudioWorklet_.disconnect();
    } else {
      this.bitcrusherAudioWorklet_.connect(this.masterGain_);
      this.bitcrusherScriptProcessor_.output.disconnect();
    }
  }

  /**
   * Change bit depth.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new bit depth
   */
  setBitDepth(value) {
    if (value < 1) throw 'The minimum bit depth rate is 1.';
    this.paramBitDepth_.value = value;
    this.bitcrusherScriptProcessor_.bitDepth = value;
  }

  /**
   * Change sample rate reduction.
   * This is bound to an event listener by a ParamController
   * @param {Number} value the new sample rate reduction
   */
  setReduction(value) {
    if (value < 1) throw 'The minimum reduction rate is 1.';
    this.paramReduction_.value = value;
    this.bitcrusherScriptProcessor_.reduction = value;
  }

  /**
   * Change the volume.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new gain
   */
  setGain(value) {
    this.masterGain_.gain.value = value;
  }

  /**
   * Start audio processing and configure UI elements.
   */
  start() {
    // Play song, running samples through a bitcrusher under user control.
    this.bufferSource_ =
        new AudioBufferSourceNode(this.context_, {buffer: this.songBuffer});
    
    this.bufferSource_.connect(this.bitcrusherAudioWorklet_);
    this.bufferSource_.connect(this.bitcrusherScriptProcessor_.input);

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
