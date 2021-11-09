/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This code was translated from the JSyn Java code.
 * JSyn is Copyright 2009 Phil Burk, Mobileer Inc
 * JSyn is licensed under the Apache License, Version 2.0
 */

#ifndef SYNTHMARK_PITCH_TO_FREQUENCY_H
#define SYNTHMARK_PITCH_TO_FREQUENCY_H

#include <cstdint>
#include <math.h>
#include "SynthMark.h"
#include "LookupTable.h"
#include "SynthTools.h"

#define SEMITONES_PER_OCTAVE  12
// Pitches are in semitones based on the MIDI standard.
#define MIDDLE_C_PITCH  60
#define MIDDLE_C_FREQUENCY  261.625549

class PowerOfTwoTable : public LookupTable {
public:
    PowerOfTwoTable(int32_t numEntries)
        : LookupTable(numEntries)
        {
            fillTable();
        }

    virtual ~PowerOfTwoTable() {}

    virtual float calculate(float input) override {
        return powf(2.0f, input);
    }
};

class PitchToFrequency
{
public:
    PitchToFrequency() {}

    virtual ~PitchToFrequency() {
    }

    static double convertPitchToFrequency(double pitch) {
        double exponent = (pitch - MIDDLE_C_PITCH) * (1.0 / SEMITONES_PER_OCTAVE);
        return MIDDLE_C_FREQUENCY * pow(2.0, exponent);
    }

    synth_float_t lookupPitchToFrequency(synth_float_t pitch) {
        // Only calculate if input changed since last time.
        if (pitch != lastInput) {
            synth_float_t octavePitch = (pitch - MIDDLE_C_PITCH) * (1.0 / SEMITONES_PER_OCTAVE);
            int32_t octaveIndex = (int) floor(octavePitch);
            synth_float_t fractionalOctave = octavePitch - octaveIndex;

            // Do table lookup.
            synth_float_t value = MIDDLE_C_FREQUENCY * mPowerTable.lookup(fractionalOctave);

            // Adjust for octave by multiplying by a power of 2. Allow for +/- 16 octaves;
            const int32_t octaveOffset = 16;
            synth_float_t octaveScaler = ((synth_float_t)(1 << (octaveIndex + octaveOffset)))
                * (1.0 / (1 << octaveOffset));
            value *= octaveScaler;

            lastInput = pitch;
            lastOutput = value;
            //printf("pitch = %f, index = %d, frequency = %f\n", pitch, index, value);
        }
        return lastOutput;
    }

    /**
     * @param pitches an array of fractional MIDI pitches
     */
    void generate(const synth_float_t *pitches, synth_float_t *frequencies, int32_t count) {
        for (int i = 0; i < count; i++) {
            frequencies[i] = lookupPitchToFrequency(pitches[i]);
        }
    }

private:
    static PowerOfTwoTable mPowerTable;

    synth_float_t lastInput = MIDDLE_C_PITCH;
    synth_float_t lastOutput = MIDDLE_C_FREQUENCY;

};

#endif // SYNTHMARK_PITCH_TO_FREQUENCY_H
