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
let timeIndicator;
let timeIndicatorText;

const tempo = 120.0; // hardcoded for now
let anchorTime = 0;

const BASE_URL = 'sounds/drum-samples/loops/';

const TRACKS = [
  'blueyellow',
  'break12',
  'break28',
  'break29',
  'coolloop7',
  'ominous',
  'organ-echo-chords',
];

async function fetchAndDecodeAudio(url) {
  const response = await fetch(url);
  const responseBuffer = await response.arrayBuffer();

  // TODO: Migrate to Promise-syntax once Safari supports it.
  return new Promise((resolve, reject) => {
    context.decodeAudioData(responseBuffer, resolve, reject);
  });
}

function handleCrossfade(value) {
  const x = (value + 1) / 2;

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

const loadBufferForSource = async (sourceName, url) => {
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
  const playing = document.documentElement.classList.contains('playing');

  if (sourceName === 'source1') {
    // Stop the current loop (when it gets to the next 4-beat boundary).
    if (playing) source1.stop(time);
    // This new source will replace the existing source.
    newSource.connect(source1Gain);
    source1 = newSource;
  } else {
    if (playing) source2.stop(time);
    newSource.connect(source2Gain);
    source2 = newSource;
  }

  // Assign the buffer to the new source.
  newSource.buffer = buffer;

  // Start playing exactly on the next 4-beat boundary with looping.
  newSource.loop = true;
  if (playing) newSource.start(time);
};

function getTrackURL(trackId) {
  return `${BASE_URL}${trackId}.wav`;
}

async function loadTrackIntoDeck(deckEl, trackId) {
  const sourceName = deckEl.dataset.deck;
  const targetTrack = deckEl.querySelector('.track');
  targetTrack.dataset.track = trackId;
  await loadBufferForSource(sourceName, getTrackURL(trackId));
}

function draw() {
  // Calculate 4/4 beat position.
  const time = context.currentTime - anchorTime;
  const beat = (tempo / 60.0) * time;
  const roundedBeat = 4.0 * Math.floor(beat / 4.0);
  const wrappedBeat = beat - roundedBeat;
  timeIndicator.value = wrappedBeat / 4;

  const fullBeat = 1 + Math.trunc(beat / 4);
  timeIndicatorText.textContent = `${fullBeat}.${1 + Math.trunc(wrappedBeat)}`;

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

  timeIndicator = new Nexus.Dial('#time');
  timeIndicator.colorize('accent', '#555');
  timeIndicatorText = document.querySelector('#time-value');

  const crossfader = new Nexus.Pan('#crossfader',
      {size: [400, 25], mode: 'absolute'});
  crossfader.on('change', (event) => handleCrossfade(event.value));
  crossfader.value = 0;

  const filters = [
    ['#filter-left', '#filter-left-value', lowFilter1],
    ['#filter-right', '#filter-right-value', lowFilter2],
  ];
  for (const [controlSel, textSel, node] of filters) {
    const textElement = document.querySelector(textSel);
    const dial = new Nexus.Dial(controlSel, {mode: 'absolute'});
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
    const dial = new Nexus.Dial(controlSel, {mode: 'absolute'});
    dial.on('change', (value) => {
      handleEffectChange(value, node, textElement);
    });
    dial.value = 0.0;
  }

  const spectrograms = [
    ['#viz-left', lowFilter1],
    ['#viz-right', lowFilter2],
  ];

  for (const [controlSel, node] of spectrograms) {
    const spectrogram = new Nexus.Spectrogram(controlSel);
    spectrogram.connect(node);
  }

  const meter = new Nexus.Meter('#meter', {size: [75, 150]});
  meter.connect(postCompressorGain);

  const trackContainer = document.getElementById('tracks');

  const template = document.getElementById('track-template');
  for (const track of TRACKS) {
    const trackElement = template.content.firstElementChild.cloneNode(true);
    trackElement.dataset.track = track;

    trackElement.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('track', event.target.dataset.track);
      document.documentElement.classList.add('dragging');
    });

    trackElement.addEventListener('dragend', (event) => {
      document.documentElement.classList.remove('dragging');
    });

    trackContainer.appendChild(trackElement);
  }

  for (const deck of document.querySelectorAll('.deck .viz')) {
    deck.ondragenter = (event) => {
      event.dataTransfer.dropEffect = 'copy';
      event.preventDefault();
    };

    deck.ondragover = (event) => {
      event.dataTransfer.dropEffect = 'copy';
      event.preventDefault();
    };

    deck.ondrop = (event) => {
      event.preventDefault();
      loadTrackIntoDeck(
          deck.closest('[data-deck]'), event.dataTransfer.getData('track'));
    };
  }

  // Load initial loop samples and reverb.
  [convolver.buffer] = await Promise.all([
    fetchAndDecodeAudio('impulse-responses/filter-rhythm2.wav'),
    loadTrackIntoDeck(
        document.querySelector('[data-deck="source1"]'), 'blueyellow'),
    loadTrackIntoDeck(
        document.querySelector('[data-deck="source2"]'), 'break29'),
  ]);

  const playButton = new Nexus.Button('#play', {size: [75, 75]});
  playButton.on('change', (event) => {
    const html = document.documentElement;
    if (event.state || html.classList.contains('playing')) {
      return;
    }
    html.classList.replace('paused', 'playing');
    const now = context.currentTime;
    anchorTime = now + 0.040;

    source1.start(anchorTime);
    source2.start(anchorTime);
    draw();
  });
}
