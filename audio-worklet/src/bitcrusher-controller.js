/*
Copyright 2017, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
    * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 *  Loads sound resources and initiates and configures a Web Audio graph given
 * GUI controls specified in bitcrusher.html. 
 * Sound is routed through a bitcrusher wrapper class defined in bitcrusher.js
 */

/**-----------------------------------------------------------------------------
 	Initialize variables and retrieve song from server
   --------------------------------------------------------------------------**/
let context = new AudioContext();
let bitDepth = 8.0; // the precision in bits of the final sample
let reduction = 10; // bitcrushed buffer will have [reduction] equal samples 

let freq = 440; // default frequency to A4
let oscillator; // oscillator node
let mp3Source; // mp3 sound source
let mp3Buffer; // the Audio Buffer of loaded mp3 track
let bitcrusher; // script processor wrapper implementing a bit crusher node
const songs = ["lonely-tentacle.mp3", "revenge.mp3", "it-from-bit.mp3"];
const folder = "audio/";
const songUrl = folder + songs[2]; // specified url will be loaded


// Retrieve local bitcrusher mp3 file and decode as audio buffer
fetch(songUrl).then(function(response) { 
	return response.arrayBuffer();}).then(function(song) { 
		context.decodeAudioData(song, function(buffer) { // decode as audio buffer
  		mp3Buffer = buffer;
    	document.getElementById("startMp3").disabled = false; // enable mp3 button
  }, function (d) { console.log(d)});
});


/**-----------------------------------------------------------------------------
***GUI Controls: modify bitcrusher parameters
***---------------------------------------------------------------------------*/

/**
 * When oscillator button is clicked, run bitcrushed oscillator at
 * frequency, bit depth, and sample rate reduction specified in GUI 
 */
function testOscillator() {
  oscillator = new OscillatorNode(context); 
  bitcrusher = new Bitcrusher(context, {buffersize: 512, inputChannels: 1, 
  	outputChannels: 1, bitDepth, reduction});
  oscillator.frequency.value = freq; 
  
  // reduce volume of oscillator and connect audio graph
  let gainNode = new GainNode(context);
  gainNode.gain.value =0.2;
  bitcrusher.connectIn(oscillator).connectOut(gainNode);
  gainNode.connect(context.destination); 

 
  oscillator.start();

  // activate controls
  document.getElementById("stopOscillator").disabled = false;
  document.getElementById("bdSlider").disabled = false;
  document.getElementById("srSlider").disabled = false;
  document.getElementById("startOscillator").disabled = true;
  document.getElementById("startMp3").disabled = true;
}

/**
 * When mp3 button is clicked, play loaded sound source at frequency, 
 * bit depth, and sample rate reduction specified in GUI  
 */
function playMP3() {
	mp3Source = context.createBufferSource(); 
	mp3Source.buffer = mp3Buffer; 
	mp3Source.start();
	bitcrusher = new Bitcrusher(context, {buffersize: 512, inputChannels: 1, 
		outputChannels: 1, bitDepth, reduction});
	bitcrusher.connectIn(mp3Source).connectOut(context.destination);
	
	// activate controls
	document.getElementById("stopMP3").disabled = false;
  document.getElementById("bdSlider").disabled = false;
  document.getElementById("srSlider").disabled = false;
  document.getElementById("startMp3").disabled = true;
  document.getElementById("startOscillator").disabled = true;
}

function stopOscillator() {
	oscillator.stop();
	document.getElementById("stopOscillator").disabled = true;
	document.getElementById("startMp3").disabled = false;
	document.getElementById("startOscillator").disabled = false;
}

function stopMP3 () { 
	mp3Source.stop();
	document.getElementById("stopMP3").disabled = true;
	document.getElementById("startOscillator").disabled = false;
	document.getElementById("startMp3").disabled = false;
}

function changeBitDepth(val) {
	bitcrusher.bitDepth = val; 
	let div = document.getElementById('bd');
	div.innerHTML = val;
}

function changeFrequency(val) {
	oscillator.frequency.value = val;
	freq = val;
}

function changeSampleRate(val) {
	bitcrusher.reduction = val;
	let div = document.getElementById('sr');
	div.innerHTML = val;
}
