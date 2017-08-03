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
 * @description Manages the life cycle of voices.
 */
class PolySynth {
  /**
   * @constructor
   * @param {AudioContext} context The audio context.
   */
  constructor(context) {
    if (!(context instanceof AudioContext))
      throw context + ' is not a valid audio context.';

    this.context_ = context;
    this.activeVoices_ = [];
    this.releasedVoices_ = [];

    // The default maximum cutoff is set below the upper edge of human
    // hearing and the minimum cutoff is above the lower edge of human hearing.
    // Frequencies at either extreme are not typically used in electronic music.
    this.lowPassMaxCutoff = 16000;
    this.lowPassMinCutoff = 60;

    // The meaning of each parameter is defined in |getParameters()|.
    this.parameters_ = {
      cutoff: this.lowPassMaxCutoff,
      attack: 0,
      decay: 0,
      sustain: 0.1,
      release: 0
    };

    // The client is responsible for connecting |this.output| to a destination.
    this.output = new GainNode(this.context_);
  }
  
  /**
   * Returns parameters that affect how a voice is constructed.
   * @returns {Object} parameters Parameters which affect the output of a voice
   *                              if set before the voice is constructed.
   * @returns {Number} parameters.attack Seconds until full amplitude.
   * @returns {Number} parameters.decay Seconds until sustain level.
   * @returns {Number} parameters.sustain The steady amplitude of the note as it
   *                                      is pressed.
   * @returns {Number} parameters.release Seconds between the release of a note
   *                                      and zero amplitude.
   */
  getParameters() {
    return this.parameters_;
  }

  /**
   * Sets |this.parameters_[id]| to value.
   * @param {Number} value The new value.
   * @param {String} id The name of the parameter to set.
   */
  setParameter(value, id) {
    if (typeof(this.parameters_[id]) === 'undefined')
      throw('The parameter ' + id + ' is not supported');

    this.parameters_[id] = value;
  }

  /**
   * Create a new voice and add it to |this.activeVoices_|.
   * @param {String} noteName The note to be played, e.g. A4 for an octave 4 A.
   * @param {Number} frequency The corresponding pitch of the note, e.g 440.
   */
  playVoice(noteName, frequency) {
    let voice = new PolySynthVoice(this.context_, noteName, frequency, this);
    voice.output.connect(this.output);
    this.activeVoices_[noteName] = voice;
    voice.start();
  }

  /**
   * Release the note, moving its reference to voice to |this.releasedVoices_|.
   * @param {String} note The name of the note released which corresponds to its
   *                      key in |this.activeVoices_|.
   */
  releaseVoice(noteName) {
    // Move reference to voice to |this.releasedVoices_|.
    let voice = this.activeVoices_[noteName];
    this.releasedVoices_[noteName] = voice;
    voice.release();
    delete this.activeVoices_[noteName];
  }

  /**
   * Remove references to the voice, corresponding to |noteName|. |Voice()|
   * triggers this event.
   * @param {String} noteName The name of the note released which corresponds to
   *                          its key in |this.releasedVoices_|.
   */
  endVoice(noteName) {
    delete this.releasedVoices_[noteName];
  }
}
