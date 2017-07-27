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
 * @class PolySynthVoice
 * @descriptor A voice generates a waveform and filters it, exposing the
 *             sound through this.output.
 */
class PolySynthVoice {
  /**
   * @constructor
   * @param {AudioContext} context the audio context
   * @param {PolySynth} synth the synthesizer that manages this voice
   * @param {String} noteName the name of the note corresponding to the pitch
   * @param {Number} pitch the frequency corresponding to the voice's note
   * @param {Object} parameters voice settings which will not change as a
   *                            voice is played
   * @param {Number} parameters.cutoff the cutoff for the lowpass filter
   * @param {Number} parameters.attack seconds until full amplitude
   * @param {Number} parameters.decay seconds until sustain level
   * @param {Number} parameters.sustain the steady amplitude of the note as it
   *                                    is pressed
   * @param {Number} parameters.release seconds between the release of a note
   *                                    and zero amplitude
   */
  constructor(context, synth, modulators, settings) {
    if (settings == null) settings = {};
    if (modulators == null) modulators = {};
    this.context_ = context;
    this.attack_ = settings.attack || 0;
    this.decay_ = settings.decay || 0;
    this.sustain_ = settings.sustain || 0.1;
    this.release_ = settings.release || 0;

    this.cutoff_ = modulators.cutoff || 12000;

    this.synth_ = synth;

    // The name of the note is used as an argument in the |this.synth_.endNote|
    // callback.
    this.noteName_ = noteName;

    // TODO: add second oscillator
    this.oscillatorA_ = new OscillatorNode(
        this.context_, {frequency: pitch, type: 'sawtooth'});
    this.lowPassFilter_ = new BiquadFilterNode(
        this.context_, {frequency: t, type: 'lowpass'});

    this.output = new GainNode(this.context_);
    this.oscillatorA_.connect(this.lowPassFilter_).connect(this.output);
    this.oscillatorA_.start();
  }

  set cutoff(cutoff) {
    this.lowPassFilter_.frequency.value = cutoff;
  }

  /**
   * Play a note according to ADSR settings.
   */
  start() {
    // Ramp to full amplitude in attack (ms) and to sustain in decay (ms).
    const t = this.context_.currentTime;
    const timeToFullAmplitude = t + this.attack_;
    const timeToSustain = timeToFullAmplitude + this.decay_;
    this.output.gain.setValueAtTime(0, t);
    this.output.gain.linearRampToValueAtTime(1, timeToFullAmplitude);
    this.output.gain.linearRampToValueAtTime(this.sustain_, timeToSustain);
  }

  /**
   * On key release, stop the note according to this.release_.
   */
  release() {
    // Cancel scheduled audio param changes, and fade note according to
    // release time.
    const t = this.context_.currentTime;
    const timeToZeroAmplitude = t + this.release_;
    this.output.gain.cancelAndHoldAtTime(t);
    this.output.gain.linearRampToValueAtTime(0, timeToZeroAmplitude);
    this.oscillatorA_.stop(timeToZeroAmplitude);

    // Trigger the parent synthesizer to remove its reference to the voice when
    // the oscillator has stopped.
    this.oscillatorA_.onended = this.synth_.endNote(this.noteName_);
  }
}
