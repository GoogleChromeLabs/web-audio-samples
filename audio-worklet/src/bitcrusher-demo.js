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

    // GUI default settings depend on parameter values defined in audio-worklet.
    this.bitDepthMaxValue_ = this.paramBitDepth_.maxValue;
    this.bitDepthMinValue_ = this.paramBitDepth_.minValue;
    this.bitDepthDefaultValue_ = this.paramBitDepth_.defaultValue;
    this.reductionMaxValue_ = this.paramReduction_.maxValue;
    this.reductionMinValue_ = this.paramReduction_.minValue;
    this.reductionDefaultValue_ = this.paramReduction_.defaultValue;

    // For the audio worklet, the bit depth and reduction parameters are
    // modulated by changing the offset to connected constant source nodes.
    this.bitDepthOffsetNode_ = new ConstantSourceNode(context, {offset:0});
    this.reductionOffsetNode_ = new ConstantSourceNode(context, {offset:0});
    this.bitDepthOffsetNode_.connect(this.paramBitDepth_);
    this.reductionOffsetNode_.connect(this.paramReduction_);
    this.bitDepthOffsetNode_.start();
    this.reductionOffsetNode_.start();

    // The user can swap between the bitcrusher and audio worklet node
    // by checking and unchecking useAudioWorkletCheckBox_.
    this.bitcrusherScriptProcessor_ = new Bitcrusher(this.context_, {
        channelCount: 1,
        bitDepth: this.bitDepthDefaultValue_,
        reduction: this.reductionDefaultValue_
    });
    
    // The audio worklet bitcrusher is used by default.
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
          min: this.bitDepthMinValue_,
          max: this.bitDepthMaxValue_,
          step: 0.1,
          default: this.bitDepthDefaultValue_,
          name: 'Bit Depth'
        });
    this.bitDepthSlider_.disable();

    this.reductionSlider_ =
        new ParamController(containerId, this.setReduction.bind(this), {
          type: 'range',
          min: this.reductionMinValue_,
          max: this.reductionMaxValue_,
          step: 1,
          default: this.reductionDefaultValue_,
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
        'Use Audio Worklet (if unchecked, use Script Processor Bitcrusher).';

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
    if (this.useAudioWorkletCheckBox_.checked) {
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
    if (value < 1) console.error('The minimum bit depth rate is 1.');
    
    this.bitDepthOffsetNode_.offset.value =
          value - this.bitDepthDefaultValue_;

    this.bitcrusherScriptProcessor_.bitDepth = value;
  }

  /**
   * Change sample rate reduction.
   * This is bound to an event listener by a ParamController
   * @param {Number} value the new sample rate reduction
   */
  setReduction(value) {
    if (value < 1) console.error('The minimum reduction rate is 1.');
    
    this.reductionOffsetNode_.offset.value =
          value - this.reductionDefaultValue_;

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
    this.song_ =
        new AudioBufferSourceNode(this.context_, {buffer: this.songBuffer});
    
    this.song_.connect(this.bitcrusherAudioWorklet_);
    this.song_.connect(this.bitcrusherScriptProcessor_.input);

    this.song_.onended = () => {
      this.sourceButton_.enable();
      this.bitDepthSlider_.disable();
      this.reductionSlider_.disable();
    }

    this.song_.start();
    this.bitDepthSlider_.enable();
    this.reductionSlider_.enable();
  }

  /**
   * Stop audio processing and configure UI elements.
   */
  stop() {
    this.song_.stop();
    this.bitDepthSlider_.disable();
    this.reductionSlider_.disable();
  }
}
