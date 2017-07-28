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
 * @description  Manages the life cycle of voices.
 */
class PolySynth {
  /**
   * @constructor
   * @param {AudioContext} context the audio context
   */
  constructor(context) {
    if (!(context instanceof AudioContext))
      throw context + ' is not a valid audio context.';

    this.context = context;
    this.activeVoices_ = [];
    this.releasedVoices_ = [];

    // The default maximum cutoff is set below the upper edge of human
    // hearing and the minimum cutoff is above the lower edge of human hearing.
    // Frequencies at either extreme are not typically used in electronic music.
    this.lowPassMaxCutoff = 12000;
    this.lowPassMinCutoff = 60;

    // By default, the filter should not affect audible frequencies.
    this.lowPassCutoff_ = this.lowPassMaxCutoff;

    // The client is responsible for connecting [this.output] to a destination.
    this.output = new GainNode(this.context);
  }

  /**
   * Create a new voice and add it to the map of active voices.
   * @param {String} noteName The note to be played, e.g. A4 for an octave 4 A.
   * @param {Number} pitch The corresponding pitch of the note, e.g 440.
   */
  playVoice(noteName, pitch) {
    let voice = new PolySynthVoice(noteName, pitch, this);
    voice.output.connect(this.output);
    this.activeVoices_[noteName] = voice;
    voice.start();
  }

  /**
   * Release the note.
   * @param {String} note The name of the note released which corresponds to its
   *                      key in this.activeVoices_.
   */
  releaseVoice(noteName) {
    // Move reference to voice to the released voice map.
    let voice = this.activeVoices_[noteName];
    this.releasedVoices_[noteName] = voice;
    voice.release();
    delete this.activeVoices_[noteName];
  }

  /**
   * Remove references to the voice (corresponding to note). Voice trigger
   * this event.
   * @param {String} noteName The name of the note released which corresponds to
   *                          its key in this.releasedVoices_.
  */
  endVoice(noteName) {
    delete this.releasedVoices_[noteName];
  }

  /**
   * @typedef {Object} Parameters which can change the output of
   *                   a voice while it is active. These values are mapped to
   *                   Audio Params in each voice.
   * @property {Number} lowPassCutoff The lowpass filter's cutoff.
   */
  
  /**
   * Returns parameters that can be modulated by the user to affect audio
   * produced during the life cycle of a voice.
   * @returns {Parameters}
   */
  getParameters() {
    // TODO: Add Q, and other parameters. Let ADSR be controlled by variables.
    return {
      lowPassCutoff: this.lowPassCutoff_
    }
  }

  /**
   * @typedef {Object} Settings Parameters which can change only affect the
   *                            output of a voice if set before the voice is
   *                            constructed.
   * @property {Number} attack Seconds until full amplitude.
   * @property {Number} decay Seconds until sustain level.
   * @property {Number} sustain The steady amplitude of the note as it
   *                            is pressed.
   * @property {Number} release Seconds between the release of a note
   *                            and zero amplitude.
   */
  
  /**
   * Returns settings that affect how a voice is constructed but do not alter
   * the sound produced by a voice as it is played.
   * @returns {Settings} settings
   */
  getSettings() {
    return {
      attack: 0,
      decay: 0,
      sustain: 0.1,
      release: 0
    }
  }

  /**
   * Set the low pass filter cutoff for each voice.
   * @param {Number} value the cutoff of the lowpass filter for each voice.
   */
  setCutoff(value) {
    this.lowPassCutoff_ = value;
    for (let voiceId in this.activeVoices_) {
      this.activeVoices_[voiceId].cutoff = this.lowPassCutoff_;
    }
    for (let voiceId in this.releasedVoices_) {
      this.releasedVoices_[voiceId].cutoff = this.lowPassCutoff_;
    }
  }
}
