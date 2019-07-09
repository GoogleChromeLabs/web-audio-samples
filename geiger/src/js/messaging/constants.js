


export const DEFAULT_NODE_ATTR = {
  contextId: 1,
  numberOfInputs: 1,
  numberOfOutputs: 1,
  audioParamNames: ['gain']
}

export const NODE_ATTRS = {
  'AudioBufferSource': {numberOfInputs: 0, audioParamNames: []},
  'Gain': null,
  'Oscillator': {numberOfInputs: 0, audioParamNames: ['frequency', 'detune']},
  'BiquadFilter': {numberOfInputs: 1, audioParamNames: ['frequency', 'detune', 'Q', 'gain']},
  'AudioDestination': {numberOfOutputs: 0, audioParamNames: []},
}
