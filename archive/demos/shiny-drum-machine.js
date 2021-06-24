// Events
// init() once the page has finished loading.

// Temporary patch until all browsers support unprefixed context.
window.AudioContext = window.AudioContext || window.webkitAudioContext;

window.onload = init;

var context;
var convolver;
var compressor;
var masterGainNode;
var effectLevelNode;

// Each effect impulse response has a specific overall desired dry and wet volume.
// For example in the telephone filter, it's necessary to make the dry volume 0 to correctly hear the effect.
var effectDryMix = 1.0;
var effectWetMix = 1.0;

var timeoutId;

var startTime;
var lastDrawTime = -1;

let KITS;

var kNumInstruments = 6;
var kMaxSwing = .08;

var beatReset = {"kitIndex":0,"effectIndex":0,"tempo":100,"swingFactor":0,"effectMix":0.25,"kickPitchVal":0.5,"snarePitchVal":0.5,"hihatPitchVal":0.5,"tom1PitchVal":0.5,"tom2PitchVal":0.5,"tom3PitchVal":0.5,"rhythm1":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm2":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm3":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm4":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm5":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm6":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};
var beatDemo = [
    {"kitIndex":13,"effectIndex":18,"tempo":120,"swingFactor":0,"effectMix":0.19718309859154926,"kickPitchVal":0.5,"snarePitchVal":0.5,"hihatPitchVal":0.5,"tom1PitchVal":0.5,"tom2PitchVal":0.5,"tom3PitchVal":0.5,"rhythm1":[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm2":[0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0],"rhythm3":[0,0,0,0,0,0,2,0,2,0,0,0,0,0,0,0],"rhythm4":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0],"rhythm5":[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm6":[0,0,0,0,0,0,0,2,0,2,2,0,0,0,0,0]},
    {"kitIndex":4,"effectIndex":3,"tempo":100,"swingFactor":0,"effectMix":0.2,"kickPitchVal":0.46478873239436624,"snarePitchVal":0.45070422535211263,"hihatPitchVal":0.15492957746478875,"tom1PitchVal":0.7183098591549295,"tom2PitchVal":0.704225352112676,"tom3PitchVal":0.8028169014084507,"rhythm1":[2,1,0,0,0,0,0,0,2,1,2,1,0,0,0,0],"rhythm2":[0,0,0,0,2,0,0,0,0,1,1,0,2,0,0,0],"rhythm3":[0,1,2,1,0,1,2,1,0,1,2,1,0,1,2,1],"rhythm4":[0,0,0,0,0,0,2,1,0,0,0,0,0,0,0,0],"rhythm5":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0],"rhythm6":[0,0,0,0,0,0,0,2,1,2,1,0,0,0,0,0]},
    {"kitIndex":2,"effectIndex":5,"tempo":100,"swingFactor":0,"effectMix":0.25,"kickPitchVal":0.5,"snarePitchVal":0.5,"hihatPitchVal":0.5211267605633803,"tom1PitchVal":0.23943661971830987,"tom2PitchVal":0.21126760563380287,"tom3PitchVal":0.2535211267605634,"rhythm1":[2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0],"rhythm2":[0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0],"rhythm3":[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],"rhythm4":[1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],"rhythm5":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0],"rhythm6":[0,0,1,0,1,0,0,2,0,2,0,0,1,0,0,0]},
    {"kitIndex":1,"effectIndex":4,"tempo":120,"swingFactor":0,"effectMix":0.25,"kickPitchVal":0.7887323943661972,"snarePitchVal":0.49295774647887325,"hihatPitchVal":0.5,"tom1PitchVal":0.323943661971831,"tom2PitchVal":0.3943661971830986,"tom3PitchVal":0.323943661971831,"rhythm1":[2,0,0,0,0,0,0,2,2,0,0,0,0,0,0,1],"rhythm2":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm3":[0,0,1,0,2,0,1,0,1,0,1,0,2,0,2,0],"rhythm4":[2,0,2,0,0,0,0,0,2,0,0,0,0,2,0,0],"rhythm5":[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm6":[0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0]},
    {"kitIndex":0,"effectIndex":1,"tempo":60,"swingFactor":0.5419847328244275,"effectMix":0.25,"kickPitchVal":0.5,"snarePitchVal":0.5,"hihatPitchVal":0.5,"tom1PitchVal":0.5,"tom2PitchVal":0.5,"tom3PitchVal":0.5,"rhythm1":[2,2,0,1,2,2,0,1,2,2,0,1,2,2,0,1],"rhythm2":[0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],"rhythm3":[2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1],"rhythm4":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"rhythm5":[0,0,1,0,0,1,0,1,0,0,1,0,0,0,1,0],"rhythm6":[1,0,0,1,0,1,0,1,1,0,0,1,1,1,1,0]},
];

function cloneBeat(source) {
    var beat = new Object();
    
    beat.kitIndex = source.kitIndex;
    beat.effectIndex = source.effectIndex;
    beat.tempo = source.tempo;
    beat.swingFactor = source.swingFactor;
    beat.effectMix = source.effectMix;
    beat.kickPitchVal = source.kickPitchVal;
    beat.snarePitchVal = source.snarePitchVal;
    beat.hihatPitchVal = source.hihatPitchVal;
    beat.tom1PitchVal = source.tom1PitchVal;
    beat.tom2PitchVal = source.tom2PitchVal;
    beat.tom3PitchVal = source.tom3PitchVal;
    beat.rhythm1 = source.rhythm1.slice(0);        // slice(0) is an easy way to copy the full array
    beat.rhythm2 = source.rhythm2.slice(0);
    beat.rhythm3 = source.rhythm3.slice(0);
    beat.rhythm4 = source.rhythm4.slice(0);
    beat.rhythm5 = source.rhythm5.slice(0);
    beat.rhythm6 = source.rhythm6.slice(0);
    
    return beat;
}

// theBeat is the object representing the current beat/groove
// ... it is saved/loaded via JSON
var theBeat = cloneBeat(beatReset);

var loopLength = 16;
var rhythmIndex = 0;
var kMinTempo = 50;
var kMaxTempo = 180;
var noteTime = 0.0;

var instruments = ['Kick', 'Snare', 'HiHat', 'Tom1', 'Tom2', 'Tom3'];

var volumes = [0, 0.3, 1];

const KIT_DATA = [
    {id: "R8", name: "Roland R-8"},
    {id: "CR78", name: "Roland CR-78"},
    {id: "KPR77", name: "Korg KPR-77"},
    {id: "LINN", name: "LinnDrum"},
    {id: "Kit3", name: "Kit 3"},
    {id: "Kit8", name: "Kit 8"},
    {id: "Techno", name: "Techno"},
    {id: "Stark", name: "Stark"},
    {id: "breakbeat8", name: "Breakbeat 8"},
    {id: "breakbeat9", name: "Breakbeat 9"},
    {id: "breakbeat13", name: "Breakbeat 13"},
    {id: "acoustic-kit", name: "Acoustic Kit"},
    {id: "4OP-FM", name: "4OP-FM"},
    {id: "TheCheebacabra1", name: "The Cheebacabra 1"},
    {id: "TheCheebacabra2", name: "The Cheebacabra 2"},
];

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
        const instrumentPromises = instruments.map(instrument => this.loadSample(instrument));
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

var impulseResponseInfoList = [
    // Impulse responses - each one represents a unique linear effect.
    {"name":"No Effect", "url":"undefined", "dryMix":1, "wetMix":0},
    {"name":"Spreader 1", "url":"impulse-responses/spreader50-65ms.wav",        "dryMix":0.8, "wetMix":1.4},
    {"name":"Spreader 2", "url":"impulse-responses/noise-spreader1.wav",        "dryMix":1, "wetMix":1},
    {"name":"Spring Reverb", "url":"impulse-responses/feedback-spring.wav",     "dryMix":1, "wetMix":1},
    {"name":"Space Oddity", "url":"impulse-responses/filter-rhythm3.wav",       "dryMix":1, "wetMix":0.7},
    {"name":"Reverse", "url":"impulse-responses/spatialized5.wav",              "dryMix":1, "wetMix":1},
    {"name":"Huge Reverse", "url":"impulse-responses/matrix6-backwards.wav",    "dryMix":0, "wetMix":0.7},
    {"name":"Telephone Filter", "url":"impulse-responses/filter-telephone.wav", "dryMix":0, "wetMix":1.2},
    {"name":"Lopass Filter", "url":"impulse-responses/filter-lopass160.wav",    "dryMix":0, "wetMix":0.5},
    {"name":"Hipass Filter", "url":"impulse-responses/filter-hipass5000.wav",   "dryMix":0, "wetMix":4.0},
    {"name":"Comb 1", "url":"impulse-responses/comb-saw1.wav",                  "dryMix":0, "wetMix":0.7},
    {"name":"Comb 2", "url":"impulse-responses/comb-saw2.wav",                  "dryMix":0, "wetMix":1.0},
    {"name":"Cosmic Ping", "url":"impulse-responses/cosmic-ping-long.wav",      "dryMix":0, "wetMix":0.9},
    {"name":"Kitchen", "url":"impulse-responses/house-impulses/kitchen-true-stereo.wav", "dryMix":1, "wetMix":1},
    {"name":"Living Room", "url":"impulse-responses/house-impulses/dining-living-true-stereo.wav", "dryMix":1, "wetMix":1},
    {"name":"Living-Bedroom", "url":"impulse-responses/house-impulses/living-bedroom-leveled.wav", "dryMix":1, "wetMix":1},
    {"name":"Dining-Far-Kitchen", "url":"impulse-responses/house-impulses/dining-far-kitchen.wav", "dryMix":1, "wetMix":1},
    {"name":"Medium Hall 1", "url":"impulse-responses/matrix-reverb2.wav",      "dryMix":1, "wetMix":1},
    {"name":"Medium Hall 2", "url":"impulse-responses/matrix-reverb3.wav",      "dryMix":1, "wetMix":1},
    {"name":"Large Hall", "url":"impulse-responses/spatialized4.wav",           "dryMix":1, "wetMix":0.5},
    {"name":"Peculiar", "url":"impulse-responses/peculiar-backwards.wav",       "dryMix":1, "wetMix":1},
    {"name":"Backslap", "url":"impulse-responses/backslap1.wav",                "dryMix":1, "wetMix":1},
    {"name":"Warehouse", "url":"impulse-responses/tim-warehouse/cardiod-rear-35-10/cardiod-rear-levelled.wav", "dryMix":1, "wetMix":1},
    {"name":"Diffusor", "url":"impulse-responses/diffusor3.wav",                "dryMix":1, "wetMix":1},
    {"name":"Binaural Hall", "url":"impulse-responses/bin_dfeq/s2_r4_bd.wav",   "dryMix":1, "wetMix":0.5},
    {"name":"Huge", "url":"impulse-responses/matrix-reverb6.wav",               "dryMix":1, "wetMix":0.7},
]

var impulseResponseList = 0;

function ImpulseResponse(url, index) {
    this.url = url;
    this.index = index;
    this.startedLoading = false;
    this.isLoaded_ = false;
    this.buffer = 0;
    
    this.demoIndex = -1; // no demo
}

ImpulseResponse.prototype.setDemoIndex = function(index) {
    this.demoIndex = index;
}

ImpulseResponse.prototype.isLoaded = function() {
    return this.isLoaded_;
}

ImpulseResponse.prototype.load = function() {
    if (this.startedLoading) {
        return;
    }
    
    this.startedLoading = true;

    // Load asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.responseType = "arraybuffer";
    this.request = request;
    
    var asset = this;

    request.onload = function() {
        context.decodeAudioData(
            request.response,
            function(buffer) {
                asset.buffer = buffer;
                asset.isLoaded_ = true;

                if (asset.demoIndex != -1) {
                    beatDemo[asset.demoIndex].setEffectLoaded();
                }                
            },
            
            function(buffer) {
                console.log("Error decoding impulse response!");
            }
        );
    }

    request.send();
}

function startLoadingAssets() {
    impulseResponseList = new Array();

    for (i = 0; i < impulseResponseInfoList.length; i++) {
        impulseResponseList[i] = new ImpulseResponse(impulseResponseInfoList[i].url, i);
    }
    
    // Initialize drum kits
    KITS = KIT_DATA.map(({id, name}) => new Kit(id, name));
    
    // Start loading the assets used by the presets first, in order of the presets.
    for (var demoIndex = 0; demoIndex < 5; ++demoIndex) {
        const demo = beatDemo[demoIndex];
        var effect = impulseResponseList[demo.effectIndex];
        const kit = KITS[demo.kitIndex];
        
        // These effects and kits will keep track of a particular demo, so we can change
        // the loading status in the UI.
        effect.setDemoIndex(demoIndex);
        
        effect.load();
        kit.load().then(() => demo.setKitLoaded());
    }
    
    // Then load the remaining assets.
    // Note that any assets which have previously started loading will be skipped over.
    for(const kit of KITS) {
        kit.load();
    }  

    // Start at 1 to skip "No Effect"
    for (i = 1; i < impulseResponseInfoList.length; i++) {
        impulseResponseList[i].load();
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
        loadBeat(beatDemo[1]);
    }
}

// This gets rid of the loading spinner on the play button.
function showPlayAvailable() {
    playButton.state = "stopped";
}

function init() {
    // Let the beat demos know when all of their assets have been loaded.
    // Add some new methods to support this.
    for (var i = 0; i < beatDemo.length; ++i) {
        beatDemo[i].index = i;
        beatDemo[i].isKitLoaded = false;
        beatDemo[i].isEffectLoaded = false;

        beatDemo[i].setKitLoaded = function() {
            this.isKitLoaded = true;
            this.checkIsLoaded();
        };

        beatDemo[i].setEffectLoaded = function() {
            this.isEffectLoaded = true;
            this.checkIsLoaded();
        };

        beatDemo[i].checkIsLoaded = function() {
            if (this.isLoaded()) {
                showDemoAvailable(this.index); 
            }
        };

        beatDemo[i].isLoaded = function() {
            return this.isKitLoaded && this.isEffectLoaded;
        };
    }
        
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

    initControls();
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

const pitchSliders = {};
let effectSlider;
let swingSlider;
const noteButtons = {};
let playButton;
const demoButtons = [];

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

    for (let i = 0; i < beatDemo.length; i++) {
        const button = new Button(document.querySelector(`[data-demo="${i}"]`));
        button.onclick = handleDemoMouseDown;
        demoButtons.push(button);
    }

    document.getElementById('tempoinc').addEventListener('click', tempoIncrease, true);
    document.getElementById('tempodec').addEventListener('click', tempoDecrease, true);
}

function initButtons() {        
    for(const instrument of instruments) {
        noteButtons[instrument] = [];

        for (let rhythm = 0; rhythm < loopLength; rhythm++) {
            const el = document.querySelector(`[data-instrument="${instrument}"][data-rhythm="${rhythm}"]`);
            noteButtons[instrument][rhythm] = new Button(el);
            noteButtons[instrument][rhythm].onclick = handleButtonMouseDown;

        }
    }
}

function makeEffectList() {
    var elList = document.getElementById('effectlist');
    var numEffects = impulseResponseInfoList.length;
    
    for (var i = 0; i < numEffects; i++) {
        elList.add(new Option(impulseResponseInfoList[i].name));
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
    if (rhythmIndex == loopLength) {
        rhythmIndex = 0;
    }

        // apply swing    
    if (rhythmIndex % 2) {
        noteTime += (0.25 + kMaxSwing * theBeat.swingFactor) * secondsPerBeat;
    } else {
        noteTime += (0.25 - kMaxSwing * theBeat.swingFactor) * secondsPerBeat;
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
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 0.5, volumes[theBeat.rhythm1[rhythmIndex]] * 1.0, computePlaybackRate(instrument), contextPlayTime);
        }

        // Snare
        if (theBeat.rhythm2[rhythmIndex]) {
            let instrument = 'Snare';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, volumes[theBeat.rhythm2[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        // Hihat
        if (theBeat.rhythm3[rhythmIndex]) {
            // Pan the hihat according to sequence position.
            let instrument = 'HiHat';
            playNote(getCurrentKit().buffer[instrument], true, 0.5*rhythmIndex - 4, 0, -1.0, 1, volumes[theBeat.rhythm3[rhythmIndex]] * 0.7, computePlaybackRate(instrument), contextPlayTime);
        }

        // Toms    
        if (theBeat.rhythm4[rhythmIndex]) {
            let instrument = 'Tom1';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, volumes[theBeat.rhythm4[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        if (theBeat.rhythm5[rhythmIndex]) {
            let instrument = 'Tom2';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, volumes[theBeat.rhythm5[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        if (theBeat.rhythm6[rhythmIndex]) {
            let instrument = 'Tom3';
            playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 1, volumes[theBeat.rhythm6[rhythmIndex]] * 0.6, computePlaybackRate(instrument), contextPlayTime);
        }

        
        // Attempt to synchronize drawing time with sound
        if (noteTime != lastDrawTime) {
            lastDrawTime = noteTime;
            drawPlayhead((rhythmIndex + 15) % 16);
        }

        advanceNote();
    }

    timeoutId = setTimeout("schedule()", 0);
}

function tempoIncrease() {
    theBeat.tempo = Math.min(kMaxTempo, theBeat.tempo+4);
    document.getElementById('tempo').innerHTML = theBeat.tempo;
}

function tempoDecrease() {
    theBeat.tempo = Math.max(kMinTempo, theBeat.tempo-4);
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
    const instrumentIndex = instruments.indexOf(instrument);
    const notes = theBeat[`rhythm${instrumentIndex + 1}`];    
    const note = (notes[rhythmIndex] + 1) % 3
    notes[rhythmIndex] = note;

    drawNote(notes[rhythmIndex], rhythmIndex, instrument);
    
    if (note) {
        switch(instrumentIndex) {
        case 0:  // Kick
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, 0.5 * theBeat.effectMix, volumes[note] * 1.0, computePlaybackRate(instrument), 0);
          break;

        case 1:  // Snare
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, volumes[note] * 0.6, computePlaybackRate(instrument), 0);
          break;

        case 2:  // Hihat
          // Pan the hihat according to sequence position.
          playNote(getCurrentKit().buffer[instrument], true, 0.5*rhythmIndex - 4, 0, -1.0, theBeat.effectMix, volumes[note] * 0.7, computePlaybackRate(instrument), 0);
          break;

        case 3:  // Tom 1   
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, volumes[note] * 0.6, computePlaybackRate(instrument), 0);
          break;

        case 4:  // Tom 2   
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, volumes[note] * 0.6, computePlaybackRate(instrument), 0);
          break;

        case 5:  // Tom 3   
          playNote(getCurrentKit().buffer[instrument], false, 0,0,-2, theBeat.effectMix, volumes[note] * 0.6, computePlaybackRate(instrument), 0);
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

function setEffect(index) {
    if (index > 0 && !impulseResponseList[index].isLoaded()) {
        alert('Sorry, this effect is still loading.  Try again in a few seconds :)');
        return;
    }

    theBeat.effectIndex = index;
    effectDryMix = impulseResponseInfoList[index].dryMix;
    effectWetMix = impulseResponseInfoList[index].wetMix;            
    convolver.buffer = impulseResponseList[index].buffer;

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
    const loaded = loadBeat(beatDemo[i]);
    
    if (loaded)
        handlePlay();
}

function handlePlay(event) {
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

function handleReset(event) {
    handleStop();
    loadBeat(beatReset);    
}

function loadBeat(beat) {
    // Check that assets are loaded.
    if (beat != beatReset && !beat.isLoaded())
        return false;

    handleStop();

    theBeat = cloneBeat(beat);
    setEffect(theBeat.effectIndex);

    updateControls();

    return true;
}

function updateControls() {
    for (i = 0; i < loopLength; ++i) {
        for (j = 0; j < kNumInstruments; j++) {
            switch (j) {
                case 0: notes = theBeat.rhythm1; break;
                case 1: notes = theBeat.rhythm2; break;
                case 2: notes = theBeat.rhythm3; break;
                case 3: notes = theBeat.rhythm4; break;
                case 4: notes = theBeat.rhythm5; break;
                case 5: notes = theBeat.rhythm6; break;
            }

            drawNote(notes[i], i, instruments[j]);
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
