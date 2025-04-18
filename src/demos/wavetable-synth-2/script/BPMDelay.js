// Copyright 2011, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Represents the beat divisions relative to a quarter note.
const noteDivisionTimes = [
  1 / 8, // 32nd note
  (1 / 4) * (2 / 3), // 16th note triplet
  (1 / 8) * (3 / 2), // dotted 32nd note
  1 / 4, // 16th note
  (1 / 2) * (2 / 3), // 8th note triplet
  (1 / 4) * (3 / 2), // dotted 16th note
  1 / 2, // 8th note
  1 * (2 / 3), // quarter note triplet
  (1 / 2) * (3 / 2), // dotted eighth note
  1, // quarter note
  2 * (2 / 3), // half note triplet
  1 * (3 / 2), // dotted quarter note
  2, // half note
];

// Maps descriptive names to their corresponding index in noteDivisionTimes.
const noteDivisionMap = {
  '32nd note': 0,
  '16th note triplet': 1,
  'dotted 32nd note': 2,
  '16th note': 3,
  '8th note triplet': 4,
  'dotted 16th note': 5,
  '8th note': 6,
  'quarter note triplet': 7,
  'dotted eighth note': 8,
  'quarter note': 9,
  'half note triplet': 10,
  'dotted quarter note': 11,
  'half note': 12,
};

export class BPMDelay {
  constructor(context, initialTempo = 120, initialNoteDivisionIndex = 6) {
    if (!context || typeof context.createDelay !== 'function') {
      throw new Error('A valid AudioContext is required.');
    }
    this.context = context;
    this.delayNode = context.createDelay();
    this.tempo = initialTempo;

    if (initialNoteDivisionIndex < 0 || initialNoteDivisionIndex >= noteDivisionTimes.length) {
        console.warn(`Invalid initialNoteDivisionIndex: ${initialNoteDivisionIndex}. Defaulting to 6 (8th note).`);
        initialNoteDivisionIndex = 6;
    }
    this.noteDivision = noteDivisionTimes[initialNoteDivisionIndex];

    this.updateDelayTime();
  }

  /**
   * Sets the tempo in beats per minute (BPM).
   * @param {number} tempo - The desired tempo.
   */
  setTempo(tempo) {
    if (typeof tempo !== 'number' || tempo <= 0) {
        console.error('Invalid tempo value. Tempo must be a positive number.');
        return;
    }
    this.tempo = tempo;
    this.updateDelayTime();
  }

  /**
   * Sets the delay time based on a note division string (e.g., "quarter note").
   * @param {string} noteDivisionName - The name of the note division.
   */
  setDelayValue(noteDivisionName) {
    const index = noteDivisionMap[noteDivisionName];
    if (index !== undefined) {
      this.setDelayIndex(index);
    } else {
      console.error(`Invalid delay value string: "${noteDivisionName}"`);
    }
  }

  /**
   * Sets the delay time based on an index into the noteDivisionTimes array.
   * @param {number} index - The index of the desired note division.
   */
  setDelayIndex(index) {
    if (index >= 0 && index < noteDivisionTimes.length) {
      this.noteDivision = noteDivisionTimes[index];
      this.updateDelayTime();
    } else {
        console.error(`Invalid delay index: ${index}. Must be between 0 and ${noteDivisionTimes.length - 1}.`);
    }
  }

  /**
   * Recalculates and updates the delay node's delayTime based on the current tempo and note division.
   * @private
   */
  updateDelayTime() {
    // The constant 0.0008435... (0.37299 / 44100) seems like a small fixed offset, possibly related to buffer sizes or latency compensation in the original implementation.
    // It's kept here for functional equivalence, though its exact purpose isn't clear from the context.
    // A sample rate of 44100 Hz is assumed based on the original calculation.
    const fixedOffset = 0.37299 / 44100.0;
    const beatDuration = 60.0 / this.tempo; // Duration of one quarter note in seconds
    const delayTime = fixedOffset + beatDuration * this.noteDivision;

    // Use setTargetAtTime for smoother transitions if needed, though setValueAtTime is often sufficient for direct changes.
    this.delayNode.delayTime.setValueAtTime(delayTime, this.context.currentTime);
  }

  get node() {
    return this.delayNode;
  }
}
