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
 * @description A voice generates a waveform and filters it, exposing the
 *              sound through |this.output|.
 */
class PolySynthVoice {
  /**
   * @constructor
   * @param {AudioContext} context The audio context.
   * @param {String} noteName The name of the note corresponding to the pitch.
   * @param {Number} frequency The corresponding frequency of the note, e.g 440.
   * @param {PolySynth} synth The synthesizer that manages this voice.
   */
  constructor(context, noteName, frequency, synth) {
    this.synth_ = synth;
    this.context_ = context;
    this.parameters_ = synth.getParameters();
    
    // The name of the note is used as an argument in the
    // |this.synth_.endNote()| callback.
    this.noteName_ = noteName;
    this.frequency_ = frequency;

    this.oscillatorA_ = new OscillatorNode(
        this.context_, {frequency: frequency, type: 'sawtooth'});
    this.lowPassFilter_ = new BiquadFilterNode(
        this.context_,
        {frequency: this.parameters_.cutoff, type: 'lowpass'});

    this.output = new GainNode(this.context_);
    this.oscillatorA_.connect(this.lowPassFilter_).connect(this.output);
    this.oscillatorA_.start();
  }

  /**
   * Play a note according to ADSR settings.
   */
  start() {
    // Ramp to full amplitude in attack (s) and to sustain in decay (s).
    const t = this.context_.currentTime;
    const timeToFullAmplitude = t + this.parameters_.attack;
    const timeToSustain = timeToFullAmplitude + this.parameters_.decay;
    this.output.gain.setValueAtTime(0, t);
    this.output.gain.linearRampToValueAtTime(1, timeToFullAmplitude);
    this.output.gain.linearRampToValueAtTime(
        this.parameters_.sustain, timeToSustain);
  }

  /**
   * On key release, stop the note according to |this.release_|.
   */
  release() {
    // Cancel scheduled audio param changes, and fade note according to
    // release time.
    const t = this.context_.currentTime;
    const timeToZeroAmplitude = t + this.parameters_.release;
    this.output.gain.cancelAndHoldAtTime(t);
    this.output.gain.linearRampToValueAtTime(0, timeToZeroAmplitude);
    this.oscillatorA_.stop(timeToZeroAmplitude);

    // Trigger the parent synthesizer to remove its reference to the voice when
    // the oscillator has stopped.
    this.oscillatorA_.onended = this.synth_.endVoice(this.noteName_);
  }
}
