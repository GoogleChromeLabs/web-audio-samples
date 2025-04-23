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
  constructor(context, tempo = 120, noteDivisionIndex = 6) {
    this.context = context;
    this.delayNode = new DelayNode(context);
    this.tempo = tempo;
    this.noteDivision = noteDivisionTimes[noteDivisionIndex];
    this.updateDelayTime();
  }

  /**
   * Sets the tempo in beats per minute (BPM).
   * @param {number} tempo - The desired tempo.
   */
  setTempo(tempo) {
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
        console.error(`Invalid delay index: ${index}. Must be between 0 and ` +
                      `${noteDivisionTimes.length - 1}.`);
    }
  }

  /**
   * Recalculates and updates the delay node's delayTime based on the current
   * tempo and note division.
   * @private
   */
  updateDelayTime() {
    // The constant 0.0008435... (0.37299 / 44100) seems like a small fixed
    // offset, possibly related to buffer sizes or latency compensation in the
    // original implementation. It's kept here for functional equivalence,
    // though its exact purpose isn't clear from the context. A sample rate of
    // 44100 Hz is assumed based on the original calculation.
    const fixedOffset = 0.37299 / 44100.0;
    // Duration of one quarter note in seconds
    const beatDuration = 60.0 / this.tempo; 
    const delayTime = fixedOffset + beatDuration * this.noteDivision;

    // Use setTargetAtTime for smoother transitions if needed, though
    // setValueAtTime is often sufficient for direct changes.
    this.delayNode.delayTime.linearRampToValueAtTime(
        delayTime, this.context.currentTime);
  }

  get node() {
    return this.delayNode;
  }
}
