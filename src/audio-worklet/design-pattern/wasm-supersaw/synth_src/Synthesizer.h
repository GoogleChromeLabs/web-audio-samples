/*
 * Copyright (C) 2019 The Android Open Source Project
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

#ifndef SYNTHESIZER_H
#define SYNTHESIZER_H

#include <vector>

#include "SynthMark.h"
#include "SynthTools.h"
#include "VoiceBase.h"
#include "SimpleVoice.h"

class Synthesizer {
 public:
  Synthesizer(int32_t sampleRate) {
    UnitGenerator::setSampleRate(sampleRate);
    mVoice = new SimpleVoice();
  }

  virtual ~Synthesizer() {};

  void noteOn(uint8_t pitch) {
    mPitches.push_back(static_cast<float>(pitch));
    mVoice->setPitch(mPitches.back());
    if (mPitches.size() == 1)
      mVoice->start();
  }

  void noteOff(uint8_t pitch) {
    mPitches.erase(std::remove(mPitches.begin(), mPitches.end(),
                               static_cast<float>(pitch)),
        mPitches.end());
    if (mPitches.size() >= 1)
      mVoice->setPitch(mPitches.back());
    if (mPitches.size() == 0)
      mVoice->stop();
  }

  void setFilterCutoff(synth_float_t value){
    mVoice->setFilterCutoff(
        SynthTools::interpolateMIDIValue(value, 0, 8000.0));
  }

  void controlChange(uint8_t control, uint8_t value) {
    setControlMode(static_cast<ControlMode>(control), value);
    routeControlChange(control, value);
  }

  void render(float* output, int32_t numFrames) {
    int32_t framesLeft = numFrames;
    while (framesLeft >= SYNTHMARK_FRAMES_PER_RENDER) {
      mVoice->generate(SYNTHMARK_FRAMES_PER_RENDER);
      for (int i = 0; i < SYNTHMARK_FRAMES_PER_RENDER; i++)
        *output++ = static_cast<float>(mVoice->output[i]);
      framesLeft -= SYNTHMARK_FRAMES_PER_RENDER;
    }
  }

 private:
  enum ControlMode {
    kPrintParameters = 5,
    kTone = 50,
    kFilterEnv = 51,
    kAmpEnv = 52
  };

  enum ControlSource {
    kKnobBlue = 1,
    kKnobGreen = 2,
    kKnobWhite = 3,
    kKnobOrange = 4,
  };

  void setControlMode(ControlMode controlMode, uint8_t value) {
    if (value != 127)
      return;
    switch(controlMode) {
      case ControlMode::kTone:
      case ControlMode::kFilterEnv:
      case ControlMode::kAmpEnv:
        mControlMode = controlMode;
        printf("CONTROL MODE = %d\n", controlMode);
        break;
      case ControlMode::kPrintParameters:
        mVoice->printParameters();
        break;
    }
  }

  void routeControlChange(uint8_t control, uint8_t value) {
    switch (mControlMode) {
      case ControlMode::kTone:
        controlTone(control, value);
        break;
      case ControlMode::kFilterEnv:
        controlFilterEnv(control, value);
        break;
      case ControlMode::kAmpEnv:
        controlAmpEnv(control, value);
        break;
      default:
        break;
    }
  }

  void controlTone(uint8_t control, uint8_t value) {
    switch (control) {
      case ControlSource::kKnobBlue:
        mVoice->setGlideFactor(
            SynthTools::interpolateMIDIValue(value, 0.00001, 0.01));
        break;
      case ControlSource::kKnobGreen: {
        mVoice->setFilterCutoff(
            SynthTools::interpolateMIDIValue(value, 0, 8000.0));
        break;
      }
      case ControlSource::kKnobWhite:
        mVoice->setFilterQ(
            SynthTools::interpolateMIDIValue(value, 0.01, 10.0));
        break;
      case ControlSource::kKnobOrange:
        mVoice->setFilterEnvDepth(
            SynthTools::interpolateMIDIValue(value, 1000.0, 5000.0));
        break;
    }
  }

  void controlFilterEnv(uint8_t control, uint8_t value) {
    switch (control) {
      case ControlSource::kKnobBlue:
        mVoice->setFilterAttack(
            SynthTools::interpolateMIDIValue(value, 0.001, 2.0));
        break;
      case ControlSource::kKnobGreen:
        mVoice->setFilterDecay(
            SynthTools::interpolateMIDIValue(value, 0.001, 1.0));
        break;
      case ControlSource::kKnobWhite:
        mVoice->setFilterSustain(
            SynthTools::interpolateMIDIValue(value, 0.0001, 1.0));
        break;
      case ControlSource::kKnobOrange:
        mVoice->setFilterRelease(
            SynthTools::interpolateMIDIValue(value, 0.001, 2.0));
        break;
    }
  }

  void controlAmpEnv(uint8_t control, uint8_t value) {
    switch (control) {
      case ControlSource::kKnobBlue:
        mVoice->setAmpAttack(
            SynthTools::interpolateMIDIValue(value, 0.001, 2.0));
        break;
      case ControlSource::kKnobGreen:
        mVoice->setAmpDecay(
            SynthTools::interpolateMIDIValue(value, 0.001, 1.0));
        break;
      case ControlSource::kKnobWhite:
        mVoice->setAmpSustain(
            SynthTools::interpolateMIDIValue(value, 0.0001, 1.0));
        break;
      case ControlSource::kKnobOrange:
        mVoice->setAmpRelease(
            SynthTools::interpolateMIDIValue(value, 0.001, 2.0));
        break;
    }
  }

  SimpleVoice* mVoice = nullptr;
  std::vector<synth_float_t> mPitches;
  ControlMode mControlMode = ControlMode::kTone;
};

#endif // SYNTHMARK_SYNTHESIZER_H
