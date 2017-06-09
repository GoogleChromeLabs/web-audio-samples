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
   * @param  {Number} bitDepth the number of bits for each sample
   * @param  {Number} reduction the amount of sample rate reduction to apply
   * @param  {Number} gain the volume of the output
   */
  constructor(bitDepth, reduction, gain) {
    this.context_ = new AudioContext();
    this.masterGain_ = new GainNode(this.context_);
    this.masterGain_.gain.value = gain || 0.5;

    this.bitcrusher_ = new Bitcrusher(this.context_, {
      inputChannels: 1,
      outputChannels: 1,
      bitDepth: bitDepth || 24,
      reduction: reduction || 1
    });

    this.bitcrusher_.output.connect(this.masterGain_);
    this.masterGain_.connect(this.context_.destination);

    this.loadSong_('audio/it-from-bit.mp3', (song) => {
      this.songBuffer = song;
      this.sourceButton_.enable()
    });
  }

  async loadSong_(url, enableSong) {
    try {
      const response = await fetch(url);
      const song = await response.arrayBuffer();
      const buffer = await this.context_.decodeAudioData(song);
      enableSong(buffer);
    }
    catch (err) {
      console.log('Could not retrieve song.', err);
    }
  }

  /**
   * Initalize HTML elements when document has loaded.
   * @param {String} containerId the id of parent container
   */
  initializeGUI(containerId) {
    this.sourceButton_ = new SourceController(
        containerId, this.start.bind(this), this.stop.bind(this));
    this.sourceButton_.disable();

    // Place 3 parameters in container to real-time adjust Bitcrusher_ settings.
    this.bitDepthSlider_ =
        new ParamController(containerId, this.setBitDepth.bind(this), {
          type: 'range',
          min: 1,
          max: 24,
          step: 0.1,
          default: 24,
          name: 'Bit Depth'
        });
    this.bitDepthSlider_.disable();

    this.reductionSlider_ =
        new ParamController(containerId, this.setReduction.bind(this), {
          type: 'range',
          min: 1,
          max: 20,
          step: 1,
          default: 1,
          name: 'Sample Rate Reduction'
        });
    this.reductionSlider_.disable();

    this.gainSlider_ =
        new ParamController(containerId, this.setGain.bind(this), {
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.5,
          name: 'Volume'
        });
  }

  /**
   * Change bit depth.
   * This bound to event listener by a ParamController.
   * @param {Number} value the new bit depth
   */
  setBitDepth(value) {
    this.bitcrusher_.bitDepth = value;
  }

  /**
   * Change sample rate reduction.
   * This is bound to an event listener by a ParamController
   * @param {Number} value the new sample rate reduction
   */
  setReduction(value) {
    this.bitcrusher_.reduction = value;
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
   * Start audio processing.
   */
  start() {
    // Play song, running samples through a bitcrusher under user control.
    this.song_ = this.context_.createBufferSource();
    this.song_.buffer = this.songBuffer;
    this.song_.connect(this.bitcrusher_.input);

    this.song_.start();
    this.bitDepthSlider_.enable();
    this.reductionSlider_.enable();
  }

  /**
   * Stop audio processing.
   */
  stop() {
    this.song_.stop();
    this.bitDepthSlider_.disable();
    this.reductionSlider_.disable();
  }
}
