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
        title: 'Hello AudioWorklet!',
        description: `
            A simple AudioWorkletNode that bypasses the incominng audio stream
            to its output.`,
        url: 'basic/hello-audio-worklet.html',
      },
      {
        title: 'Noise with AudioParam Modulation',
        description: `A simple noise generator with user-defined 'gain'
            AudioParam modulated by an OscillatorNode.`,
        url: 'basic/noise-audio-param.html',
      },
      {
        title: 'BitCrusher with AudioParam Automation',
        description: `A BitCrusher example from the specification, but modified
            to demonstrate AudioParam automations.`,
        url: 'basic/bit-crusher.html',
      },
      {
        title: 'One-Pole Filter',
        description: `A one-pole filter implementation with AudioWorkletNode.`,
        url: 'basic/one-pole.html',
      },
      {
        title: 'MessagePort with AudioWorklet',
        description: `Demonstrates basic bi-directional communication between
            AudioWorkletNode and AudioWorkletProcessor.`,
        url: 'basic/message-port.html',
      },
      {
        title: 'Catching error from AudioWorkletProcessor',
        description: `A simple demonstration on how to use
            AudioWorkletNode.onprocessorerror event handler.`,
        url: 'basic/node-onerror.html',
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
        title: 'Talk: AudioWorklet - What, Why and How',
        description: `An in-depth presentation about the new AudioWorklet.`,
        url: '//goo.gl/R2zWtR',
      },
      {
        title: 'Slides: AudioWorklet - What, Why and How',
        description: `The slide deck for the presentation.`,
        url: '//goo.gl/5c5LPD',
      },
      {
        title: 'Google Developer Blog Post: AudioWorklet',
        description: `An introductory article on AudioWorklet from Google
            Developer Portal.`,
        url: '//developers.google.com/web/updates/2017/12/audio-worklet',
      },
      {
        title: 'Web Audio API: AudioWorklet',
        description: `AudioWorklet section in Web Audio API specification.`,
        url: '//webaudio.github.io/web-audio-api/#AudioWorklet',
      }
    ],
  }

};