/* eslint require-jsdoc: "off" */
/* global Nexus */ // loaded from nexusui in main HTML page.

// init() once the page has finished loading.
window.onload = init;

const tempo = 120.0; // hardcoded for now
let anchorTime = 0;

const BASE_URL = '../../sounds/loops/';

const TRACKS = [
  'blueyellow',
  'break12',
  'break28',
  'break29',
  'coolloop7',
  'ominous',
  'organ-echo-chords',
];

const html = document.documentElement;

async function fetchAndDecodeAudio(context, url) {
  const response = await fetch(url);
  const responseBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(responseBuffer);
}

function handleCrossfade(decks, value) {
  const x = (value + 1) / 2;

  // equal-power cross-fade
  decks[0].sourceGain.gain.value = Math.cos(x * 0.5 * Math.PI);
  decks[1].sourceGain.gain.value = Math.cos((1.0 - x) * 0.5 * Math.PI);
}

function handleFilterChange(value, filterNode) {
  const nyquist = filterNode.context.sampleRate * 0.5;
  const noctaves = Math.log(nyquist / 40.0) / Math.LN2;
  const v2 = Math.pow(2.0, noctaves * (value - 1.0));
  const cutoff = v2*nyquist;

  filterNode.frequency.value = cutoff;
  return `${Math.round(cutoff)} Hz`;
}

function handleEffectChange(value, gainNode) {
  gainNode.gain.value = value;
  return `${Math.round(value * 100)} %`;
}

function getTrackURL(trackId) {
  return `${BASE_URL}${trackId}.wav`;
}

async function loadTrackIntoDeck(deck, deckEl, trackId) {
  const targetTrack = deckEl.querySelector('.track');
  targetTrack.dataset.track = trackId;
  deck.loadTrack(getTrackURL(trackId));
}

function draw(context, indicator, textEl) {
  // Calculate 4/4 beat position.
  const time = context.currentTime - anchorTime;
  const beat = (tempo / 60.0) * time;
  const roundedBeat = 4.0 * Math.floor(beat / 4.0);
  const wrappedBeat = beat - roundedBeat;
  indicator.value = wrappedBeat / 4;

  const fullBeat = 1 + Math.trunc(beat / 4);
  textEl.textContent = `${fullBeat}.${1 + Math.trunc(wrappedBeat)}`;

  requestAnimationFrame(() => {
    draw(context, indicator, textEl);
  });
}

class DeckPlayer {
  constructor(context) {
    this.context = context;
    this.source = new AudioBufferSourceNode(context);
    this.sourceGain = new GainNode(context);

    this.wetGain = new GainNode(context, {gain: 0});
    this.lowFilter = new BiquadFilterNode(context, {Q: 5.0}); // In decibels.

    this.source.connect(this.sourceGain);
    this.sourceGain.connect(this.lowFilter);
    this.lowFilter.connect(this.wetGain);

    this.playing = false;
  }

  connect(preCompressorGain, convolver) {
    this.lowFilter.connect(preCompressorGain);
    this.wetGain.connect(convolver);
  }

  async loadTrack(url) {
    const buffer = await fetchAndDecodeAudio(this.context, url);

    // Start playing the new buffer at exactly the next 4-beat boundary
    let currentTime = this.context.currentTime;

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
    if (this.playing) this.source.stop(time);

    this.source = new AudioBufferSourceNode(this.context, {buffer, loop: true});

    // This new source will replace the existing source.
    this.source.connect(this.sourceGain);

    if (this.playing) {
      this.source.start(time);
    }
  }

  start(time) {
    this.source.start(time);
    this.playing = true;
  }
}

function makeDraggable(el, ondrag) {
  el.addEventListener('dragstart', (event) => {
    ondrag(event);
    html.classList.add('dragging');
  });

  el.addEventListener('dragend', (event) => {
    html.classList.remove('dragging');
  });
}

function makeDroppable(el, ondrop) {
  el.ondragenter = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  el.ondragover = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  el.ondrop = (event) => {
    event.preventDefault();
    ondrop(event);
  };
}

function play(context, decks) {
  const now = context.currentTime;
  anchorTime = now + 0.040;

  decks[0].start(anchorTime);
  decks[1].start(anchorTime);
}

function makeDial(containerEl, onchange) {
  const controlEl = containerEl.querySelector('.control');
  const textEl = containerEl.querySelector('.value');
  const dial = new Nexus.Dial(controlEl, {mode: 'absolute'});
  dial.on('change', (value) => {
    textEl.innerText = onchange(value);
  });
  return dial;
}

async function init() {
  // Initialize audio
  const context = new AudioContext();

  // Create post-compressor gain node.
  const postCompressorGain = new GainNode(context, {gain: 1.4});
  postCompressorGain.connect(context.destination);

  // Create dynamics compressor to sweeten the overall mix.
  const compressor = new DynamicsCompressorNode(context);
  compressor.connect(postCompressorGain);

  // Create pre-compressor gain node.
  const preCompressorGain = new GainNode(context, {gain: 0.4});
  preCompressorGain.connect(compressor);

  // Create a convolver for a rhythm effect
  const convolver = new ConvolverNode(context);
  convolver.connect(preCompressorGain);

  const decks = [new DeckPlayer(context), new DeckPlayer(context)];

  for (const deck of decks) {
    deck.connect(preCompressorGain, convolver);
  }

  const timeIndicator = new Nexus.Dial('#time');
  timeIndicator.colorize('accent', '#555');
  const timeIndicatorText = document.querySelector('#time-value');

  const crossfader = new Nexus.Pan('#crossfader',
      {size: [400, 25], mode: 'absolute'});
  crossfader.on('change', (event) => handleCrossfade(decks, event.value));
  crossfader.value = 0;

  const deckContainers = document.querySelectorAll('.deck');
  deckContainers.forEach((deckContainer, i) => {
    const deck = decks[i];

    const filterDial = makeDial(deckContainer.querySelector('.filter'),
        (value) => handleFilterChange(value, deck.lowFilter));
    filterDial.value = 0.99;

    const effectDial = makeDial(deckContainer.querySelector('.effect'),
        (value) => handleEffectChange(value, deck.wetGain));
    effectDial.value = 0.0;

    const spectrogram = new Nexus.Spectrogram(
        deckContainer.querySelector('.viz-content'));
    spectrogram.connect(deck.lowFilter);

    makeDroppable(deckContainer.querySelector('.drop-target'), (event) => {
      loadTrackIntoDeck(
          deck, deckContainer, event.dataTransfer.getData('track'));
    });
  });

  const meter = new Nexus.Meter('#meter', {size: [75, 150]});
  meter.connect(postCompressorGain);

  const trackContainer = document.getElementById('tracks');
  const template = trackContainer.querySelector('template');
  for (const track of TRACKS) {
    const trackElement = template.content.firstElementChild.cloneNode(true);
    trackElement.dataset.track = track;
    makeDraggable(trackElement, (event) => {
      event.dataTransfer.setData('track', event.target.dataset.track);
    });
    trackContainer.appendChild(trackElement);
  }

  // Load initial loop samples and reverb.
  const loadEffect = async () => {
    convolver.buffer = await fetchAndDecodeAudio(context,
        '../../sounds/impulse-responses/filter-rhythm3.wav');
  };
  const loaded = Promise.all([
    loadEffect(),
    loadTrackIntoDeck(decks[0], deckContainers[0], 'blueyellow'),
    loadTrackIntoDeck(decks[1], deckContainers[1], 'break29'),
  ]);

  const playButton = new Nexus.Button('#play', {size: [75, 75]});
  playButton.on('change', async (event) => {
    if (event.state || html.classList.contains('playing')) {
      return;
    }
    html.classList.replace('paused', 'playing');
    // Wait for tracks to load in case user immediately clicks on play.
    await loaded;
    play(context, decks);
    draw(context, timeIndicator, timeIndicatorText);
  });

  await loaded;
}
