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
   * @param {Boolean} useWorkletAndScriptProcessor switch depending on browser
   *                  which determines if both script processor and audio
   *                  worklet should be used. If false, only the script
   *                  processor will be used.
   */
  constructor(context, containerId, useWorkletAndScriptProcessor) {
    this.context_ = context;
    this.masterGain_ = new GainNode(this.context_, {gain: 0.5});
    this.useWorkletAndScriptProcessor_ = useWorkletAndScriptProcessor;

    // These default values will be overriden if the browser supports
    // AudioWorklet.
    this.bitDepthDefault_ = 24;
    this.bitDepthMax_ = 24;
    this.bitDepthMin_ = 1;
    this.reductionDefault_ = 1;
    this.reductionMax_ = 20;
    this.reductionMin_ = 1;

    // The script processor will have a delay proportional to the size of its
    // buffersize, which can be heard as a glitch as the user switches node.
    const scriptProcessorBufferSize = 4096;

    this.bitcrusherScriptProcessor_ = new Bitcrusher(this.context_, {
        channelCount: 1,
        bufferSize: scriptProcessorBufferSize,
        bitDepth: this.bitDepthDefault_,
        reduction: this.reductionDefault_
    });

    // The user can swap between the script processor and audio worklet node
    // by checking and unchecking useScriptProcessorCheckBox_.
    if (this.useWorkletAndScriptProcessor_) {
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
    }

    this.bitcrusherScriptProcessor_.output.connect(this.masterGain_);
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

    // GUI controls allow switching between audio worklet and script processor.
    // The script processor node is used by default, and switching is not
    // enabled if the browser does not support audio worklet.
    if (this.useWorkletAndScriptProcessor_) {
      this.useScriptProcessorCheckBox_ = document.createElement('input');
      this.useScriptProcessorCheckBox_.type = 'checkbox';
      this.useScriptProcessorCheckBox_.checked = true;
      const audioworkletLabel = document.createElement('label');
      audioworkletLabel.textContent =
          'Use ScriptProcessor (if unchecked, use AudioWorklet Bitcrusher).';

      this.useScriptProcessorCheckBox_.addEventListener(
          'change', this.switchBitcrusherNode.bind(this));

      let container = document.getElementById(containerId);
      container.appendChild(this.useScriptProcessorCheckBox_);
      container.appendChild(audioworkletLabel);
    }
  }

  /**
   * Switch between whether the audio worklet node or script processor node
   * connects to the master gain node.
   */
  switchBitcrusherNode() {
    // The function is called after the checkbox switches state.
    const changeToAudioWorklet = !this.useScriptProcessorCheckBox_.checked;
    if (changeToAudioWorklet) {
      console.log('changing to worklet');
      this.bitcrusherAudioWorklet_.connect(this.masterGain_);
      this.bitcrusherScriptProcessor_.output.disconnect();
    } else {
      this.bitcrusherScriptProcessor_.output.connect(this.masterGain_);
      this.bitcrusherAudioWorklet_.disconnect();
    }
  }

  /**
   * Change bit depth.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new bit depth
   */
  setBitDepth(value) {
    if (value < 1) throw 'The minimum bit depth rate is 1.';
    if (this.useWorkletAndScriptProcessor_)
      this.paramBitDepth_.value = parseFloat(value);
    this.bitcrusherScriptProcessor_.bitDepth = value;
  }

  /**
   * Change sample rate reduction.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new sample rate reduction
   */
  setReduction(value) {
    if (value < 1) throw 'The minimum reduction rate is 1.';
    if (this.useWorkletAndScriptProcessor_)
      this.paramReduction_.value = parseInt(value);
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
    
    this.bufferSource_.connect(this.bitcrusherScriptProcessor_.input);

    if (this.useWorkletAndScriptProcessor_)
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
