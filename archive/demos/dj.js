/* eslint require-jsdoc: "off" */
/* global addSlider configureSlider */ // loaded from lib/events.js.

// Temporary patch until all browsers support unprefixed context.
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// init() once the page has finished loading.
window.onload = init;

let context;
let source1 = 0;
let source2 = 0;
let source1Gain = 0;
let source2Gain = 0;
let convolver;
let compressor;
let wetGainNode1;
let wetGainNode2;
let lowFilter1;
let lowFilter2;
let preCompressorGain;
let postCompressorGain;

let bufferLoader1 = 0;
let bufferLoader2 = 0;
let loadCount = 0;
const tempo = 120.0; // hardcoded for now
let anchorTime = 0;

/**
 * Class BufferLoader
 */

const BufferLoader = function(source, url) {
  this.source_ = source;
  this.url_ = url;
  this.buffer_ = 0;
  this.request_ = 0;
};

BufferLoader.prototype.onFileLoaded = function(buffer) {
  this.buffer = buffer;
  this.source_.buffer = buffer;
  loadCount++;
  if (loadCount == 2) {
    finishLoad();
  }
};

BufferLoader.prototype.load = function() {
  // Load asynchronously
  const request = new XMLHttpRequest();
  request.open('GET', this.url_, true);
  request.responseType = 'arraybuffer';
  this.request_ = request;

  request.onload = function() {
    context.decodeAudioData(request.response, this.onFileLoaded.bind(this),
        function() {
          console.log('error decoding file.');
        });
  }.bind(this);

  request.send();
};


function crossfadeHandler(event, ui) {
  const x = ui.value;
  // equal-power cross-fade
  const gain1 = Math.cos(x * 0.5*Math.PI);
  const gain2 = Math.cos((1.0-x) * 0.5*Math.PI);

  source1Gain.gain.value = gain1;
  source2Gain.gain.value = gain2;

  const info = document.getElementById('crossfade-value');
  info.innerHTML = 'crossfade = ' + x;
}

function leftFilterHandler(event, ui) {
  const value = ui.value;
  const sampleRate = 44100.0; // !!@@ don't hardcode
  const nyquist = sampleRate * 0.5;
  const noctaves = Math.log(nyquist / 40.0) / Math.LN2;
  const v2 = Math.pow(2.0, noctaves * (value - 1.0));
  const cutoff = v2*nyquist;

  const info = document.getElementById('leftFilter-value');
  info.innerHTML = 'leftFilter = ' + cutoff + ' Hz';

  lowFilter1.frequency.value = cutoff;
}

function rightFilterHandler(event, ui) {
  const value = ui.value;
  const sampleRate = 44100.0; // !!@@ don't hardcode
  const nyquist = sampleRate * 0.5;
  const noctaves = Math.log(nyquist / 40.0) / Math.LN2;
  const v2 = Math.pow(2.0, noctaves * (value - 1.0));
  const cutoff = v2*nyquist;

  const info = document.getElementById('rightFilter-value');
  info.innerHTML = 'rightFilter = ' + cutoff + ' Hz';

  lowFilter2.frequency.value = cutoff;
}

function leftRhythmEffectHandler(event, ui) {
  const value = ui.value;

  const info = document.getElementById('leftRhythmEffect-value');
  info.innerHTML = 'leftRhythmEffect = ' + 100.0*value + '%';

  wetGainNode1.gain.value = value;
}

function rightRhythmEffectHandler(event, ui) {
  const value = ui.value;
  const info = document.getElementById('rightRhythmEffect-value');
  info.innerHTML = 'rightRhythmEffect = ' + 100.0*value + '%';

  wetGainNode2.gain.value = value;
}

function finishLoad() {
  // first, get rid of loading animation
  const loading = document.getElementById('loading');
  loading.innerHTML = '';

  addSlider('crossfade');
  addSlider('leftFilter');
  addSlider('rightFilter');
  addSlider('leftRhythmEffect');
  addSlider('rightRhythmEffect');
  configureSlider('crossfade', 0.5, 0.0, 1.0, crossfadeHandler);
  configureSlider('leftFilter', 0.99, 0.0, 1.0, leftFilterHandler);
  configureSlider('rightFilter', 0.99, 0.0, 1.0, rightFilterHandler);
  configureSlider('leftRhythmEffect', 0.0, 0.0, 1.0, leftRhythmEffectHandler);
  configureSlider('rightRhythmEffect', 0.0, 0.0, 1.0, rightRhythmEffectHandler);

  const now = context.currentTime;
  anchorTime = now + 0.040;

  source1.start(anchorTime);
  source2.start(anchorTime);

  draw();
}

function setReverbImpulseResponse(url) {
  // Load impulse response asynchronously

  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      convolver.buffer=buffer;
    }, function() {
      console.log('error decoding file.');
    });
  };

  request.send();
}

window.loadBufferForSource = function(source, url) {
  // Load asynchronously

  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      // Start playing the new buffer at exactly the next 4-beat boundary
      let currentTime = context.currentTime;

      // Add 120ms slop since we don't want to schedule too soon into the
      // future. This will potentially cause us to wait 4 more beats, if we're
      // almost exactly at the next 4-beat transition.
      currentTime += 0.120;

      const delta = currentTime - anchorTime;
      const deltaBeat = (tempo / 60.0) * delta;
      const roundedUpDeltaBeat = 4.0 + 4.0 * Math.floor(deltaBeat / 4.0);
      const roundedUpDeltaTime = (60.0 / tempo) * roundedUpDeltaBeat;
      const time = anchorTime + roundedUpDeltaTime;

      // Stop the current loop (when it gets to the next 4-beat boundary).
      this.stop(time);

      // Create a new source.
      const newSource = context.createBufferSource();
      if (this == source1) {
        newSource.connect(source1Gain);
      } else if (this == source2) {
        newSource.connect(source2Gain);
      }

      // Assign the buffer to the new source.
      newSource.buffer = buffer;

      // Start playing exactly on the next 4-beat boundary with looping.
      newSource.loop = true;
      newSource.start(time);

      // This new source will replace the existing source.
      if (this == source1) {
        source1 = newSource;
      } else if (this == source2) {
        source2 = newSource;
      }
    }.bind(this), function() {
      console.log('error decoding file.');
    } );
  }.bind(source);

  request.send();
};


if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
    return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback, element ) {
                  window.setTimeout( callback, 1000 / 60 );
                };
  } )();
}

function draw() {
  const canvas = document.getElementById('loop');
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  // Draw background.

  const loopColor = 'rgb(200,150,150)';


  // ctx.fillStyle = backgroundColor;
  ctx.clearRect(0, 0, width, height);

  // Draw body of knob.
  ctx.fillStyle = loopColor;
  const knobRadius = 0.95 * height / 2;

  // Calculate 4/4 beat position.
  const time = context.currentTime - anchorTime;
  const beat = (tempo / 60.0) * time;
  const roundedBeat = 4.0 * Math.floor(beat / 4.0);
  const wrappedBeat = beat - roundedBeat;
  const angle = (wrappedBeat/4) * Math.PI * 2;

  ctx.beginPath();
  ctx.moveTo(width / 2, height / 2);
  ctx.arc(width / 2, height / 2, knobRadius, 0, angle, false);
  ctx.fill();

  window.requestAnimationFrame(draw);
}

function init() {
  // Initialize audio
  context = new AudioContext();


  // Create post-compressor gain node.
  postCompressorGain = context.createGain();
  postCompressorGain.gain.value = 1.4;

  postCompressorGain.connect(context.destination);

  if (context.createDynamicsCompressor) {
    // Create dynamics compressor to sweeten the overall mix.
    compressor = context.createDynamicsCompressor();
    compressor.connect(postCompressorGain);
  } else {
    // Compressor is not available on this implementation - bypass and simply
    // point to destination.
    compressor = postCompressorGain;
  }

  // Create sources
  source1 = context.createBufferSource();
  source2 = context.createBufferSource();

  // Create gain nodes to control the volume for the two sources.
  source1Gain = context.createGain();
  source2Gain = context.createGain();

  // Create pre-compressor gain node.
  preCompressorGain = context.createGain();
  preCompressorGain.gain.value = 0.4;


  preCompressorGain.connect(compressor);

  // Create gain nodes to control the wet (effect) mix levels for left/right
  wetGainNode1 = context.createGain();
  wetGainNode2 = context.createGain();
  wetGainNode1.gain.value = 0.0;
  wetGainNode2.gain.value = 0.0;

  // Create a lowpass resonant filter for both left and right
  lowFilter1 = context.createBiquadFilter();
  lowFilter2 = context.createBiquadFilter();
  lowFilter1.frequency.value = 22050.0;
  lowFilter2.frequency.value = 22050.0;
  lowFilter1.Q.value = 5.0; // in decibels
  lowFilter2.Q.value = 5.0; // in decibels

  // Create a convolver for a rhythm effect
  convolver = context.createConvolver();

  // Connect sources to gain and filter nodes.
  source1.connect(source1Gain);
  source2.connect(source2Gain);
  source1Gain.connect(lowFilter1);
  source2Gain.connect(lowFilter2);

  // Connect dry mix
  lowFilter1.connect(preCompressorGain);
  lowFilter2.connect(preCompressorGain);

  // Connect wet (effect) mix
  lowFilter1.connect(wetGainNode1);
  wetGainNode1.connect(convolver);
  lowFilter2.connect(wetGainNode2);
  wetGainNode2.connect(convolver);
  convolver.connect(preCompressorGain);

  // Start out with cross-fader at center position (equal-power crossfader)
  source1Gain.gain.value = 0.707;
  source2Gain.gain.value = 0.707;

  source1.loop = true;
  source2.loop = true;

  // load reverb
  // setReverbImpulseResponse('impulse-responses/spatialized3.wav');
  setReverbImpulseResponse('impulse-responses/filter-rhythm2.wav');

  bufferLoader1 = new BufferLoader(source1,
      'sounds/drum-samples/loops/blueyellow.wav');
  bufferLoader2 = new BufferLoader(source2,
      'sounds/drum-samples/loops/break29.wav');

  bufferLoader1.load();
  bufferLoader2.load();
}
