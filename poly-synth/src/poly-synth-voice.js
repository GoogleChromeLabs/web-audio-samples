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
class PolySynthVoice {
  /**
   * @class  PolySynthVoice
   * @constructor
   * A voice generates a waveform and filters it, exposing the sound through
   * this.output.
   * @param {AudioContext} context the audio context
   * @param {String} note the note corresponding to the frequency
   * @param {Number} frequency the frequency corresponding to the voice's note
   * @param {Number} cutoff the cutoff frequency for the lowpass filter
   * @param {PolySynth} parentSynthesizer the synthesizer that manages this
   *                                      voice.
   * @param {Object} options optional parameters
   * @param {String} options.waveform the oscillator's waveform
   * @param {Number} options.attack milliseconds until full amplitude
   * @param {Number} options.decay milliseconds until sustain level
   * @param {Number} options.sustain the steady amplitude of the note as it is
   *                                 pressed
   * @param {Number} options.release milliseconds between the release of a note
   *                                 and zero amplitude
   */
  constructor(context, note, frequency, cutoff, parentSynthesizer, options) {
    if (!(context instanceof AudioContext))
      throw context + ' is not a valid audio context.';
    if (options == null) options = {};

    this.context_ = context;
    const waveform = options.waveform || 'sawtooth';
    this.attack_ = options.attack || 0;
    this.decay_ = options.decay || 0;
    this.sustain_ = options.sustain || 0.1;
    this.release_ = options.release || 0;
    this.parentSynthesizer_ = parentSynthesizer;
    this.note_ = note;

    // TODO: add second oscillator
    this.oscillatorA_ = new OscillatorNode(
        this.context_, {frequency: frequency, type: waveform});

    this.lowPassFilter = new BiquadFilterNode(
        this.context_, {frequency: cutoff, type: 'lowpass'});

    this.output = new GainNode(this.context_);
    this.oscillatorA_.connect(this.lowPassFilter).connect(this.output);
  }

  /**
   * Play a note according to ADSR settings.
   */
  start() {
    // Ramp to full amplitude in attack (ms) and to sustain in decay (ms).
    const t = this.context_.currentTime;
    const timeToFullAmplitude = t + this.attack_ / 1000;
    const timeToSustain = timeToFullAmplitude + this.decay_ / 1000;
    this.output.gain.setValueAtTime(0, t);
    this.output.gain.linearRampToValueAtTime(1, timeToFullAmplitude);
    this.output.gain.linearRampToValueAtTime(this.sustain_, timeToSustain);
    this.oscillatorA_.start();
  }

  /**
   * On key release, stop the note according to this.release_.
   */
  release() {
    // Cancel scheduled audio param changes, and fade note according to release.
    const t = this.context_.currentTime;
    const timeToZeroAmplitude = t + this.release_ / 1000;
    this.output.gain.cancelAndHoldAtTime(t);
    this.output.gain.linearRampToValueAtTime(0, timeToZeroAmplitude);
    this.oscillatorA_.stop(timeToZeroAmplitude);

    // Trigger the parent synthesizer to remove its reference to the voice when
    // the oscillator has stopped.
    window.setTimeout(this.parentSynthesizer_.endNote(this.note_), this.release_);
  }
}
