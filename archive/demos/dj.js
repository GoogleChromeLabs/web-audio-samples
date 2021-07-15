/* eslint require-jsdoc: "off" */
/* global Nexus */ // loaded from nexusui in main HTML page.

// init() once the page has finished loading.
window.onload = init;

let context;
let source1;
let source2;
let source1Gain;
let source2Gain;
let wetGainNode1;
let wetGainNode2;
let lowFilter1;
let lowFilter2;

const tempo = 120.0; // hardcoded for now
let anchorTime = 0;


async function fetchAndDecodeAudio(url) {
  const response = await fetch(url);
  const responseBuffer = await response.arrayBuffer();

  // TODO: Migrate to Promise-syntax once Safari supports it.
  return new Promise((resolve, reject) => {
    context.decodeAudioData(responseBuffer, resolve, reject);
  });
}

function handleCrossfade(x) {
  // equal-power cross-fade
  const gain1 = Math.cos(x * 0.5*Math.PI);
  const gain2 = Math.cos((1.0-x) * 0.5*Math.PI);

  source1Gain.gain.value = gain1;
  source2Gain.gain.value = gain2;
}

function handleFilterChange(value, filterNode, textElement) {
  const sampleRate = 44100.0; // !!@@ don't hardcode
  const nyquist = sampleRate * 0.5;
  const noctaves = Math.log(nyquist / 40.0) / Math.LN2;
  const v2 = Math.pow(2.0, noctaves * (value - 1.0));
  const cutoff = v2*nyquist;

  textElement.textContent = `${Math.round(cutoff)} Hz`;
  filterNode.frequency.value = cutoff;
}

function handleEffectChange(value, gainNode, textElement) {
  gainNode.gain.value = value;
  textElement.textContent = `${Math.round(value * 100)} %`;
}

window.loadBufferForSource = async (sourceName, url) => {
  const buffer = await fetchAndDecodeAudio(url);

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

  const newSource = context.createBufferSource();

  if (sourceName === 'source1') {
    // Stop the current loop (when it gets to the next 4-beat boundary).
    source1.stop(time);
    // This new source will replace the existing source.
    newSource.connect(source1Gain);
    source1 = newSource;
  } else {
    source2.stop(time);
    newSource.connect(source2Gain);
    source2 = newSource;
  }

  // Assign the buffer to the new source.
  newSource.buffer = buffer;

  // Start playing exactly on the next 4-beat boundary with looping.
  newSource.loop = true;
  newSource.start(time);
};

function draw() {
  const canvas = document.getElementById('loop');
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  const loopColor = 'rgb(200,150,150)';

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

  requestAnimationFrame(draw);
}

async function init() {
  // Initialize audio
  context = new AudioContext();

  // Create post-compressor gain node.
  const postCompressorGain = context.createGain();
  postCompressorGain.gain.value = 1.4;

  postCompressorGain.connect(context.destination);

  let compressor;

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
  const preCompressorGain = context.createGain();
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
  const convolver = context.createConvolver();

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

  // Load initial loop samples and reverb.
  [source1.buffer, source2.buffer, convolver.buffer] = await Promise.all([
    fetchAndDecodeAudio('sounds/drum-samples/loops/blueyellow.wav'),
    fetchAndDecodeAudio('sounds/drum-samples/loops/break29.wav'),
    fetchAndDecodeAudio('impulse-responses/filter-rhythm2.wav'),
  ]);

  const crossfader = new Nexus.Slider('#crossfader', {size: [400, 25]});
  crossfader.on('change', handleCrossfade);
  crossfader.value = 0.5;

  const filters = [
    ['#filter-left', '#filter-left-value', lowFilter1],
    ['#filter-right', '#filter-right-value', lowFilter2],
  ];
  for (const [controlSel, textSel, node] of filters) {
    const textElement = document.querySelector(textSel);
    const dial = new Nexus.Dial(controlSel);
    dial.on('change', (value) => {
      handleFilterChange(value, node, textElement);
    });
    dial.value = 0.99;
  }

  const effects = [
    ['#effect-left', '#effect-left-value', wetGainNode1],
    ['#effect-right', '#effect-right-value', wetGainNode2],
  ];
  for (const [controlSel, textSel, node] of effects) {
    const textElement = document.querySelector(textSel);
    const dial = new Nexus.Dial(controlSel);
    dial.on('change', (value) => {
      handleEffectChange(value, node, textElement);
    });
    dial.value = 0.0;
  }

  const now = context.currentTime;
  anchorTime = now + 0.040;

  source1.start(anchorTime);
  source2.start(anchorTime);

  draw();
}
