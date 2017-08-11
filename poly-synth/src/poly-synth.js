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

    // The maximum and minimum cutoffs are experimentally determined.
    this.maxCutoff = 16000;
    this.minCutoff = 60;

    // The maximum and minimum ADSR values refer to the ADSR for the gain as
    // well as the ADSR for the filter. These values are experimentally
    // determined.
    this.maxAttack = 10;
    this.minAttack = 0;
    this.minSustain = 0.1;
    this.maxSustain = 1;

    // The minimum decay is > 0 since there will be a conflict if the time to
    // the sustain and time to maximum level are identical.
    this.minDecay = 0.01;
    this.maxDecay = 10;
    this.minRelease = 0;
    this.maxRelease = 10;

    // A detune amount of 1 will correspond to 2400 cents detuning from the
    // cutoff value.
    this.minDetuneAmount = 0;
    this.maxDetuneAmount = 5;

    // Q for the low pass filter is in dB and controls how peaked the response
    // is around the cutoff frequency.
    this.minQ = -50;
    this.maxQ = 50;

    // The initial values for the parameters are experimentally determined.
    this.parameters_ = {
      gainAttack: 0.1,
      gainDecay: this.minDecay,
      gainSustain: 0.5,
      gainRelease: 0.1,
      filterCutoff: 440,
      filterQ: 0,
      filterAttack: 1,
      filterDecay: 1,
      filterSustain: this.minSustain,
      filterRelease: this.minRelease,
      filterDetuneAmount: 1
    };

    // The client is responsible for connecting |this.output| to a destination.
    this.output = new GainNode(this.context_);
  }
  
  /**
   * Returns parameters that affect how a voice is constructed.
   * @returns {Object} parameters K-rate parameters which affect the output of a
   *                              voice if set before the voice is constructed.
   * @returns {Number} parameters.gainAttack Seconds until full amplitude.
   * @returns {Number} parameters.gainDecay Seconds between full level and
   *                                        sustain and level.
   * @returns {Number} parameters.gainSustain The steady amplitude of the note
   *                                          as it is pressed.
   * @returns {Number} parameters.gainRelease Seconds between the release of a
   *                                          note and zero amplitude.
   * @returns {Number} parameters.filterCutoff The cutoff of the low pass
   *                                           filter.
   * @returns {Number} parameters.filterQ The peak of the response at the cutoff
   *                                      frequency.
   * @returns {Number} parameters.filterAttack Seconds until full detune.
   * @returns {Number} parameters.filterDecay Seconds between full detune and
   *                                          sustain detune.
   * @returns {Number} parameters.filterSustain The steady detune level as a
   *                                            note is pressed.
   * @returns {Number} parameters.filterRelease Seconds betweeen the release of
   *                                            a note and zero detune.
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
      throw 'The parameter ' + id + ' is not supported';

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
