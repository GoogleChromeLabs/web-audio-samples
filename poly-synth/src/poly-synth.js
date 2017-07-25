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
class PolySynth {
  /**
   * PolySynth manages the life cycle of voices.
   * to audio params.
   * @param {AudioContext} context the audio context
   */
  constructor(context) {
    if (!(context instanceof AudioContext))
      throw context + ' is not a valid audio context.';

    this.context_ = context;
    this.sustainedVoices_ = [];
    this.releasedVoices_ = [];

    // The default maximum cutoff is set near the upper edge of human hearing
    // and the minimum cutoff is near the lower edge of human hearing.
    this.lowPassMaxCutoff = 12000;
    this.lowPassMinCutoff = 60;

    // By default, the filter should not affect audible frequencies.
    this.lowPassCutoff_ = this.lowPassMaxCutoff;
    this.output = new GainNode(this.context_);
  }

  /**
   * Create a new voice and add it to the map of active voices.
   * @param {String} note the note to be played, e.g. A4 for an octave 4 A
   * @param {Number} frequency the corresponding frequency of the note, e.g 440
   */
  playNote(note, frequency) {
    let voice = new PolySynthVoice(
        this.context_, frequency, this.lowPassCutoff_, this, {});
    voice.output.connect(this.output);
    this.sustainedVoices_[note] = voice;
    voice.start();
  }

  /**
   * Release the note.
   * @param {String} note the name of the note released which corresponds to its
   *                      key in this.sustainedVoices_
   */
  releaseNote(note) {
    // Move reference to voice to the released voice map.
    let voice = this.sustainedVoices_[note];
    this.releasedVoices_[note] = voice;
    voice.release();
    delete this.sustainedVoices_[note];
  }

  /**
   * Remove references to the voice (corresponding to note). The voice triggers
   * this event.
   * @param {String} note the name of the note released which corresponds to its
   *                      key in this.releasedVoices_
  */
  endNote(note) {
    delete this.releasedVoices_[note];
  }

  /**
   * Set the low pass filter cutoff for each voice.
   * @param {Number} value the cutoff of the lowpass filter for each voice
   */
  setLowPass(value) {
    this.lowPassCutoff_ = value;
    for (let voice in this.sustainedVoices_) {
      this.sustainedVoices_[voice].lowPassFilter.frequency.value =
          this.lowPassCutoff_;
      }
    for (let voice in this.releasedVoices_) {
      this.releasedVoices_[voice].lowPassFilter.frequency.value =
          this.lowPassCutoff_;
    }
  }
}
