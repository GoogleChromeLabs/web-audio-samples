import { RESET_BEAT, DEMO_BEATS, INSTRUMENTS, KIT_DATA, IMPULSE_RESPONSE_DATA, freeze, clone } from "./shiny-drum-machine-data.js";
import {DemoButtons, EffectPicker, KitPicker, EffectSlider, SwingSlider, PitchSliders, TempoInput, Playheads, Notes, SaveModal, LoadModal, ResetButton, PlayButton} from './shiny-drum-machine-ui.js';


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

const ui = Object.seal({
    effectPicker: null,
    kitPicker: null,
    demoButtons: null,
    swingSlider: null,
    effectSlider: null,
    pitchSliders: null,
    tempoInput: null,
    notes: null,
    playButton: null,
    resetButton: null,
    playheads: null,
    modal: {
        save: null,
        load: null,
    },
});

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
    constructor(data, index) {
        this.name = data.name;
        this.url = data.url;
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

function loadDemos(onDemoLoaded) {
    for (let demoIndex = 0; demoIndex < 5; demoIndex++) {
        const demo = DEMO_BEATS[demoIndex];
        const effect = impulseResponses[demo.effectIndex];
        const kit = KITS[demo.kitIndex];
        
        Promise.all([
            effect.load(),
            kit.load(),
        ]).then(() => onDemoLoaded(demoIndex));
    }
}

function loadAssets() {       
    // Note that any assets which have previously started loading will be skipped over.
    for(const kit of KITS) {
        kit.load();
    }  

    for (const impulseResponse of impulseResponses) {
        impulseResponse.load();
    }
}

function getCurrentKit() {
    return KITS[theBeat.kitIndex];
}

// This gets rid of the loading spinner in each of the demo buttons.
function onDemoLoaded(demoIndex) {
    ui.demoButtons.markDemoAvailable(demoIndex)
    
    // Enable play button and assign it to demo 2.
    if (demoIndex == 1) {
        // This gets rid of the loading spinner on the play button.
        ui.playButton.state = "stopped";
        loadBeat(DEMO_BEATS[1]);
    }
}

function init() {    
    impulseResponses = IMPULSE_RESPONSE_DATA.map((data, i) => new ImpulseResponse(data, i));
    KITS = KIT_DATA.map(({id, name}) => new Kit(id, name));
    
    initControls();

    // Start loading the assets used by the presets first, in order of the presets.
    // The callback gets rid of the loading spinner in each of the demo buttons.
    loadDemos(onDemoLoaded);
    
    // Then load the remaining assets.
    loadAssets();

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
    
    updateControls();
}

function initControls() {
    // Initialize note buttons
    ui.notes = new Notes();
    ui.notes.onClick = (instrument, rhythm) => handleNoteClick(instrument, rhythm);

    ui.kitPicker = new KitPicker();
    ui.kitPicker.addOptions(KITS.map(kit => kit.prettyName));
    ui.kitPicker.onSelect = (i) => handleKitChange(i);

    ui.effectPicker = new EffectPicker();
    ui.effectPicker.addOptions(impulseResponses.map(e => e.name));
    ui.effectPicker.onSelect = (i) => handleEffectChange(i);

    ui.effectSlider = new EffectSlider();
    ui.effectSlider.onchange = (value) => {
        // Change the volume of the convolution effect.
        theBeat.effectMix = value;
        setEffectLevel(theBeat);            
    };

    ui.swingSlider = new SwingSlider();
    ui.swingSlider.onchange = (value) => {
        theBeat.swingFactor = value;        
    };

    ui.pitchSliders = new PitchSliders();
    ui.pitchSliders.onPitchChange = (instrument, pitch) => {
        theBeat[`${instrument.toLowerCase()}PitchVal`] = pitch;
    };

    // tool buttons
    ui.playButton = new PlayButton();
    ui.playButton.onclick = () => {
        if(ui.playButton.state === "playing") {
            handleStop();
        } else if(ui.playButton.state === "stopped") {
            handlePlay();
        }
    };

    ui.modal.save = new SaveModal(() => JSON.stringify(theBeat));
    ui.modal.load = new LoadModal();
    ui.modal.load.onLoad = (data) => handleLoad(data);

    ui.resetButton = new ResetButton();
    ui.resetButton.onclick = () => {
        loadBeat(RESET_BEAT);
    };

    ui.demoButtons = new DemoButtons();
    ui.demoButtons.onDemoClick = (demoIndex) => {
        loadBeat(DEMO_BEATS[demoIndex]);
        handlePlay();
    };

    ui.tempoInput = new TempoInput({min: MIN_TEMPO, max: MAX_TEMPO, step: 4});
    ui.tempoInput.onTempoChange = (tempo) => {
        theBeat.tempo = tempo;
    };

    ui.playheads = new Playheads();
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
            ui.playheads.drawPlayhead((rhythmIndex + 15) % 16);
        }

        advanceNote();
    }

    timeoutId = setTimeout(schedule, 0);
}

function computePlaybackRate(instrument) {
    const pitch = theBeat[`${instrument.toLowerCase()}PitchVal`];
    return Math.pow(2.0, 2.0 * (pitch - 0.5));
}

function handleNoteClick(instrument, rhythmIndex) {
    const instrumentIndex = INSTRUMENTS.indexOf(instrument);
    const notes = theBeat[`rhythm${instrumentIndex + 1}`];    
    const note = (notes[rhythmIndex] + 1) % 3
    notes[rhythmIndex] = note;

    ui.notes.setNote(instrument, rhythmIndex, notes[rhythmIndex],);
    
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

function handleKitChange(index) {
    theBeat.kitIndex = index;
}

function handleEffectChange(index) {
    // Hack - if effect is turned all the way down - turn up effect slider.
    // ... since they just explicitly chose an effect from the list.
    if (theBeat.effectMix == 0)
        theBeat.effectMix = 0.5;

    setEffect(index);
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

   ui.effectPicker.select(index);
}

function setEffectLevel() {        
    // Factor in both the preset's effect level and the blending level (effectWetMix) stored in the effect itself.
    effectLevelNode.gain.value = theBeat.effectMix * effectWetMix;
}

function handlePlay() {
    noteTime = 0.0;
    startTime = context.currentTime + 0.005;
    schedule();

    ui.playButton.state = "playing";
}

function handleStop() {
    clearTimeout(timeoutId);

    rhythmIndex = 0;
    
    ui.playheads.off();
    ui.playButton.state = "stopped";
}

function handleLoad(data) {
    theBeat = JSON.parse(data);

    // Set effect
    setEffect(theBeat.effectIndex);

    // Change the volume of the convolution effect.
    setEffectLevel(theBeat);

    updateControls();
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

            ui.notes.setNote(INSTRUMENTS[j], i, notes[i]);
        }
    }

    ui.kitPicker.select(theBeat.kitIndex);
    ui.effectPicker.select(theBeat.effectIndex);
    ui.tempoInput.value = theBeat.tempo;
    ui.effectSlider.value = theBeat.effectMix;
    ui.swingSlider.value = theBeat.swingFactor;
    ui.pitchSliders.setPitch('Kick', theBeat.kickPitchVal);
    ui.pitchSliders.setPitch('Snare', theBeat.snarePitchVal);
    ui.pitchSliders.setPitch('HiHat', theBeat.hihatPitchVal);
    ui.pitchSliders.setPitch('Tom1', theBeat.tom1PitchVal); 
    ui.pitchSliders.setPitch('Tom2', theBeat.tom2PitchVal);
    ui.pitchSliders.setPitch('Tom3', theBeat.tom3PitchVal);
}
