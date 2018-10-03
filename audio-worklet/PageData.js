/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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

export default {

  TopBar: {
    pathData: [
      ['Home', '../'],
      ['AudioWorklet']
    ],
  },

  BasicDemo: {
    listTitle: 'Basic Demo',
    listData: [
      {
        title: 'Hello Audio Worklet!',
        description: `
            A simple AudioWorkletNode that bypasses its input to output.`,
        url: 'basic/hello-audio-worklet/',
      },
      {
        title: 'One Pole Filter',
        description: `A one-pole filter built with AudioWorkletNode.`,
        url: 'basic/one-pole-filter/',
      },
      {
        title: 'Noise Generator with AudioParam',
        description: `A simple noise generator with user-defined AudioParam
            modulated by an oscillator.`,
        url: 'basic/noise-generator/',
      },
      {
        title: 'BitCrusher with AudioParam',
        description: `A BitCrusher example from the specification, plus
            AudioParam automation.`,
        url: 'basic/bit-crusher/',
      },
      {
        title: 'MessagePort',
        description: `A simple demo of bi-directional communication between
            AudioWorkletNode and AudioWorkletProcessor.`,
        url: 'basic/message-port/',
      },
      {
        title: 'Handling Errors',
        description: `A simple demo on how to use error event handler.`,
        url: 'basic/handling-errors/',
      }
    ],
  },

  DesignPattern: {
    listTitle: 'Advanced Design Pattern',
    listData: [
      {
        title: 'AudioWorklet and WebAssembly',
        description: `A basic set up for AudioWorklet and WebAssembly.`,
        url: 'design-pattern/awn/index.html',
      },
      {
        title: 'Ring Buffer and AudioWorkletProcessor',
        description: `Using Ring Buffer to work with buffer size difference.`,
        url: 'design-pattern/awn-ring-buffer/index.html',
      },
      {
        title: 'AudioWorklet, SharedArrayBuffer and Worker',
        description: `Suitable for large-scale audio application requires a
            seperate thread for intensive audio processing.`,
        url: 'design-pattern/awn-shared-buffer/index.html',
      }
    ],
  },

  Resources: {
    listTitle: 'Resources',
    listData: [
      {
        title: 'Enter AudioWorklet',
        description: `An introductory article on AudioWorklet from Google
            Developer Portal.`,
        url: '//developers.google.com/web/updates/2017/12/audio-worklet',
      },
      {
        title: 'AudioWorklet Design Pattern',
        description: `An in-depth article on useful design patterns for
            WebAssembly and SharedArrayBuffer.`,
        url: '//developers.google.com/web/updates/2018/06/audio-worklet-design-pattern',
      },
      {
        title: 'Talk: AudioWorklet - What, Why and How',
        description: `A recorded talk about the launch of AudioWorklet. (2017)`,
        url: '//goo.gl/R2zWtR',
      },
      {
        title: 'Slides: AudioWorklet - What, Why and How',
        description: `The slide deck for the recorded talk. (2017)`,
        url: '//docs.google.com/presentation/d/11OZyHyWRTWOCETW4x7m5gCPNSdSl9HevCQ1aiR_0xFE/edit?usp=sharing',
      },
      {
        title: 'AudioWorklet - The future of web audio',
        description: `The first conference paper (ICMC 2018) about the design and the technical aspect of AudioWorklet.`,
        url: '//drive.google.com/file/d/1-SZvEESLa7SgqqjW7ACdIXZRS4YHTQAR/view',
      },
      {
        title: 'Web Audio API: AudioWorklet',
        description: `AudioWorklet section in Web Audio API specification.`,
        url: '//webaudio.github.io/web-audio-api/#AudioWorklet',
      }
    ],
  }

};
