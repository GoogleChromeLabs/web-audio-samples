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
/**
 * @class PolySynth
 * @descriptor manages the life cycle of voices.
 */
class PolySynth {
  /**
   * @constructor
   * @param {AudioContext} context the audio context
   */
  constructor(context) {
    if (!(context instanceof AudioContext))
      throw context + ' is not a valid audio context.';

    this.context_ = context;
    this.activeVoices_ = [];
    this.releasedVoices_ = [];

    // The default maximum cutoff is set near the upper edge of human hearing
    // and the minimum cutoff is near the lower edge of human hearing.
    this.lowPassMaxCutoff = 12000;
    this.lowPassMinCutoff = 60;

    // By default, the filter should not affect audible frequencies.
    this.lowPassCutoff_ = this.lowPassMaxCutoff;
    this.output = new GainNode(this.context_);
  }

  getParameters() {
    // TODO: Add Q, and other parameters. Let ADSR be controlled by variables.
    return {
      lowPassCutoff: this.lowPassCutoff_,
      attack: 0,
      decay: 0,
      sustain: 0.1,
      release: 0
    }
  }

  /**
   * Create a new voice and add it to the map of active voices.
   * @param {String} noteName the note to be played, e.g. A4 for an octave 4 A
   * @param {Number} pitch the corresponding pitch of the note, e.g 440
   */
  playVoice(noteName, pitch) {
    let voice = new PolySynthVoice(
        context, this, noteName, pitch, this.getParameters());
    voice.output.connect(this.output);
    this.activeVoices_[noteName] = voice;
    voice.start();
  }

  /**
   * Release the note.
   * @param {String} note the name of the note released which corresponds to its
   *                      key in this.activeVoices_
   */
  releaseVoice(noteName) {
    // Move reference to voice to the released voice map.
    let voice = this.activeVoices_[noteName];
    this.releasedVoices_[noteName] = voice;
    voice.release();
    delete this.activeVoices_[noteName];
  }

  /**
   * Remove references to the voice (corresponding to note). The voice triggers
   * this event.
   * @param {String} noteName the name of the note released which corresponds to
   *                          its key in this.releasedVoices_
  */
  endVoice(noteName) {
    delete this.releasedVoices_[noteName];
  }

  /**
   * Set the low pass filter cutoff for each voice.
   * @param {Number} value the cutoff of the lowpass filter for each voice
   */
  setLowPass(value) {
    this.lowPassCutoff_ = value;
    for (let voiceId in this.activeVoices_) {
      this.activeVoices_[voiceId].lowPassCutoff = this.lowPassCutoff_;
    }
    for (let voiceId in this.releasedVoices_) {
      this.releasedVoices_[voiceId].lowPassCutoff = this.lowPassCutoff_;
    }
  }
}
