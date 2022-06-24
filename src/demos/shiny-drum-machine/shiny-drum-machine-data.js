/**
 * Recursively freezes an object, prohibiting any modifications.
 *
 * @template T
 * @param {T} obj object on which to lock the attributes.
 * @return {T} frozen object
 */
function freeze(obj) {
  for (const property of Object.getOwnPropertyNames(obj)) {
    const value = obj[property];
    if (value && typeof value === 'object') {
      freeze(value);
    }
  }
  return Object.freeze(obj);
}

/**
 * Clones a plain object through JSON stringify and parse.
 *
 * @template T
 * @param {T} obj object to clone.
 * @return {T} cloned object
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const RESET_BEAT = freeze({
  kitIndex: 0,
  effectIndex: 0,
  tempo: 100,
  swingFactor: 0,
  effectMix: 0.25,
  kickPitchVal: 0.5,
  snarePitchVal: 0.5,
  hihatPitchVal: 0.5,
  tom1PitchVal: 0.5,
  tom2PitchVal: 0.5,
  tom3PitchVal: 0.5,
  rhythm1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rhythm2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rhythm3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rhythm4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rhythm5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rhythm6: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
});

const DEMO_BEATS = freeze([
  {
    kitIndex: 13,
    effectIndex: 18,
    tempo: 120,
    swingFactor: 0,
    effectMix: 0.19718309859154926,
    kickPitchVal: 0.5,
    snarePitchVal: 0.5,
    hihatPitchVal: 0.5,
    tom1PitchVal: 0.5,
    tom2PitchVal: 0.5,
    tom3PitchVal: 0.5,
    rhythm1: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rhythm2: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    rhythm3: [0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    rhythm4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
    rhythm5: [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rhythm6: [0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2, 0, 0, 0, 0, 0],
  },
  {
    kitIndex: 4,
    effectIndex: 3,
    tempo: 100,
    swingFactor: 0,
    effectMix: 0.2,
    kickPitchVal: 0.46478873239436624,
    snarePitchVal: 0.45070422535211263,
    hihatPitchVal: 0.15492957746478875,
    tom1PitchVal: 0.7183098591549295,
    tom2PitchVal: 0.704225352112676,
    tom3PitchVal: 0.8028169014084507,
    rhythm1: [2, 1, 0, 0, 0, 0, 0, 0, 2, 1, 2, 1, 0, 0, 0, 0],
    rhythm2: [0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 0, 2, 0, 0, 0],
    rhythm3: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1],
    rhythm4: [0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    rhythm5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
    rhythm6: [0, 0, 0, 0, 0, 0, 0, 2, 1, 2, 1, 0, 0, 0, 0, 0],
  },
  {
    kitIndex: 2,
    effectIndex: 5,
    tempo: 100,
    swingFactor: 0,
    effectMix: 0.25,
    kickPitchVal: 0.5,
    snarePitchVal: 0.5,
    hihatPitchVal: 0.5211267605633803,
    tom1PitchVal: 0.23943661971830987,
    tom2PitchVal: 0.21126760563380287,
    tom3PitchVal: 0.2535211267605634,
    rhythm1: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
    rhythm2: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    rhythm3: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    rhythm4: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    rhythm5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
    rhythm6: [0, 0, 1, 0, 1, 0, 0, 2, 0, 2, 0, 0, 1, 0, 0, 0],
  },
  {
    kitIndex: 1,
    effectIndex: 4,
    tempo: 120,
    swingFactor: 0,
    effectMix: 0.25,
    kickPitchVal: 0.7887323943661972,
    snarePitchVal: 0.49295774647887325,
    hihatPitchVal: 0.5,
    tom1PitchVal: 0.323943661971831,
    tom2PitchVal: 0.3943661971830986,
    tom3PitchVal: 0.323943661971831,
    rhythm1: [2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 1],
    rhythm2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rhythm3: [0, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 2, 0, 2, 0],
    rhythm4: [2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0],
    rhythm5: [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rhythm6: [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
  },
  {
    kitIndex: 0,
    effectIndex: 1,
    tempo: 60,
    swingFactor: 0.5419847328244275,
    effectMix: 0.25,
    kickPitchVal: 0.5,
    snarePitchVal: 0.5,
    hihatPitchVal: 0.5,
    tom1PitchVal: 0.5,
    tom2PitchVal: 0.5,
    tom3PitchVal: 0.5,
    rhythm1: [2, 2, 0, 1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 2, 0, 1],
    rhythm2: [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
    rhythm3: [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
    rhythm4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rhythm5: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    rhythm6: [1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0],
  },
]);

const INSTRUMENTS = freeze([
  {name: 'Kick', pan: false, sendGain: 0.5, mainGain: 1.0},
  {name: 'Snare', pan: false, sendGain: 1, mainGain: 0.6},
  {name: 'HiHat', pan: true, sendGain: 1, mainGain: 0.7},
  {name: 'Tom1', pan: false, sendGain: 1, mainGain: 0.6},
  {name: 'Tom2', pan: false, sendGain: 1, mainGain: 0.6},
  {name: 'Tom3', pan: false, sendGain: 1, mainGain: 0.6},
]);

const KIT_DATA = freeze([
  {id: 'R8', name: 'Roland R-8'},
  {id: 'CR78', name: 'Roland CR-78'},
  {id: 'KPR77', name: 'Korg KPR-77'},
  {id: 'LINN', name: 'LinnDrum'},
  {id: 'Kit3', name: 'Kit 3'},
  {id: 'Kit8', name: 'Kit 8'},
  {id: 'Techno', name: 'Techno'},
  {id: 'Stark', name: 'Stark'},
  {id: 'breakbeat8', name: 'Breakbeat 8'},
  {id: 'breakbeat9', name: 'Breakbeat 9'},
  {id: 'breakbeat13', name: 'Breakbeat 13'},
  {id: 'acoustic-kit', name: 'Acoustic Kit'},
  {id: '4OP-FM', name: '4OP-FM'},
  {id: 'TheCheebacabra1', name: 'The Cheebacabra 1'},
  {id: 'TheCheebacabra2', name: 'The Cheebacabra 2'},
]);

// Impulse responses - each one represents a unique linear effect.
const IMPULSE_RESPONSE_DATA = freeze([
  {
    name: 'No Effect',
    url: '',
    dryMix: 1,
    wetMix: 0,
  },
  {
    name: 'Spreader 1',
    url: 'impulse-responses/spreader50-65ms.wav',
    dryMix: 0.8,
    wetMix: 1.4,
  },
  {
    name: 'Spreader 2',
    url: 'impulse-responses/noise-spreader1.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Spring Reverb',
    url: 'impulse-responses/feedback-spring.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Space Oddity',
    url: 'impulse-responses/filter-rhythm3.wav',
    dryMix: 1,
    wetMix: 0.7,
  },
  {
    name: 'Reverse',
    url: 'impulse-responses/spatialized5.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Huge Reverse',
    url: 'impulse-responses/matrix6-backwards.wav',
    dryMix: 0,
    wetMix: 0.7,
  },
  {
    name: 'Telephone Filter',
    url: 'impulse-responses/filter-telephone.wav',
    dryMix: 0,
    wetMix: 1.2,
  },
  {
    name: 'Lopass Filter',
    url: 'impulse-responses/filter-lopass160.wav',
    dryMix: 0,
    wetMix: 0.5,
  },
  {
    name: 'Hipass Filter',
    url: 'impulse-responses/filter-hipass5000.wav',
    dryMix: 0,
    wetMix: 4.0,
  },
  {
    name: 'Comb 1',
    url: 'impulse-responses/comb-saw1.wav',
    dryMix: 0,
    wetMix: 0.7,
  },
  {
    name: 'Comb 2',
    url: 'impulse-responses/comb-saw2.wav',
    dryMix: 0,
    wetMix: 1.0,
  },
  {
    name: 'Cosmic Ping',
    url: 'impulse-responses/cosmic-ping-long.wav',
    dryMix: 0,
    wetMix: 0.9,
  },
  {
    name: 'Medium Hall 1',
    url: 'impulse-responses/matrix-reverb2.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Medium Hall 2',
    url: 'impulse-responses/matrix-reverb3.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Large Hall',
    url: 'impulse-responses/spatialized4.wav',
    dryMix: 1,
    wetMix: 0.5,
  },
  {
    name: 'Peculiar',
    url: 'impulse-responses/peculiar-backwards.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Backslap',
    url: 'impulse-responses/backslap1.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Diffusor',
    url: 'impulse-responses/diffusor3.wav',
    dryMix: 1,
    wetMix: 1,
  },
  {
    name: 'Huge',
    url: 'impulse-responses/matrix-reverb6.wav',
    dryMix: 1,
    wetMix: 0.7,
  },
]);

export {
  RESET_BEAT,
  DEMO_BEATS,
  INSTRUMENTS,
  KIT_DATA,
  IMPULSE_RESPONSE_DATA,
  freeze,
  clone,
};
