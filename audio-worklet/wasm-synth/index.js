/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
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

 import DemoHelper from './lib/DemoHelper.js';

 const context = new AudioContext();
 let synthNode, volumeNode;
 
 async function setupAudio() {
   // Load the processor file and create a node. Then connect it to a volume
   // control and the audio output of the browser.
   await context.audioWorklet.addModule('SynthProcessor.js');
   synthNode = new AudioWorkletNode(context, 'my-synth');
   volumeNode = new GainNode(context, {gain: 0.25});
   synthNode.connect(volumeNode).connect(context.destination);
 }
 
 function onButtonChange(isDown) {
   synthNode.port.postMessage(isDown);
 }
 
 async function setupMIDI() {
   // Set up Web MIDI API so we can pass all incoming MIDI data an event handling
   // function.
   const midiAccess = await navigator.requestMIDIAccess();
   midiAccess.inputs.forEach(midiInput => {
     midiInput.onmidimessage = event => synthNode.port.postMessage(event.data);
   });
 }
 
 DemoHelper.build({
   onButtonChange: onButtonChange,
   onDemoStart: () => context.resume(),
   onDemoStop: () => context.suspend(),
   onUserGesture: async () => {
     setupAudio();
     setupMIDI();
     context.suspend();
   },
 });
 