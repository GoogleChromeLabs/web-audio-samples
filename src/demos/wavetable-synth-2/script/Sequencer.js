import { Note } from './Note.js';

const SCHEDULE_AHEAD_TIME = 0.04;
const PITCH_OFFSET = -24;

const LYDIAN_MAP = [
  36, 38, 40, 42, 43, 45, 47, 48, 50, 52, 54, 55, 57, 59, 60, 62, 64, 66, 67,
  69, 71, 72, 74, 76, 78,
];

/**
 * Represents a musical sequence with rhythm and note scheduling capabilities.
 * Note: This class relies on several external variables/objects that should
 * ideally be passed in via the constructor or method arguments for better
 * encapsulation and testability. These include:
 * - tempo: The current tempo in beats per minute.
 * - context: An AudioContext instance.
 * - startTime: The start time of the sequence in the AudioContext's
 * timeline.
 * - arp: Boolean flag indicating if arpeggiation is enabled.
 * - playMonophonic: Boolean flag for monophonic playback.
 * - monophonicNote: An object responsible for playing monophonic notes.
 * - waveTable, waveTable2: Wave tables for sound synthesis.
 * - octave: The base octave for playback.
 * - staticAudioRouting: Configuration for audio routing.
 * - Note: A constructor or class for creating playable notes.
 * - playDoubleOctave: Boolean flag to play notes an octave higher
 * simultaneously.
 */
export class Sequencer {
  /**
   * Initializes a new Sequencer instance.
   */
  constructor() {
    this.tempo = 85.0;

    /** @const {number} The length of the sequence loop (e.g., 16 steps). */
    this.loopLength = 16;

    /** @type {number} The current index within the rhythm array. */
    this.rhythmIndex = 0;

    /** @type {number} The previous rhythm index. */
    this.lastRhythmIndex = -1;

    /** @type {number} The number of times the loop has completed. */
    this.loopNumber = 0;

    /**
     * @type {number} The time of the next note in seconds, relative to the
     * sequence start.
     */
    this.noteTime = 0.0;

    this.startTime = 0.0;

    /**
     * @const {!Int32Array<number>} The rhythm pattern. -1 represents a rest.
     * Other numbers can represent note values or indices.
     */
    this.sequenceData = new Int32Array([
      4, 4, 4, -1, 8, 13, 23, 15, 23, 23, 11, -1, 0, -1, 3, -1,
    ]);
  }

  /**
   * Advances the sequence to the next note/step.
   * Calculates the time for the next note based on the tempo.
   */
  advanceNote() {
    // Advance time by a 16th note.
    const secondsPerBeat = 60.0 / this.tempo;
    // Assuming 4 16th notes per beat
    this.noteTime += 0.25 * secondsPerBeat;

    this.lastRhythmIndex = this.rhythmIndex;
    this.rhythmIndex++;
    if (this.rhythmIndex === this.loopLength) {
      this.rhythmIndex = 0;
      this.loopNumber++;
    }
  }

  schedule(noteData) {
    if (this.startTime === 0.0) {
      this.startTime = noteData.context.currentTime + 0.16;
    }
    let currentTime = noteData.context.currentTime;
    currentTime -= this.startTime;

    const octave = 4; // Doesn't work.

    while (this.noteTime < currentTime + SCHEDULE_AHEAD_TIME) {
      // Convert noteTime (relative to sequence start) back to context time.
      const contextPlayTime = this.noteTime + this.startTime;

      if (this.sequenceData[this.rhythmIndex] != -1) {
        const noteNumber = LYDIAN_MAP[this.sequenceData[this.rhythmIndex]];
        console.log(noteNumber, this.sequenceData[this.rhythmIndex]);
        const note1 = new Note(noteData);
        note1.play(noteNumber + PITCH_OFFSET, octave, contextPlayTime);
        const note2 = new Note(noteData);
        note2.play(noteNumber + 12 + PITCH_OFFSET, octave, contextPlayTime);
      }

      // Advance to the next step in the sequence
      this.advanceNote();
    }
  }

  setTempo(tempo) {
    this.tempo = Math.max(20, Math.min(200, tempo));
  }

  /**
   * Updates the sequencer's rhythm pattern.
   * @param {Int32Array} sequenceData - The new rhythm sequence. Must be an
   * Int32Array with the same length as the current sequence.
   * Values should be numbers (representing note indices or MIDI note numbers)
   * or -1 for rests.
   */
  setSequenceData(sequenceData) {
    if (
      !(sequenceData instanceof Int32Array) ||
      this.sequenceData.length !== sequenceData.length
    ) {
      return;
    }

    this.sequenceData.set(sequenceData);
  }
}
