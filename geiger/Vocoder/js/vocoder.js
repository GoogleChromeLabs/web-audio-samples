/*
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var CANVAS_WIDTH = 582;
var CANVAS_HEIGHT = 150;
var GAINS_CANVAS_HEIGHT = 100;

var FILTER_QUALITY = 6;  // The Q value for the carrier and modulator filters

var animationRunning = false;

// These are "placeholder" gain nodes - because the modulator and carrier will get swapped in
// as they are loaded, it's easier to connect these nodes to all the bands, and the "real"
// modulator & carrier AudioBufferSourceNodes connect to these.
var modulatorInput = null;
var carrierInput = null;

var modulatorGain = null;
var modulatorGainValue = 1.0;

// noise node added to the carrier signal
var noiseBuffer = null;
var noiseNode = null;
var noiseGain = null;
var noiseGainValue = 0.2;

// Carrier sample gain
var carrierSampleNode = null;
var carrierSampleGain = null;
var carrierSampleGainValue = 0.0;

// Carrier Synth oscillator stuff
var oscillatorNode = null;
var oscillatorType = 4;		// CUSTOM
var oscillatorGain = null;
var oscillatorGainValue = 1.0;
var oscillatorDetuneValue = 0;
var FOURIER_SIZE = 2048;
var wavetable = null;
var wavetableSignalGain = null;
var WAVETABLEBOOST = 40.0;
var SAWTOOTHBOOST = 0.40;

// These are the arrays of nodes - the "columns" across the frequency band "rows"
var modFilterBands = null;		// tuned bandpass filters
var modFilterPostGains = null;	// post-filter gains.
var heterodynes = null;		// gain nodes used to multiply bandpass X sine
var powers = null;			// gain nodes used to multiply prev out by itself
var lpFilters = null;		// tuned LP filters to remove doubled copy of product
var lpFilterPostGains = null; 	// gain nodes for tuning input to waveshapers
var bandAnalysers = null;	// these are just used to drive the visual vocoder band drawing
var carrierBands = null;	// tuned bandpass filters, same as modFilterBands but in carrier chain
var carrierFilterPostGains = null;	// post-bandpass gain adjustment
var carrierBandGains = null;	// these are the "control gains" driven by the lpFilters

var modulatorCanvas = null;
var carrierCanvas = null;
var outputCanvas = null;
var DEBUG_BAND = 5;		// current debug band - used to display a filtered signal

var vocoderBands;
var numVocoderBands;

var hpFilterGain = null;

// this function will algorithmically re-calculate vocoder bands, distributing evenly
// from startFreq to endFreq, splitting evenly (logarhythmically) into a given numBands.
// The function places this info into the global vocoderBands and numVocoderBands variables.
function generateVocoderBands( startFreq, endFreq, numBands ) {
	// Remember: 1200 cents in octave, 100 cents per semitone

	var totalRangeInCents = 1200 * Math.log( endFreq / startFreq ) / Math.LN2;
	var centsPerBand = totalRangeInCents / numBands;
	var scale = Math.pow( 2, centsPerBand / 1200 );  // This is the scaling for successive bands

	vocoderBands = new Array();
	var currentFreq = startFreq;

	for (var i=0; i<numBands; i++) {
		vocoderBands[i] = new Object();
		vocoderBands[i].frequency = currentFreq;
//		console.log( "Band " + i + " centered at " + currentFreq + "Hz" );
		currentFreq = currentFreq * scale;
	}

	numVocoderBands = numBands;
}

function loadNoiseBuffer() {	// create a 5-second buffer of noise
    var lengthInSamples =  5 * audioContext.sampleRate;
    noiseBuffer = audioContext.createBuffer(1, lengthInSamples, audioContext.sampleRate);
    var bufferData = noiseBuffer.getChannelData(0);
    
    for (var i = 0; i < lengthInSamples; ++i) {
        bufferData[i] = (2*Math.random() - 1);	// -1 to +1
    }
}

function initBandpassFilters() {
	// When this function is called, the carrierNode and modulatorAnalyser 
	// may not already be created.  Create placeholder nodes for them.
	modulatorInput = audioContext.createGain();
	carrierInput = audioContext.createGain();

	if (modFilterBands == null)
		modFilterBands = new Array();

	if (modFilterPostGains == null)
		modFilterPostGains = new Array();

	if (heterodynes == null)
		heterodynes = new Array();
	
	if (powers == null)
		powers = new Array();

	if (lpFilters == null)
		lpFilters = new Array();

	if (lpFilterPostGains == null)
		lpFilterPostGains = new Array();

	if (bandAnalysers == null)
		bandAnalysers = new Array();

	
	if (carrierBands == null)
		carrierBands = new Array();

	if (carrierFilterPostGains == null)
		carrierFilterPostGains = new Array();

	if (carrierBandGains == null)
		carrierBandGains = new Array();

    var waveShaperCurve = new Float32Array(65536);
	// Populate with a "curve" that does an abs()
    var n = 65536;
    var n2 = n / 2;
    
    for (var i = 0; i < n2; ++i) {
        x = i / n2;
        
        waveShaperCurve[n2 + i] = x;
        waveShaperCurve[n2 - i - 1] = x;
    }
	
	// Set up a high-pass filter to add back in the fricatives, etc.
	// (this isn't used by default in the "production" version, as I hid the slider)
	var hpFilter = audioContext.createBiquadFilter();
	hpFilter.type = "highpass";
	hpFilter.frequency.value = 8000; // or use vocoderBands[numVocoderBands-1].frequency;
	hpFilter.Q.value = 1; // 	no peaking
	modulatorInput.connect( hpFilter);

	hpFilterGain = audioContext.createGain();
	hpFilterGain.gain.value = 0.0;

	hpFilter.connect( hpFilterGain );
	hpFilterGain.connect( audioContext.destination );

	//clear the arrays
	modFilterBands.length = 0;
	modFilterPostGains.length = 0;
	heterodynes.length = 0;
	powers.length = 0;
	lpFilters.length = 0;
	lpFilterPostGains.length = 0;
	carrierBands.length = 0;
	carrierFilterPostGains.length = 0;
	carrierBandGains.length = 0;
	bandAnalysers.length = 0;

	var outputGain = audioContext.createGain();
	outputGain.connect(audioContext.destination);

	var rectifierCurve = new Float32Array(65536);
	for (var i=-32768; i<32768; i++)
		rectifierCurve[i+32768] = ((i>0)?i:-i)/32768;

	for (var i=0; i<numVocoderBands; i++) {
		// CREATE THE MODULATOR CHAIN
		// create the bandpass filter in the modulator chain
		var modulatorFilter = audioContext.createBiquadFilter();
		modulatorFilter.type = "bandpass";	// Bandpass filter
		modulatorFilter.frequency.value = vocoderBands[i].frequency;
		modulatorFilter.Q.value = FILTER_QUALITY; // 	initial quality
		modulatorInput.connect( modulatorFilter );
		modFilterBands.push( modulatorFilter );

		// Now, create a second bandpass filter tuned to the same frequency - 
		// this turns our second-order filter into a 4th-order filter,
		// which has a steeper rolloff/octave
		var secondModulatorFilter = audioContext.createBiquadFilter();
		secondModulatorFilter.type = "bandpass";	// Bandpass filter
		secondModulatorFilter.frequency.value = vocoderBands[i].frequency;
		secondModulatorFilter.Q.value = FILTER_QUALITY; // 	initial quality
		modulatorFilter.chainedFilter = secondModulatorFilter;
		modulatorFilter.connect( secondModulatorFilter );

		// create a post-filtering gain to bump the levels up.
		var modulatorFilterPostGain = audioContext.createGain();
		modulatorFilterPostGain.gain.value = 6;
		secondModulatorFilter.connect( modulatorFilterPostGain );
		modFilterPostGains.push( modulatorFilterPostGain );

		// Create the sine oscillator for the heterodyne
		var heterodyneOscillator = audioContext.createOscillator();
		heterodyneOscillator.frequency.value = vocoderBands[i].frequency;

		heterodyneOscillator.start(0);

		// Create the node to multiply the sine by the modulator
		var heterodyne = audioContext.createGain();
		modulatorFilterPostGain.connect( heterodyne );
		heterodyne.gain.value = 0.0;	// audio-rate inputs are summed with initial intrinsic value
		heterodyneOscillator.connect( heterodyne.gain );

		var heterodynePostGain = audioContext.createGain();
		heterodynePostGain.gain.value = 2.0;		// GUESS:  boost
		heterodyne.connect( heterodynePostGain );
		heterodynes.push( heterodynePostGain );


		// Create the rectifier node
		var rectifier = audioContext.createWaveShaper();
		rectifier.curve = rectifierCurve;
		heterodynePostGain.connect( rectifier );

		// Create the lowpass filter to mask off the difference (near zero)
		var lpFilter = audioContext.createBiquadFilter();
		lpFilter.type = "lowpass";	// Lowpass filter
		lpFilter.frequency.value = 5.0;	// Guesstimate!  Mask off 20Hz and above.
		lpFilter.Q.value = 1;	// don't need a peak
		lpFilters.push( lpFilter );
		rectifier.connect( lpFilter );

		var lpFilterPostGain = audioContext.createGain();
		lpFilterPostGain.gain.value = 1.0; 
		lpFilter.connect( lpFilterPostGain );
		lpFilterPostGains.push( lpFilterPostGain );

   		var waveshaper = audioContext.createWaveShaper();
		waveshaper.curve = waveShaperCurve;
		lpFilterPostGain.connect( waveshaper );

		// create an analyser to drive the vocoder band drawing
		var analyser = audioContext.createAnalyser();
		analyser.fftSize = 128;	//small, shouldn't matter
		waveshaper.connect(analyser);
		bandAnalysers.push( analyser );

		// Create the bandpass filter in the carrier chain
		var carrierFilter = audioContext.createBiquadFilter();
		carrierFilter.type = "bandpass";
		carrierFilter.frequency.value = vocoderBands[i].frequency;
		carrierFilter.Q.value = FILTER_QUALITY;
		carrierBands.push( carrierFilter );
		carrierInput.connect( carrierFilter );

		// We want our carrier filters to be 4th-order filter too.
		var secondCarrierFilter = audioContext.createBiquadFilter();
		secondCarrierFilter.type = "bandpass";	// Bandpass filter
		secondCarrierFilter.frequency.value = vocoderBands[i].frequency;
		secondCarrierFilter.Q.value = FILTER_QUALITY; // 	initial quality
		carrierFilter.chainedFilter = secondCarrierFilter;
		carrierFilter.connect( secondCarrierFilter );

		var carrierFilterPostGain = audioContext.createGain();
		carrierFilterPostGain.gain.value = 10.0;
		secondCarrierFilter.connect( carrierFilterPostGain );
		carrierFilterPostGains.push( carrierFilterPostGain );

		// Create the carrier band gain node
		var bandGain = audioContext.createGain();
		carrierBandGains.push( bandGain );
		carrierFilterPostGain.connect( bandGain );
		bandGain.gain.value = 0.0;	// audio-rate inputs are summed with initial intrinsic value
		waveshaper.connect( bandGain.gain );	// connect the lp controller

		bandGain.connect( outputGain );
	}

	addSingleValueSlider( "hi-pass gain", hpFilterGain.gain.value, 0.0, 1.0, hpFilterGain, updateSingleGain );
	addSingleValueSlider( "hi-pass freq", hpFilter.frequency.value, 4000, 10000.0, hpFilter, updateSingleFrequency );
	addSingleValueSlider( "hi-pass Q", hpFilter.Q.value, 1, 50.0, hpFilter, updateSingleQ );

	addColumnSlider( "mod filter Q", modFilterBands[0].Q.value, 1.0, 20.0, modFilterBands, updateQs );
	addColumnSlider( "mod filter post gain", modFilterPostGains[0].gain.value, 1.0, 20.0, modFilterPostGains, updateGains );
	addColumnSlider( "heterodyne post gain", heterodynes[0].gain.value, 1.0, 8.0, heterodynes, updateGains );
	addColumnSlider( "lp filter Q", lpFilters[0].Q.value, 1.0, 100.0, lpFilters, updateQs );
	addColumnSlider( "lp filter frequency", lpFilters[0].frequency.value, 1.0, 100.0, lpFilters, updateFrequencies );
	addColumnSlider( "lp filter post gain", lpFilterPostGains[0].gain.value, 1.0, 10.0, lpFilterPostGains, updateGains );

	addSingleValueSlider( "carrier input gain", carrierInput.gain.value, 0.0, 10.0, carrierInput, updateSingleGain );
	addColumnSlider( "carrier filter Q", carrierBands[0].Q.value, 1.0, 20.0, carrierBands, updateQs );
	addColumnSlider( "carrier filter post gain", carrierFilterPostGains[0].gain.value, 1.0, 20.0, carrierFilterPostGains, updateGains );
	addSingleValueSlider( "output gain", outputGain.gain.value, 0.0, 10.0, outputGain, updateSingleGain );

	modulatorInput.connect( analyser1 );
	outputGain.connect( analyser2 );

	// Now set up our wavetable stuff.
	var real = new Float32Array(FOURIER_SIZE);
	var imag = new Float32Array(FOURIER_SIZE);
	real[0] = 0.0;
	imag[0] = 0.0;
	for (var i=1; i<FOURIER_SIZE; i++) {
		real[i]=1.0;
		imag[i]=1.0;
	}

	wavetable = (audioContext.createPeriodicWave) ?
		audioContext.createPeriodicWave(real, imag) :
		audioContext.createWaveTable(real, imag);
	loadNoiseBuffer();

}

function setupVocoderGraph() {
	initBandpassFilters();
}

function drawVocoderGains() {
	vocoderCanvas.clearRect(0, 0, CANVAS_WIDTH, GAINS_CANVAS_HEIGHT);
  	vocoderCanvas.fillStyle = '#F6D565';
  	vocoderCanvas.lineCap = 'round';
	var binWidth = (CANVAS_WIDTH / numVocoderBands);
	var value;

	var sample = new Uint8Array(1); // should only need one sample

	// Draw rectangle for each vocoder bin.
	for (var i = 0; i < numVocoderBands; i++) {
    	vocoderCanvas.fillStyle = "hsl( " + Math.round((i*360)/numVocoderBands) + ", 100%, 50%)";
    	bandAnalysers[i].getByteTimeDomainData(sample);
    	value = ((1.0 * sample[0]) - 128.0) / 64;
    	vocoderCanvas.fillRect(i * binWidth, GAINS_CANVAS_HEIGHT, binWidth, -value * GAINS_CANVAS_HEIGHT );
	}
}

function drawFreqAnalysis( analyser, canvas ) {
	canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	var numBins = analyser.frequencyBinCount;
	numBins = numBins /4;  // this is JUST to drop the top half of the frequencies - they're not interesting.
	var binWidth = (CANVAS_WIDTH / numBins);
	var bins = new Uint8Array(numBins);
	var SCALAR = CANVAS_HEIGHT/256;
	analyser.getByteFrequencyData(bins);

	// Draw rectangle for each vocoder bin.
	for (var i = 0; i < numBins; i++) {
    	canvas.fillStyle = "hsl( " + Math.round((i*360)/numBins) + ", 100%, 50%)";
    	canvas.fillRect(i * binWidth, CANVAS_HEIGHT, binWidth, -bins[i]*SCALAR );
	}
}

var rafID = null;

function cancelVocoderUpdates() {
	window.cancelAnimationFrame( rafID );
	rafID = null;
}

function updateAnalysers(time) {
	if (cheapAnalysis) {
		drawFreqAnalysis( analyser1, analyserView1 );
		drawFreqAnalysis( analyser2, analyserView2 );
	} else {
		analyserView1.doFrequencyAnalysis( analyser1 );
		analyserView2.doFrequencyAnalysis( analyser2 );
	}
	drawVocoderGains();
	
  	rafID = window.requestAnimationFrame( updateAnalysers );
}

function createCarriersAndPlay( output ) {
	carrierSampleNode = audioContext.createBufferSource();
	carrierSampleNode.buffer = carrierBuffer;
	carrierSampleNode.loop = true;

	carrierSampleGain = audioContext.createGain();
	carrierSampleGain.gain.value = carrierSampleGainValue;
	carrierSampleNode.connect( carrierSampleGain );
	carrierSampleGain.connect( output );

	// The wavetable signal needs a boost.
	wavetableSignalGain = audioContext.createGain();

	oscillatorNode = audioContext.createOscillator();
	if (oscillatorType = 4)	{ // wavetable
		oscillatorNode.setPeriodicWave ? 
		oscillatorNode.setPeriodicWave(wavetable) :
		oscillatorNode.setWaveTable(wavetable);
		wavetableSignalGain.gain.value = WAVETABLEBOOST;
	} else {
		oscillatorNode.type = oscillatorType;
		wavetableSignalGain.gain.value = SAWTOOTHBOOST;
	}
	oscillatorNode.frequency.value = 110;
	oscillatorNode.detune.value = oscillatorDetuneValue;
	oscillatorNode.connect(wavetableSignalGain);

	oscillatorGain = audioContext.createGain();
	oscillatorGain.gain.value = oscillatorGainValue;

	wavetableSignalGain.connect(oscillatorGain);
	oscillatorGain.connect(output);
	
	noiseNode = audioContext.createBufferSource();
	noiseNode.buffer = noiseBuffer;
	noiseNode.loop = true;
	noiseGain = audioContext.createGain();
	noiseGain.gain.value = noiseGainValue;
	noiseNode.connect(noiseGain);

	noiseGain.connect(output);
	oscillatorNode.start(0);
	noiseNode.start(0);
	carrierSampleNode.start(0);

}

function vocode() {
	if (this.event) 
		this.event.preventDefault();

	if (vocoding) {
		if (modulatorNode)
			modulatorNode.stop(0);
		shutOffCarrier();
		vocoding = false;
		liveInput = false;
		cancelVocoderUpdates();
		if (endOfModulatorTimer)
			window.clearTimeout(endOfModulatorTimer);
		endOfModulatorTimer = 0;
		return;
	} else if (document.getElementById("carrierpreview").classList.contains("playing") )
		finishPreviewingCarrier();
	else if (document.getElementById("modulatorpreview").classList.contains("playing") )
		finishPreviewingModulator();

	createCarriersAndPlay( carrierInput );

	vocoding = true;

	modulatorNode = audioContext.createBufferSource();
	modulatorNode.buffer = modulatorBuffer;
	modulatorGain = audioContext.createGain();
	modulatorGain.gain.value = modulatorGainValue;
	modulatorNode.connect( modulatorGain );
	modulatorGain.connect( modulatorInput );
	modulatorNode.start(0);

 	window.requestAnimationFrame( updateAnalysers );
	endOfModulatorTimer = window.setTimeout( vocode, modulatorNode.buffer.duration * 1000 + 20 );
}

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        if (!navigator.getUserMedia)
        	navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function generateNoiseFloorCurve( floor ) {
    // "floor" is 0...1

    var curve = new Float32Array(65536);
    var mappedFloor = floor * 32768;

    for (var i=0; i<32768; i++) {
        var value = (i<mappedFloor) ? 0 : 1;

        curve[32768-i] = -value;
        curve[32768+i] = value;
    }
    curve[0] = curve[1]; // fixing up the end.

    return curve;
}

function createNoiseGate( connectTo ) {
    var inputNode = audioContext.createGain();
    var rectifier = audioContext.createWaveShaper();
    var ngFollower = audioContext.createBiquadFilter();
    ngFollower.type = ngFollower.LOWPASS;
    ngFollower.frequency.value = 10.0;

    var curve = new Float32Array(65536);
    for (var i=-32768; i<32768; i++)
        curve[i+32768] = ((i>0)?i:-i)/32768;
    rectifier.curve = curve;
    rectifier.connect(ngFollower);

    var ngGate = audioContext.createWaveShaper();
    ngGate.curve = generateNoiseFloorCurve(0.01);

    ngFollower.connect(ngGate);

    var gateGain = audioContext.createGain();
    gateGain.gain.value = 0.0;
    ngGate.connect( gateGain.gain );

    gateGain.connect( connectTo );

    inputNode.connect(rectifier);
    inputNode.connect(gateGain);
    return inputNode;
}

var lpInputFilter=null;

// this is ONLY because we have massive feedback without filtering out
// the top end in live speaker scenarios.
function createLPInputFilter(output) {
	lpInputFilter = audioContext.createBiquadFilter();
	lpInputFilter.connect(output);
	lpInputFilter.frequency.value = 2048;
	return lpInputFilter;
}

var liveInput = false;

function gotStream(stream) {
    // Create an AudioNode from the stream.
    var mediaStreamSource = audioContext.createMediaStreamSource(stream);    

	modulatorGain = audioContext.createGain();
	modulatorGain.gain.value = modulatorGainValue;
	modulatorGain.connect( modulatorInput );

	// make sure the source is mono - some sources will be left-side only
    var monoSource = convertToMono( mediaStreamSource );

    //create a noise gate
    monoSource.connect( createLPInputFilter( createNoiseGate( modulatorGain ) ) );

	createCarriersAndPlay( carrierInput );

	vocoding = true;
	liveInput = true;

 	window.requestAnimationFrame( updateAnalysers );
}

function useLiveInput() {
	if (vocoding) {
		if (modulatorNode)
			modulatorNode.stop(0);
		shutOffCarrier();
		vocoding = false;
		cancelVocoderUpdates();
		if (endOfModulatorTimer)
			window.clearTimeout(endOfModulatorTimer);
		endOfModulatorTimer = 0;
	} else if (document.getElementById("carrierpreview").classList.contains("playing") )
		finishPreviewingCarrier();
	else if (document.getElementById("modulatorpreview").classList.contains("playing") )
		finishPreviewingModulator();

    getUserMedia(        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream);	
}

window.addEventListener('keydown', function(ev) {
		var centOffset;
       switch (ev.keyCode) {
       	case 'A'.charCodeAt(0):
       		centOffset = -700;		break;
        case 'W'.charCodeAt(0):
        	centOffset = -600;		break;
       	case 'S'.charCodeAt(0):
       		centOffset = -500;		break;
        case 'E'.charCodeAt(0):
        	centOffset = -400;		break;
        case 'D'.charCodeAt(0):
        	centOffset = -300;		break;
        case 'R'.charCodeAt(0):
        	centOffset = -200;		break;
        case 'F'.charCodeAt(0):
        	centOffset = -100;		break;
        case 'G'.charCodeAt(0):
        	centOffset = 0;			break;
        case 'Y'.charCodeAt(0):
        	centOffset = 100;		break;
        case 'H'.charCodeAt(0):
        	centOffset = 200;		break;
        case 'U'.charCodeAt(0):
        	centOffset = 300;		break;
        case 'J'.charCodeAt(0):
        	centOffset = 400;		break;
        case 'K'.charCodeAt(0):
        	centOffset = 500;		break;
        case 'O'.charCodeAt(0):
        	centOffset = 600;		break;
        case 'L'.charCodeAt(0):
        	centOffset = 700;		break;
        case 'P'.charCodeAt(0):
        	centOffset = 800;		break;
        case 186: 	// ;
        	centOffset = 900;		break;
        case 219: 	// [
        	centOffset = 1000;		break;
        case 222: 	// '
        	centOffset = 1100;		break;
        default:
        	return;
      }
      var detunegroup = document.getElementById("detunegroup");
      $( detunegroup.children[1] ).slider( "value", centOffset );
      updateSlider( detunegroup, centOffset, " cents" );
      if (oscillatorNode)
        oscillatorNode.detune.value = centOffset;

    }, false);
