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

#ifndef SIMPLE_VOICE_H
#define SIMPLE_VOICE_H

#include <cstring>
#include "SynthMark.h"
#include "SynthTools.h"
#include "VoiceBase.h"
#include "SawtoothOscillator.h"
#include "SawtoothOscillatorDPW.h"
#include "SquareOscillatorDPW.h"
#include "BiquadFilter.h"
#include "EnvelopeADSR.h"
#include "PitchToFrequency.h"


class SimpleVoice : public VoiceBase {
 public:
  SimpleVoice()
      : VoiceBase(),
        mFilter1(),
        mFilter2(),
        mFilterEnv(),
        mAmpEnv() {
    mSawOscs = new SawtoothOscillatorDPW[mNumOscs];
    mFilterEnv.setAttackTime(0.02);
    mFilterEnv.setDecayTime(0.02);
    mFilterEnv.setSustainLevel(0.707);
    mFilterEnv.setReleaseTime(0.05);
    mAmpEnv.setAttackTime(0.02);
    mAmpEnv.setDecayTime(0.02);
    mAmpEnv.setSustainLevel(0.707);
    mAmpEnv.setReleaseTime(0.05);
  }

  ~SimpleVoice() {
    delete[] mSawOscs;
  };

  void generate(int32_t numFrames) {
    synth_float_t *frequencyBuffer = mBuffer1;
    synth_float_t *mixBuffer = mBuffer2;
    memset(mixBuffer, 0, numFrames * sizeof(float));
    computeFrequency();
    for (int osc = 0; osc < mNumOscs; ++osc) {
      SynthTools::fillBuffer(
          frequencyBuffer, numFrames, mFrequency * mDetune[osc]);
      mSawOscs[osc].generate(frequencyBuffer, numFrames);
      SynthTools::addBuffers(
          mSawOscs[osc].output, mOscGains[osc], mixBuffer, numFrames);
    }

    mFilterEnv.generate(numFrames);
    synth_float_t *cutoffBuffer = mBuffer1;
    SynthTools::scaleOffsetBuffer(mFilterEnv.output, cutoffBuffer, numFrames,
                                  mFilterEnvDepth, mFilterCutoff);
    mFilter1.generate(mixBuffer, cutoffBuffer, numFrames);
    mFilter2.generate(mFilter1.output, cutoffBuffer, numFrames);

    mAmpEnv.generate(numFrames);

    SynthTools::multiplyBuffers(
        mFilter2.output, mAmpEnv.output, UnitGenerator::output, numFrames);
  }

  void start() {
    for (int osc = 0; osc < mNumOscs; ++osc)
      mSawOscs[osc].setPhase(SynthTools::nextRandomDouble());
    mFilterEnv.setGate(true);
    mAmpEnv.setGate(true);
  }

  void stop() {
    mFilterEnv.setGate(false);
    mAmpEnv.setGate(false);
  }

  void setPitch(synth_float_t pitch) {
    mTargetFrequency = PitchToFrequency::convertPitchToFrequency(pitch);
  }

  void setGlideFactor(synth_float_t glideFactor) {
    mGlideFactor = glideFactor;
  }

  void setFilterCutoff(synth_float_t filterCutoff) {
    mFilterCutoff = filterCutoff;
  }

  void setFilterQ(synth_float_t filterQ) {
    mFilterQ = filterQ;
    mFilter1.setQ(mFilterQ);
    mFilter2.setQ(mFilterQ);
  }

  void setFilterEnvDepth(synth_float_t envDepth) {
    mFilterEnvDepth = envDepth;
  }

  void setFilterAttack(synth_float_t attackTime) {
    mFilterEnv.setAttackTime(attackTime);
  }

  void setFilterDecay(synth_float_t decayTime) {
    mFilterEnv.setDecayTime(decayTime);
  }

  void setFilterSustain(synth_float_t level) {
    mFilterEnv.setSustainLevel(level);
  }

  void setFilterRelease(synth_float_t releaseTime) {
    mFilterEnv.setReleaseTime(releaseTime);
  }

  void setAmpAttack(synth_float_t attackTime) {
    mAmpEnv.setAttackTime(attackTime);
  }

  void setAmpDecay(synth_float_t decayTime) {
    mAmpEnv.setDecayTime(decayTime);
  }

  void setAmpSustain(synth_float_t level) {
    mAmpEnv.setSustainLevel(level);
  }

  void setAmpRelease(synth_float_t releaseTime) {
    mAmpEnv.setReleaseTime(releaseTime);
  }

  void printParameters() {
    printf(
        "------------------\n"
        "TONE:\n Glide=%f\n Cutoff=%f\n Q=%f\n FilterEnvDepth=%f\n"
        "FILTER ENV:\n A=%f\n D=%f\n S=%f\n R=%f\n"
        "AMP ENV:\n A=%f\n D=%f\n S=%f\n R=%f\n",
        mGlideFactor, mFilterCutoff, mFilterQ, mFilterEnvDepth,
        mFilterEnv.getAttackTime(), mFilterEnv.getDecayTime(),
        mFilterEnv.getSustainLevel(), mFilterEnv.getReleaseTime(),
        mAmpEnv.getAttackTime(), mAmpEnv.getDecayTime(),
        mAmpEnv.getSustainLevel(), mAmpEnv.getReleaseTime());
  }

 private:
  void computeFrequency() {
    mFrequency += (mTargetFrequency - mFrequency) * mGlideFactor;
  }

  SawtoothOscillatorDPW* mSawOscs = nullptr;
  BiquadFilter mFilter1;
  BiquadFilter mFilter2;
  EnvelopeADSR mFilterEnv;
  EnvelopeADSR mAmpEnv;

  int32_t mNumOscs = 7;
  synth_float_t mDetune[7] =
      {0.8908, 0.9382, 0.9811, 1, 1.0204, 1.0633, 1.1077};
  synth_float_t mOscGains[7] =
      {0.0789, 0.1052, 0.1578, 0.3157, 0.1578, 0.1052, 0.07894};
  synth_float_t mTargetFrequency = 261.63;
  synth_float_t mFrequency = 261.63;
  synth_float_t mGlideFactor = 0.01;
  synth_float_t mFilterCutoff = 8000;
  synth_float_t mFilterQ = 0.01;
  synth_float_t mFilterEnvDepth = 100;

  synth_float_t mBuffer1[SYNTHMARK_FRAMES_PER_RENDER];
  synth_float_t mBuffer2[SYNTHMARK_FRAMES_PER_RENDER];
};

#endif // SIMPLE_VOICE_H
