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
 */

#ifndef SYNTHMARK_VOICE_BASE_H
#define SYNTHMARK_VOICE_BASE_H

#include <cstdint>
#include "SynthMark.h"
#include "UnitGenerator.h"
#include "ChannelContext.h"

/**
 * Base class for building synthesizers.
 */
class VoiceBase  : public UnitGenerator
{
public:

    void setPitch(synth_float_t pitch) {
        mPitch = pitch;
    }

    void noteOn(synth_float_t pitch, synth_float_t velocity) {
        mVelocity = velocity;
        mPitch = pitch;
    }

    void noteOff() {
    }

    virtual void generate(int32_t numFrames) = 0;

    synth_float_t getBentPitch() {
        if (mChannelContext == nullptr) {
            return mPitch;
        } else {
            return mPitch + mChannelContext->getBend();
        }
    }

    void setChannelContext(ChannelContext *channelContext) {
        mChannelContext = channelContext;
    }

protected:
    synth_float_t mPitch = 60.0f;
    synth_float_t mVelocity = 1.0f;
    ChannelContext  *mChannelContext = nullptr;
};

#endif // SYNTHMARK_VOICE_BASE_H
