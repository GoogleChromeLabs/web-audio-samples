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
class Voice {
  /**
   * A voice generates a waveform and filters it, exposing the sound through
   * this.output.
   * @param {BaseAudioContext} context the audio context
   * @param {Number} frequency the frequency corresponding to the voice's note
   * @param {Object} options optional parameters
   * @param {String} options.waveform the oscillator's waveform
   * @param {Number} options.lowPassCutoff the lowpass filter frequency
   * @param {Number} options.attack milliseconds until full amplitude
   * @param {Number} options.decay milliseconds until sustain level
   * @param {Number} options.sustain the steady amplitude of the note as it is
   *                                 pressed
   * @param {Number} options.release milliseconds between the release of a note
   *                                 and zero amplitude
   */
  constructor(context, frequency, options) {
    this.context_ = context;
    let waveform = options.waveform || 'sawtooth';
    let lowPassCutoff_ = options.lowPassCutoff || 5000;
    this.attack_ = options.attack || 0;
    this.decay_ = options.decay || 0;
    this.sustain_ = options.sustain || 0.1;
    this.release_ = options.release || 0;

    // TODO: add second oscillator
    this.oscillatorA_ = new OscillatorNode(
        this.context_, {frequency: frequency, type: waveform});

    this.lowPassFilter = new BiquadFilterNode(
        this.context_, {frequency: lowPassCutoff_, type: 'lowpass'});

    this.output = new GainNode(this.context_);
    this.oscillatorA_.connect(this.lowPassFilter).connect(this.output);
  }

  /**
   * Play a note according to ADSR settings.
   */
  start() {
    // Ramp to full amplitude in attack (ms) and to sustain in decay (ms).
    this.output.gain.setValueAtTime(0, this.context_.currentTime);
    this.output.gain.linearRampToValueAtTime(
        1, this.context_.currentTime + this.attack_ / 1000);
    this.output.gain.linearRampToValueAtTime(
        this.sustain_,
        this.context_.currentTime + ((this.attack_ + this.decay_) / 1000));

    this.oscillatorA_.start();
  }

  /**
   * On key release, stop the note according to this.release_.
   */
  release() {
    // Cancel scheduled audio param changes, and fade note according to release.
    this.output.gain.cancelAndHoldAtTime(this.context_.currentTime);
    this.output.gain.linearRampToValueAtTime(
        0, this.context_.currentTime + this.release_ / 1000);
    // TODO: should I stop the oscillator at a future point too?
  }
}
