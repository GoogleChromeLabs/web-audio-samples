/*
 * Copyright (C) 2017 The Android Open Source Project
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
 */

#ifndef OBOE_SYNTH_CHANNEL_CONTEXT_H
#define OBOE_SYNTH_CHANNEL_CONTEXT_H

#include <stdint.h>
#include "SynthMark.h"

class ChannelContext
{
public:
    /**
     * Set channel bend using the raw 14-bit number extracted from a MIDI message.
     * @param bend14
     */
    void setMidiBend(int bend14) {
        const int32_t offset = 1 << 13;
        int32_t centeredBend = bend14 - offset;
        mBendSemitones = mBendRange * centeredBend * (1.0f / offset);
    }

    /**
     *
     * @return channel bend in semitones
     */
    synth_float_t getBend() {
        return mBendSemitones;
    }

private:
    synth_float_t mBendRange = 2.0f; // pitch offset
    synth_float_t mBendSemitones = 0.0f; // pitch offset
};
#endif //OBOE_SYNTH_CHANNEL_CONTEXT_H
