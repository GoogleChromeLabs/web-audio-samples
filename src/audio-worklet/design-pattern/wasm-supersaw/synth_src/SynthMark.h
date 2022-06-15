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
 */

#ifndef SYNTHMARK_SYNTHMARK_H
#define SYNTHMARK_SYNTHMARK_H

#define SYNTHMARK_MAJOR_VERSION        1
#define SYNTHMARK_MINOR_VERSION        4

#ifndef SYNTHMARK_MAX_VOICES
// This may be increased without invalidating the benchmark.
#define SYNTHMARK_MAX_VOICES           512
#endif

#ifndef SYNTHMARK_NUM_VOICES_LATENCY
#define SYNTHMARK_NUM_VOICES_LATENCY   4
#endif

#ifndef SYNTHMARK_NUM_VOICES_JITTER
#define SYNTHMARK_NUM_VOICES_JITTER    4
#endif

// The number of frames that are synthesized at one time.
#ifndef SYNTHMARK_FRAMES_PER_RENDER
#define SYNTHMARK_FRAMES_PER_RENDER    8
#endif

// The number of frames that are consumed by DMA or a mixer at one time.
#ifndef SYNTHMARK_FRAMES_PER_BURST
#define SYNTHMARK_FRAMES_PER_BURST     192
#endif

#ifndef SYNTHMARK_SAMPLE_RATE
#define SYNTHMARK_SAMPLE_RATE          48000
#endif

#ifndef SYNTHMARK_TARGET_CPU_LOAD
// 0.5 = 50% target CPU utilization
#define SYNTHMARK_TARGET_CPU_LOAD      0.5
#endif

#ifndef SYNTHMARK_NUM_SECONDS
#define SYNTHMARK_NUM_SECONDS          10 // 10 seconds
#endif

// These should not be changed.
#define SYNTHMARK_MILLIS_PER_SECOND  ((int64_t)1000)
#define SYNTHMARK_MICROS_PER_SECOND  ((int64_t)1000000)
#define SYNTHMARK_NANOS_PER_MICROSECOND  ((int64_t)1000)
#define SYNTHMARK_NANOS_PER_SECOND   ((int64_t)1000000000)

typedef float synth_float_t;

/**
 * A fractional amplitude corresponding to exactly -96 dB.
 * amplitude = pow(10.0, db/20.0)
 */
#define SYNTHMARK_DB96    (1.0 / 63095.73444801943)
/** A fraction that is approximately -90.3 dB. Defined as 1 bit of an S16. */
#define SYNTHMARK_DB90    (1.0 / (1 << 15))

#endif // SYNTHMARK_SYNTHMARK_H
