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

var audioContext = null;
var modulatorBuffer = null;
var carrierBuffer = null;
var modulatorNode = null;
var carrierNode = null;
var vocoding = false;
var cheapAnalysis = true;

// Debug visualizer stuff here
var analyser1;
var analyser2;
var analyserView1;
var analyserView2;

//constants for carrier buttons
var FILE = 0, SAWTOOTH=1, WAVETABLE=2, FILENAME=-1;

cheapAnalysis = (navigator.userAgent.indexOf("Android")!=-1)||(navigator.userAgent.indexOf("iPad")!=-1)||(navigator.userAgent.indexOf("iPhone")!=-1);;

if (!cheapAnalysis)
	o3djs.require('o3djs.shader');
else
	document.write("<style>#mobile {display:inline} #footer {display:none}</style>")


var carrierAnalyserNode = null;

function previewCarrier() {
	if (this.event) 
		this.event.preventDefault();

	var carrierPreviewImg = document.getElementById("carrierpreview");
	if (carrierPreviewImg.classList.contains("playing") ) {
		finishPreviewingCarrier();
		return;
	}

	if (vocoding)
		vocode();	// this will shut off the vocoder
	
	if (document.getElementById("modulatorpreview").classList.contains("playing") )
		finishPreviewingModulator();
	
	carrierPreviewImg.classList.add("playing");
	carrierPreviewImg.src = "img/ico-stop.png";

	carrierAnalyserNode = audioContext.createGain();
	carrierAnalyserNode.gain.value = 0.25;	// carrier is LOUD.
	carrierAnalyserNode.connect( audioContext.destination );
	carrierAnalyserNode.connect( analyser2 );

	createCarriersAndPlay( carrierAnalyserNode );

  	window.requestAnimationFrame( updateAnalysers );

}

function shutOffCarrier() {
	oscillatorNode.stop(0);
	oscillatorNode = null;
	noiseNode.stop(0);
	noiseNode = null;
	carrierSampleNode.stop(0);
	carrierSampleNode = null;
}

function finishPreviewingCarrier() {
	var carPreviewImg = document.getElementById("carrierpreview");
	carPreviewImg.classList.remove("playing");
	carPreviewImg.src = "img/ico-play.png";

	cancelVocoderUpdates();
	shutOffCarrier();
	carrierAnalyserNode.disconnect();
	carrierAnalyserNode = null;
}

var endOfModulatorTimer = 0;

function previewModulator() {
	if (this.event) 
		this.event.preventDefault();

	var modPreviewImg = document.getElementById("modulatorpreview");
	if (modPreviewImg.classList.contains("playing") ) {
		finishPreviewingModulator();
		return;
	}

	if (vocoding)
		vocode();	// this will shut off the vocoder

	if (document.getElementById("carrierpreview").classList.contains("playing") )
		finishPreviewingCarrier();

	modPreviewImg.classList.add("playing");
	modPreviewImg.src = "img/ico-stop.png";
	modulatorNode = audioContext.createBufferSource();
	modulatorNode.buffer = modulatorBuffer;
	
	vocoding = false;
	modulatorNode.connect( audioContext.destination );
	modulatorNode.connect( analyser1 );

	modulatorNode.start(0);

  	window.requestAnimationFrame( updateAnalysers );
	endOfModulatorTimer = window.setTimeout( finishPreviewingModulator, modulatorNode.buffer.duration * 1000 + 20 );
}

function finishPreviewingModulator() {
	var modPreviewImg = document.getElementById("modulatorpreview");
	if (endOfModulatorTimer)
		window.clearTimeout(endOfModulatorTimer);
	endOfModulatorTimer = 0;
	cancelVocoderUpdates();
	modulatorNode.stop(0);
	modulatorNode = null;
	modPreviewImg.classList.remove("playing");
	modPreviewImg.src = "img/ico-play.png";
}

function loadModulator( buffer ) {
	modulatorBuffer = buffer;
	var e = document.getElementById("modulator");
	e.classList.remove("notready");  
	e.classList.add("ready");
}

function loadCarrier( buffer ) {
	carrierBuffer = buffer;
	if (vocoding) {
		newCarrierNode = audioContext.createBufferSource();
		newCarrierNode.buffer = carrierBuffer;
		newCarrierNode.loop = true;
		newCarrierNode.connect( carrierInput );
		carrierNode.disconnect();
		newCarrierNode.start(0);
		carrierNode.stop(0);
		carrierNode = newCarrierNode;	
	}
	var e = document.getElementById("carrier");
	e.classList.remove("notready");  
	e.classList.add("ready");
}

function downloadAudioFromURL( url, cb ){
	var request = new XMLHttpRequest();
  	request.open('GET', url, true);
  	request.responseType = 'arraybuffer';

  	// Decode asynchronously
  	request.onload = function() {
    	audioContext.decodeAudioData( request.response, function(buffer) {
      		cb(buffer);
    	}, function(){alert("error loading!");});
  	}
  	request.send();
}

function selectSawtooth() {
	if ( wavetableSignalGain )
		wavetableSignalGain.gain.value = SAWTOOTHBOOST;
	if (oscillatorNode)
		oscillatorNode.type = "sawtooth";
	document.getElementById("sawtooth").classList.add("active");
	document.getElementById("wavetable").classList.remove("active");
}

function selectWavetable() {
	if ( wavetableSignalGain )
		wavetableSignalGain.gain.value = WAVETABLEBOOST;
	if (oscillatorNode)
		oscillatorNode.setPeriodicWave ? 
			oscillatorNode.setPeriodicWave(wavetable) :
			oscillatorNode.setWaveTable(wavetable);
	wavetableSignalGain.gain.value = WAVETABLEBOOST;

	document.getElementById("sawtooth").classList.remove("active");
	document.getElementById("wavetable").classList.add("active");
}

function setModulatorFileName( url ) {
	var lastSlash = url.lastIndexOf( "/" );
	if (lastSlash != -1)
		url = url.slice(lastSlash+1);

	var mod = document.getElementById("modulatorfilename");
	if (mod)
		mod.innerText = url;
}

function setCarrierFileName( url ) {
	var lastSlash = url.lastIndexOf( "/" );
	if (lastSlash != -1)
		url = url.slice(lastSlash+1);

	var carrier = document.getElementById("carrierfilename");
	if (carrier)
		carrier.innerText = url;
}

function startLoadingModulator( url ) {
	var e = document.getElementById("modulator");
	e.classList.remove("ready");  
	e.classList.add("notready");

	modulatorBuffer = null;
	setModulatorFileName( url );
	downloadAudioFromURL( url, loadModulator );
}

function startLoadingCarrier( url ) {
	var e = document.getElementById("carrier");
	e.classList.remove("ready");  
	e.classList.add("notready");

	carrierBuffer = null;
	setCarrierFileName( url )
	downloadAudioFromURL( url, loadCarrier );
}

// Set up the page as a drop site for audio files. When an audio file is
// dropped on the page, it will be auto-loaded as an AudioBufferSourceNode.
function initDragDropOfAudioFiles() {
	var mod = document.getElementById("modulator");
	
	mod.ondragover = function () { 
		this.classList.add("droptarget"); 
		return false; };
	mod.ondragleave = function () { this.classList.remove("droptarget"); return false; };
	mod.ondragend = function () { this.classList.remove("droptarget"); return false; };
	mod.ondrop = function (e) {
  		this.classList.remove("droptarget");
  		e.preventDefault();
		modulatorBuffer = null;
		setModulatorFileName( e.dataTransfer.files[0].name );

	  	var reader = new FileReader();
	  	reader.onload = function (event) {
	  		audioContext.decodeAudioData( event.target.result, function(buffer) {
	    		loadModulator( buffer );
	  		}, function(){alert("error loading!");} ); 

	  	};
	  	reader.onerror = function (event) {
	  		alert("Error: " + reader.error );
		};
	  	reader.readAsArrayBuffer(e.dataTransfer.files[0]);
	  	return false;
	};	
	var car = document.getElementById("carrier");
	
	car.ondragover = function () { this.classList.add("droptarget"); return false; };
	car.ondragleave = function () { this.classList.remove("droptarget"); return false; };
	car.ondragend = function () { this.classList.remove("droptarget"); return false; };
	car.ondrop = function (e) {
  		this.classList.remove("droptarget");
  		e.preventDefault();
		carrierBuffer = null;
		setCarrierFileName( e.dataTransfer.files[0].name );

	  	var reader = new FileReader();
	  	reader.onload = function (event) {
	  		audioContext.decodeAudioData( event.target.result, function(buffer) {
	    		loadCarrier( buffer );
	  		}, function(){alert("error loading!");} ); 

	  	};
	  	reader.onerror = function (event) {
	  		alert("Error: " + reader.error );
		};
	  	reader.readAsArrayBuffer(e.dataTransfer.files[0]);
	  	return false;
	};	
}

function updateSlider( element, value, units) {
	while (!element.classList.contains("module")) {
		if (element.classList.contains("control-group")) {
			//TODO: yes, this is lazy coding, and fragile.
			element.children[0].children[1].innerText = "" + value + units;
			return;
		}
		element = element.parentNode;
	}
}

function onUpdateModGain(event, ui) {
	updateSlider( event.target, ui.value, this.units );
	modulatorGainValue = ui.value;
	if (modulatorGain)
		modulatorGain.gain.value = ui.value;
}

// sample-based carrier
function onUpdateSampleLevel(event, ui) {
	updateSlider( event.target, ui.value, this.units );
	carrierSampleGainValue = ui.value;
	if (carrierSampleGain)
		carrierSampleGain.gain.value = ui.value;
}

// noise in carrier
function onUpdateSynthLevel(event, ui) {
	updateSlider( event.target, ui.value, this.units );
	oscillatorGainValue = ui.value;
	if (oscillatorGain)
		oscillatorGain.gain.value = ui.value;
}

// noise in carrier
function onUpdateNoiseLevel(event, ui) {
	updateSlider( event.target, ui.value, this.units );
	noiseGainValue = ui.value;
	if (noiseGain)
		noiseGain.gain.value = ui.value;
}

// detuning for wavetable and sawtooth oscillators
function onUpdateDetuneLevel(event, ui) {
	updateSlider( event.target, ui.value, this.units );
	oscillatorDetuneValue = ui.value;
	if (oscillatorNode)
		oscillatorNode.detune.value = ui.value;
}

function loadModulatorFile() {
	if (this.event) 
		this.event.preventDefault();

	alert("Try dropping a file onto the modulator.");
}

function loadCarrierFile() {
	if (this.event) 
		this.event.preventDefault();

	alert("Try dropping a file onto the carrier.");
}

// Initialization function for the page.
function init() {
	window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
	window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	window.applicationCache.addEventListener('updateready', function(e) {
	  	if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
	    	// Browser downloaded a new app cache.
		    // Swap it in and reload the page to get the new hotness.
		    window.applicationCache.swapCache();
	    	if (confirm('A new version of this site is available. Load it?')) {
	      		window.location.reload();
	    	}
	  	} else {
	    	// Manifest didn't changed. Nothing new to server.
	  	}
	}, false);

	document.getElementById("modpreview").addEventListener('click', previewModulator );
	document.getElementById("liveInput").addEventListener('click', useLiveInput );
	document.getElementById("loadcarrier").addEventListener('click', loadCarrierFile );
	document.getElementById("sawtooth").addEventListener('click', selectSawtooth );
	document.getElementById("wavetable").addEventListener('click', selectWavetable );
	document.getElementById("previewcarrier").addEventListener('click', previewCarrier );
	document.getElementById("play").addEventListener('click', vocode );

	document.getElementById("record").addEventListener('click', toggleRecording );

	try {
		audioContext = new AudioContext();
	}
	catch(e) {
		alert('The Web Audio API is apparently not supported in this browser.');
	}

	try {
		// start tracing
		TraceAudioContext.trackContext(audioContext)
	} catch(e) {
		console.error('Failed to trace the context')
	}

	initDragDropOfAudioFiles();	// set up panels as drop sites for audio files

	generateVocoderBands( 55, 7040, cheapAnalysis ? 14 : 28 );

// I used to have another debugging visualizer.
//	outputCanvas = document.getElementById("ocanvas").getContext('2d');

	vocoderCanvas = document.getElementById("vcanvas").getContext('2d');

	startLoadingModulator( "audio/gettysburg.ogg" );
	startLoadingCarrier( "audio/junky.ogg" );

	// Debug visualizer
    analyser1 = audioContext.createAnalyser();
    analyser1.fftSize = cheapAnalysis ? 256 : 1024;
    analyser1.smoothingTimeConstant = 0.5;
    analyser2 = audioContext.createAnalyser();
    analyser2.fftSize = cheapAnalysis ? 256 : 1024;
    analyser2.smoothingTimeConstant = 0.5;

    if (cheapAnalysis) {
    	analyserView1 = document.getElementById("view1").getContext('2d');
    	analyserView2 = document.getElementById("view2").getContext('2d');
    } else {
	    analyserView1 = new AnalyserView("view1");
	    analyserView1.initByteBuffer( analyser1 );
	    analyserView2 = new AnalyserView("view2");
	    analyserView2.initByteBuffer( analyser2 );
	}

    // Set up the vocoder chains
    setupVocoderGraph();


    // hook up the UI sliders
	var slider = document.createElement("div");
	slider.className="slider";
	document.getElementById("modgaingroup").appendChild(slider);
	$( slider ).slider( { slide: onUpdateModGain, value: (cheapAnalysis) ? 2.5 : 1.0, min: 0.0, max: 4.0, step: 0.1 } );
	slider.units = "";

	slider = document.createElement("div");
	slider.className="slider";
	document.getElementById("samplegroup").appendChild(slider);
	$( slider ).slider( { slide: onUpdateSampleLevel, value: 0.0, min: 0.0, max: 2.0, step: 0.01 } );
	slider.units = "";

	slider = document.createElement("div");
	slider.className="slider";
	document.getElementById("synthgroup").appendChild(slider);
	$( slider ).slider( { slide: onUpdateSynthLevel, value: 1.0, min: 0.0, max: 2.0, step: 0.01 } );
	slider.units = "";

	slider = document.createElement("div");
	slider.className="slider";
	document.getElementById("noisegroup").appendChild(slider);
	$( slider ).slider( { slide: onUpdateNoiseLevel, value: 0.22, min: 0.0, max: 2.0, step: 0.01 } );
	slider.units = "";

	slider = document.createElement("div");
	slider.className="slider";
	document.getElementById("detunegroup").appendChild(slider);
	$( slider ).slider( { slide: onUpdateDetuneLevel, value: 0, min: -1200, max: 1200, step: 1 } );
	slider.units = " cents";
}

/*  TODO: re-insert analytics.
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-35593052-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
*/

function keyevent( event ) {
	if (event)
		return;
}

var recording=false;
var recIndex=0;
var audioRecorder=null;

function toggleRecording() {
	if (recording) {
        // stop recording
        audioRecorder.stop();
        document.getElementById("record").classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );
	} else {
        // start recording
        if (!audioRecorder)
		    audioRecorder = new Recorder( analyser2 );

        document.getElementById("record").classList.add("recording");
        var link = $("recfile");
        link.href = "#";
		link.innerText = "";
        audioRecorder.clear();
        audioRecorder.record();
	}
	recording = !recording;
}

function gotBuffers( buffers ) {
    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    document.getElementById("recfile").innerText = "download";
    recIndex++;
}


window.onload=init;
window.onkeydown=keyevent();
