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
class SubtractiveSynthDemo {
	constructor(context) {
		this.maxCutoff_ = 5000;
		this.masterGain_ = new GainNode(context, {gain: 0.5});
		
		this.synthesizer_ = new Synthesizer(context, {
				maxCutoff: this.maxCutoff_,
		});

		this.synthesizer_.output.connect(this.masterGain_)
				.connect(context.destination);

		// Initialize a QWERTY keyboard defined in qwerty-hancock.min.js
		// The key A on a computer keyboard maps onto the note C, and the letters
		// to the right of A (SDFGHJ) map onto the notes above C in a C major scale
		// (DEFGAB). The letters WETYU map onto the black keys of a piano.
		this.keyboard_ = new QwertyHancock({
	    id: 'keyboard',
	    width: 600,
	    height: 150,
	    octaves: 2
		});

		this.keyboard_.keyDown = this.keyDown.bind(this);
		this.keyboard_.keyUp = this.keyUp.bind(this);
	}

	/**
	 * Initialize GUI components
	 * @param {String} containerId the id of the HTML container
	 */
	initializeGUI(containerId) {
		this.lowPassCutoffSlider_ =
        new ParamController(containerId,
	        	this.synthesizer_.setLowPass.bind(this.synthesizer_), {
		          type: 'range',
		          min: 0,
		          max: this.maxCutoff_,
		          step: 1,
		          default: this.maxCutoff_,
		          name: 'Low Pass Cutoff'
        });

    this.gainSlider_ =
        new ParamController(containerId, this.setGain.bind(this), {
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: this.masterGain_.gain.value,
          name: 'Volume'
        });
	}

  /**
   * Change the volume.
   * This is bound to an event listener by a ParamController.
   * @param {Number} value the new gain
   */
  setGain(value) {
    this.masterGain_.gain.value = parseFloat(value);
  }

  /**
   * Play a note when a mapped key is pressed.
	 * @param {String} note the note to be played, e.g. A4 for an octave 4 A
	 * @param {Number} frequency the corresponding frequency of the note, e.g 440
   */
	keyDown(note, frequency) {
		this.synthesizer_.playNote(note, frequency);
	}

	/**
	 * Release the note.
	 * @param {String} note the note to be played, e.g. A4 for an octave 4 A
	 * @param {Number} frequency the corresponding frequency of the note, e.g 440
	 */
	keyUp(note, frequency) {
		this.synthesizer_.releaseNote(note, frequency);
	}
}
