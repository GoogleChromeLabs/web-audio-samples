import { RESET_BEAT, DEMO_BEATS, INSTRUMENTS, KIT_DATA, IMPULSE_RESPONSE_DATA, freeze, clone } from "./shiny-drum-machine-data.js";

// Events
// init() once the page has finished loading.

// Temporary patch until all browsers support unprefixed context.
window.AudioContext = window.AudioContext || window.webkitAudioContext;

window.onload = init;

let context;
let convolver;
let compressor;
let masterGainNode;
let effectLevelNode;

// Each effect impulse response has a specific overall desired dry and wet volume.
// For example in the telephone filter, it's necessary to make the dry volume 0 to correctly hear the effect.
let effectDryMix = 1.0;
let effectWetMix = 1.0;

let timeoutId;
let startTime;
let lastDrawTime = -1;
let rhythmIndex = 0;
let noteTime = 0.0;

const MAX_SWING = 0.08;
const LOOP_LENGTH = 16;
const MIN_TEMPO = 50;
const MAX_TEMPO = 180;
const VOLUMES = freeze([0, 0.3, 1]);

// theBeat is the object representing the current beat/groove
// ... it is saved/loaded via JSON
let theBeat = clone(RESET_BEAT);
let KITS;
let impulseResponses;

const pitchSliders = {};
let effectSlider;
let swingSlider;
const noteButtons = {};
let playButton;
const demoButtons = [];

class Kit {
    constructor(id, prettyName) {
        this.id = id;
        this.prettyName = prettyName;
        this.buffer = {};
    }

    getSampleUrl(instrument) {
        return `sounds/drum-samples/${this.id}/${instrument.toLowerCase()}.wav`;
    }

    load() {
        const instrumentPromises = INSTRUMENTS.map(instrument => this.loadSample(instrument));
        const promise = Promise.all(instrumentPromises).then(() => null);
        // Return original Promise on subsequent load calls to avoid duplicate loads.
        this.load = () => promise;
        return promise;
    }

    async loadSample(instrument) {
        const request = new Request(this.getSampleUrl(instrument));
        const response = await fetch(request);
        const responseBuffer = await response.arrayBuffer();

        // TODO: Migrate to Promise-syntax once Safari supports it.
        return new Promise((resolve) => {
            context.decodeAudioData(responseBuffer, (buffer) => {
                this.buffer[instrument] = buffer;
                resolve();
            });
        });
    }
}


class ImpulseResponse {
    constructor(url, index) {
        this.url = url;
        this.index = index;
        this.buffer = undefined;
    }

    async load() {
        if(!this.url) {
            return; // "No effect" instance has empty URL.
        }

        const request = new Request(this.url);
        const response = await fetch(request);
        const responseBuffer = await response.arrayBuffer();

        // TODO: Migrate to Promise-syntax once Safari supports it.
        const result = new Promise((resolve) => {
            context.decodeAudioData(responseBuffer, (buffer) => {
                this.buffer = buffer;
                resolve();
            });
        });

        // Return original Promise on subsequent load calls to avoid duplicate loads.
        this.load = () => result;
        return result;
    }
}

function startLoadingAssets() {   
    // Start loading the assets used by the presets first, in order of the presets.
    for (let demoIndex = 0; demoIndex < 5; demoIndex++) {
        const demo = DEMO_BEATS[demoIndex];
        const effect = impulseResponses[demo.effectIndex];
        const kit = KITS[demo.kitIndex];
        
        Promise.all([
            effect.load(),
            kit.load(),
        ]).then(() => showDemoAvailable(demoIndex));
    }
    
    // Then load the remaining assets.
    // Note that any assets which have previously started loading will be skipped over.
    for(const kit of KITS) {
        kit.load();
    }  

    // Start at 1 to skip "No Effect"
    for (let i = 1; i < IMPULSE_RESPONSE_DATA.length; i++) {
        impulseResponses[i].load();
    }
}

function getCurrentKit() {
    return KITS[theBeat.kitIndex];
}

// This gets rid of the loading spinner in each of the demo buttons.
function showDemoAvailable(demoIndex) {
    demoButtons[demoIndex].state = "loaded";
    
    // Enable play button and assign it to demo 2.
    if (demoIndex == 1) {
        showPlayAvailable();
        loadBeat(DEMO_BEATS[1]);
    }
}

// This gets rid of the loading spinner on the play button.
function showPlayAvailable() {
    playButton.state = "stopped";
}

function init() {    
    impulseResponses = IMPULSE_RESPONSE_DATA.map((data, i) => new ImpulseResponse(data.url, i));
    KITS = KIT_DATA.map(({id, name}) => new Kit(id, name));
    
    initControls();

    startLoadingAssets();

    context = new AudioContext();

    var finalMixNode;
    if (context.createDynamicsCompressor) {
        // Create a dynamics compressor to sweeten the overall mix.
        compressor = context.createDynamicsCompressor();
        compressor.connect(context.destination);
        finalMixNode = compressor;
    } else {
        // No compressor available in this implementation.
        finalMixNode = context.destination;
    }

    // Create master volume.
    masterGainNode = context.createGain();
    masterGainNode.gain.value = 0.7; // reduce overall volume to avoid clipping
    masterGainNode.connect(finalMixNode);

    // Create effect volume.
    effectLevelNode = context.createGain();
    effectLevelNode.gain.value = 1.0; // effect level slider controls this
    effectLevelNode.connect(masterGainNode);

    // Create convolver for effect
    convolver = context.createConvolver();
    convolver.connect(effectLevelNode);


    var elKitCombo = document.getElementById('kitlist');
    elKitCombo.addEventListener("change", handleKitChange, true);

    var elEffectCombo = document.getElementById('effectlist');
    elEffectCombo.addEventListener("change", handleEffectChange, true);

    
    updateControls();
}

class Slider {
    constructor(element, opts = {}) {
        this.element = element;
        this.onchange = () => {};

        element.addEventListener('input', () => {
            this.onchange(this.value);
        });

        if(opts && opts.doubleClickValue) {
            element.addEventListener('dblclick', () => {
                this.value = opts.doubleClickValue;
                this.onchange(this.value);
            });
        }
    }

    get value() {
        return new Number(this.element.value) / 100;
    }

    set value(value) {
        this.element.value = value * 100;
    }
}

class Button {
    constructor(element) {
        this.element = element;
        this.onclick = () => {};

        element.addEventListener('click', (event) => this.onclick(event));
    }

    get state() {
        return this.element.dataset.state;
    }

    set state(value) {
        this.element.dataset.state = value;
    }
}

function initControls() {
    // Initialize note buttons
    initButtons();
    makeKitList();
    makeEffectList();

    // sliders
    effectSlider = new Slider(document.getElementById('effect_thumb'));
    effectSlider.onchange = (value) => {
        // Change the volume of the convolution effect.
        theBeat.effectMix = value;
        setEffectLevel(theBeat);            
    };

    swingSlider = new Slider(document.getElementById('swing_thumb'));
    swingSlider.onchange = (value) => {
        theBeat.swingFactor = value;        
    };

    for(const el of document.querySelectorAll('[data-instrument][data-pitch]')) {
        pitchSliders[el.dataset.instrument] = new Slider(el, {doubleClickValue: 0.5});
        pitchSliders[el.dataset.instrument].onchange = (value) => {
            setPitch(el.dataset.instrument, value);
        };
    }

    // tool buttons
    playButton = new Button(document.getElementById('play'));
    playButton.onclick = () => {
        if(playButton.state === "playing") {
            handleStop();
        } else if(playButton.state === "stopped") {
            handlePlay();
        }
    };

    document.getElementById('save').addEventListener('click', handleSave, true);
    document.getElementById('save_ok').addEventListener('click', handleSaveOk, true);
    document.getElementById('load').addEventListener('click', handleLoad, true);
    document.getElementById('load_ok').addEventListener('click', handleLoadOk, true);
    document.getElementById('load_cancel').addEventListener('click', handleLoadCancel, true);
    document.getElementById('reset').addEventListener('click', handleReset, true);

    for (let i = 0; i < DEMO_BEATS.length; i++) {
        const button = new Button(document.querySelector(`[data-demo="${i}"]`));
        button.onclick = handleDemoMouseDown;
        demoButtons.push(button);
    }

    document.getElementById('tempoinc').addEventListener('click', tempoIncrease, true);
    document.getElementById('tempodec').addEventListener('click', tempoDecrease, true);
}

function initButtons() {        
    for(const instrument of INSTRUMENTS) {
        noteButtons[instrument] = [];

        for (let rhythm = 0; rhythm < LOOP_LENGTH; rhythm++) {
            const el = document.querySelector(`[data-instrument="${instrument}"][data-rhythm="${rhythm}"]`);
            noteButtons[instrument][rhythm] = new Button(el);
            noteButtons[instrument][rhythm].onclick = handleButtonMouseDown;

        }
    }
}

function makeEffectList() {
    var elList = document.getElementById('effectlist');
    var numEffects = IMPULSE_RESPONSE_DATA.length;
    
    for (var i = 0; i < numEffects; i++) {
        elList.add(new Option(IMPULSE_RESPONSE_DATA[i].name));
    }
}

function makeKitList() {
    var elList = document.getElementById('kitlist');
    
    for(const kit of KITS) {
        elList.add(new Option(kit.prettyName, kit.id));
    }
}

function advanceNote() {
    // Advance time by a 16th note...
    var secondsPerBeat = 60.0 / theBeat.tempo;

    rhythmIndex++;
    if (rhythmIndex == LOOP_LENGTH) {
        rhythmIndex = 0;
    }

        // apply swing    
    if (rhythmIndex % 2) {
        noteTime += (0.25 + MAX_SWING * theBeat.swingFactor) * secondsPerBeat;
    } else {
        noteTime += (0.25 - MAX_SWING * theBeat.swingFactor) * secondsPerBeat;
    }
}

function playNote(buffer, pan, x, y, z, sendGain, mainGain, playbackRate, noteTime) {
    // Create the note
    var voice = context.createBufferSource();
    voice.buffer = buffer;
    voice.playbackRate.value = playbackRate;

    // Optionally, connect to a panner
    var finalNode;
    if (pan) {
        var panner = context.createPanner();
        panner.setPosition(x, y, z);
        voice.connect(panner);
        finalNode = panner;
    } else {
        finalNode = voice;
    }

    // Connect to dry mix
    var dryGainNode = context.createGain();
    dryGainNode.gain.value = mainGain * effectDryMix;
    finalNode.connect(dryGainNode);
    dryGainNode.connect(masterGainNode);

    // Connect to wet mix
    var wetGainNode = context.createGain();
    wetGainNode.gain.value = sendGain;
    finalNode.connect(wetGainNode);
    wetGainNode.connect(convolver);

    voice.start(noteTime);
}

function schedule() {
    var currentTime = context.currentTime;

    // The sequence starts at startTime, so normalize currentTime so that it's 0 at the start of the sequence.
    currentTime -= startTime;

    while (noteTime < currentTime + 0.200) {
        // Convert noteTime to context time.
        var contextPlayTime = noteTime + startTime;
        
        // Kick
        if (theBeat.rhythm1[rhythmIndex]) {
            let instrument = 'Kick';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 0.5, VOLUMES[theBeat.rhythm1[rhythmIndex]] * 1.0, computePlaybackRate(instrument), contextPlayTime);
        }

        // Snare
        if (theBeat.rhythm2[rhythmIndex]) {
            let instrument = 'Snare';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, VOLUMES[theBeat.rhythm2[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        // Hihat
        if (theBeat.rhythm3[rhythmIndex]) {
            // Pan the hihat according to sequence position.
            let instrument = 'HiHat';
            playNote(getCurrentKit().buffer[instrument], true, 0.5*rhythmIndex - 4, 0, -1.0, 1, VOLUMES[theBeat.rhythm3[rhythmIndex]] * 0.7, computePlaybackRate(instrument), contextPlayTime);
        }

        // Toms    
        if (theBeat.rhythm4[rhythmIndex]) {
            let instrument = 'Tom1';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, VOLUMES[theBeat.rhythm4[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        if (theBeat.rhythm5[rhythmIndex]) {
            let instrument = 'Tom2';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, VOLUMES[theBeat.rhythm5[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        if (theBeat.rhythm6[rhythmIndex]) {
            let instrument = 'Tom3';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, VOLUMES[theBeat.rhythm6[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        
        // Attempt to synchronize drawing time with sound
        if (noteTime != lastDrawTime) {
            lastDrawTime = noteTime;
            drawPlayhead((rhythmIndex + 15) % 16);
        }

        advanceNote();
    }

    timeoutId = setTimeout(schedule, 0);
}

function tempoIncrease() {
    theBeat.tempo = Math.min(MAX_TEMPO, theBeat.tempo+4);
    document.getElementById('tempo').innerHTML = theBeat.tempo;
}

function tempoDecrease() {
    theBeat.tempo = Math.max(MIN_TEMPO, theBeat.tempo-4);
    document.getElementById('tempo').innerHTML = theBeat.tempo;
}

function setPitch(instrument, value) {
    theBeat[`${instrument.toLowerCase()}PitchVal`] = value;
}

function computePlaybackRate(instrument) {
    const pitch = theBeat[`${instrument.toLowerCase()}PitchVal`];
    return Math.pow(2.0, 2.0 * (pitch - 0.5));
}

function handleButtonMouseDown(event) {
    const rhythmIndex = new Number(event.target.dataset.rhythm);
    const instrument = event.target.dataset.instrument;
    const instrumentIndex = INSTRUMENTS.indexOf(instrument);
    const notes = theBeat[`rhythm${instrumentIndex + 1}`];    
    const note = (notes[rhythmIndex] + 1) % 3
    notes[rhythmIndex] = note;

    drawNote(notes[rhythmIndex], rhythmIndex, instrument);
    
    if (note) {
        switch(instrumentIndex) {
        case 0:  // Kick
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 0.5 * theBeat.effectMix, VOLUMES[note] * 1.0, computePlaybackRate(instrument), 0);
          break;

        case 1:  // Snare
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, VOLUMES[note] * 0.6, computePlaybackRate(instrument), 0);
          break;

        case 2:  // Hihat
          // Pan the hihat according to sequence position.
          playNote(getCurrentKit().buffer[instrument], true, 0.5*rhythmIndex - 4, 0, -1.0, theBeat.effectMix, VOLUMES[note] * 0.7, computePlaybackRate(instrument), 0);
          break;

        case 3:  // Tom 1   
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, VOLUMES[note] * 0.6, computePlaybackRate(instrument), 0);
          break;

        case 4:  // Tom 2   
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, VOLUMES[note] * 0.6, computePlaybackRate(instrument), 0);
          break;

        case 5:  // Tom 3   
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, VOLUMES[note] * 0.6, computePlaybackRate(instrument), 0);
          break;
        }
    }
}

function handleKitChange(event) {
    theBeat.kitIndex = event.target.selectedIndex;
}

function handleEffectChange(event) {
    // Hack - if effect is turned all the way down - turn up effect slider.
    // ... since they just explicitly chose an effect from the list.
    if (theBeat.effectMix == 0)
        theBeat.effectMix = 0.5;

    setEffect(event.target.selectedIndex);
}

async function setEffect(index) {
    await impulseResponses[index].load();

    theBeat.effectIndex = index;
    effectDryMix = IMPULSE_RESPONSE_DATA[index].dryMix;
    effectWetMix = IMPULSE_RESPONSE_DATA[index].wetMix;            
    convolver.buffer = impulseResponses[index].buffer;

  // Hack - if the effect is meant to be entirely wet (not unprocessed signal)
  // then put the effect level all the way up.
    if (effectDryMix == 0)
        theBeat.effectMix = 1;

    setEffectLevel(theBeat);
    updateControls();

    document.getElementById('effectlist').selectedIndex = index;
}

function setEffectLevel() {        
    // Factor in both the preset's effect level and the blending level (effectWetMix) stored in the effect itself.
    effectLevelNode.gain.value = theBeat.effectMix * effectWetMix;
}


function handleDemoMouseDown(event) {
    const i = new Number(event.target.dataset.demo);
    loadBeat(DEMO_BEATS[i]);
    handlePlay();
}

function handlePlay() {
    noteTime = 0.0;
    startTime = context.currentTime + 0.005;
    schedule();

    playButton.state = "playing";
}

function handleStop(event) {
    clearTimeout(timeoutId);

    var elOld = document.getElementById('LED_' + (rhythmIndex + 14) % 16);
    elOld.src = 'images/LED_off.png';

    rhythmIndex = 0;

    playButton.state = "stopped";
}

function handleSave(event) {
    toggleSaveContainer();
    var elTextarea = document.getElementById('save_textarea');
    elTextarea.value = JSON.stringify(theBeat);
}

function handleSaveOk(event) {
    toggleSaveContainer();
}

function handleLoad(event) {
    toggleLoadContainer();
}

function handleLoadOk(event) {
    var elTextarea = document.getElementById('load_textarea');
    theBeat = JSON.parse(elTextarea.value);

    // Set effect
    setEffect(theBeat.effectIndex);

    // Change the volume of the convolution effect.
    setEffectLevel(theBeat);

    // Clear out the text area post-processing
    elTextarea.value = '';

    toggleLoadContainer();
    updateControls();
}

function handleLoadCancel(event) {
    toggleLoadContainer();
}

function toggleSaveContainer() {
    document.getElementById('pad').classList.toggle('active');
    document.getElementById('params').classList.toggle('active');
    document.getElementById('tools').classList.toggle('active');
    document.getElementById('save_container').classList.toggle('active');
}

function toggleLoadContainer() {
    document.getElementById('pad').classList.toggle('active');
    document.getElementById('params').classList.toggle('active');
    document.getElementById('tools').classList.toggle('active');
    document.getElementById('load_container').classList.toggle('active');
}

function handleReset() {
    loadBeat(RESET_BEAT);    
}

function loadBeat(beat) {
    handleStop();

    theBeat = clone(beat);
    setEffect(theBeat.effectIndex);

    updateControls();

    return true;
}

function updateControls() {
    let notes;

    for (let i = 0; i < LOOP_LENGTH; ++i) {
        for (let j = 0; j < INSTRUMENTS.length; j++) {
            switch (j) {
                case 0: notes = theBeat.rhythm1; break;
                case 1: notes = theBeat.rhythm2; break;
                case 2: notes = theBeat.rhythm3; break;
                case 3: notes = theBeat.rhythm4; break;
                case 4: notes = theBeat.rhythm5; break;
                case 5: notes = theBeat.rhythm6; break;
            }

            drawNote(notes[i], i, INSTRUMENTS[j]);
        }
    }

    document.getElementById('kitlist').selectedIndex = theBeat.kitIndex;
    document.getElementById('effectlist').selectedIndex = theBeat.effectIndex;
    document.getElementById('tempo').innerHTML = theBeat.tempo;
    effectSlider.value = theBeat.effectMix;
    swingSlider.value = theBeat.swingFactor;

    pitchSliders['Kick'].value = theBeat.kickPitchVal;
    pitchSliders['Snare'].value = theBeat.snarePitchVal;
    pitchSliders['HiHat'].value = theBeat.hihatPitchVal;
    pitchSliders['Tom1'].value = theBeat.tom1PitchVal;       
    pitchSliders['Tom2'].value = theBeat.tom2PitchVal;
    pitchSliders['Tom3'].value = theBeat.tom3PitchVal;
}


function drawNote(note, rhythmIndex, instrument) {
    noteButtons[instrument][rhythmIndex].state = note;
}

function drawPlayhead(xindex) {
    var lastIndex = (xindex + 15) % 16;

    var elNew = document.getElementById('LED_' + xindex);
    var elOld = document.getElementById('LED_' + lastIndex);
    
    elNew.src = 'images/LED_on.png';
    elOld.src = 'images/LED_off.png';
}
