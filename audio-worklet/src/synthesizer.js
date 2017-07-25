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
class Synthesizer {
  /**
   * Synthesizer manages the life cycle of voices and binds GUI input
   * to audio params.
   * @param {BaseAudioContext} context the audio context
   * @param {Object} options optional parameter
   * @param {options.maxCutoff} the maximum cutoff for filters
   */
  constructor(context, options) {
    this.context_ = context;
    this.voices_ = [];
    this.lowPassCutoff_ = options.maxCutoff || 5000;
    this.output = new GainNode(this.context_);
  }

  /**
   * Create a new voice and add it to the map of active voices.
   * @param {String} note the note to be played, e.g. A4 for an octave 4 A
   * @param {Number} frequency the corresponding frequency of the note, e.g 440
   */
  playNote(note, frequency) {
    let voice = new Voice(this.context_, frequency, {
        maxCutoff: this.lowPassCutoff_
    });
    
    voice.output.connect(this.output);
    this.voices_[note] = voice;
    voice.start();
  }

  /**
   * Release the note.
   * @param {String} note the id of the note released
   */
  releaseNote(note) {
    this.voices_[note].release();
  }

  /**
   * Set the low pass filter cutoff for each voice.
   * @param {Number} value the cutoff of the lowpass filter for each voice
   */
  setLowPass(value) {
    this.lowPassCutoff_ = value;
    for (let voice in this.voices_) {
      this.voices_[voice].lowPassFilter.frequency.value = this.lowPassCutoff_;
    }
  }
}
