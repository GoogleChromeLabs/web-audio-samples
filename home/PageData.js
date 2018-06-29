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

const GitHubRepo = '//googlechromelabs.github.io/web-audio-samples/';

export default {

  Resources: {
    listTitle: 'Tools and Resources',
    listData: [
      {
        title: 'AudioWorklet',
        description: 'Examples and resources for AudioWorklet development',
        url: 'audio-worklet/',
      },
      {
        title: 'Tone.js',
        description: 'Framework for creating interactive music in the browser',
        url: '//tonejs.github.io/',
      },
      {
        title: 'Omnitone',
        description: '360 audio renderer for web',
        url: '//googlechrome.github.io/omnitone/',
      },
      {
        title: 'Resonance Audio for Web',
        description: 'SDK for interactive Ambisonic soundfield',
        url: '//developers.google.com/resonance-audio/develop/web/getting-started',
      },
      {
        title: 'WebAudio Inspector DevTool Extension',
        description: 'Chrome DevTool extension for Web Audio API',
        url: '//github.com/google/audion/',
      },
      {
        title: 'Canopy',
        description: 'WebAudio tool for tinkering and debugging',
        url: '//hoch.github.io/canopy/',
      },
    ],
  },

  Projects: {
    listTitle: 'Projects',
    listData: [
      {
        title: 'Chrome Music Lab',
        description: 'Learning music through web technology',
        url: '//musiclab.chromeexperiments.com/',
      },
      {
        title: 'WebAudio Demos',
        description: 'WebAudio demo collection by Chris Wilson',
        url: '//webaudiodemos.appspot.com/',
      },
      {
        title: 'Google Doodle: Hiphop',
        description: '44th Anniversary of the Birth of Hip Hop',
        url: '//www.google.com/doodles/44th-anniversary-of-the-birth-of-hip-hop',
      },
      {
        title: 'Google Doodle: Clara Rockmore',
        description: 'Clara Rockmore’s 105th Birthday',
        url: '//www.google.com/doodles/clara-rockmores-105th-birthday',
      },
      {
        title: 'Google Doodle: Robert Moog’s 78th Birthday',
        description: 'Robert Moog’s 78th Birthday',
        url: '//www.google.com/doodles/robert-moogs-78th-birthday',
      },
      {
        title: 'Beautiful Audio Editor',
        description: 'Web-based multitrack recorder/editor',
        url: '//beautifulaudioeditor.appspot.com/',
      },
      {
        title: 'Filter Playground',
        description: 'Interactive filter design tool on web',
        url: '//borismus.github.io/filter-playground/',
      },
      {
        title: 'Box2D Stress Test',
        description: 'Box2D WebAudio Stress Test',
        url: GitHubRepo + 'stress-test/boxes/',
      },
      {
        title: 'WaveTable Synthesizer',
        url: GitHubRepo + 'samples/audio/wavetable-synth.html',
      },
      {
        title: 'WebGL visualizaiton with AnalyserNode',
        url: GitHubRepo + 'samples/audio/visualizer-gl.html',
      },
      {
        title: 'Panning and Reverberation',
        url: GitHubRepo + 'samples/audio/simple.html',
      },
      {
        title: '8 Ball',
        url: GitHubRepo + 'samples/audio/o3d-webgl-samples/pool.html',
      }
    ]
  },

};