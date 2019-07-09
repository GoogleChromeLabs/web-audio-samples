
/**
 * Computes the color that should be used to visualize an AudioNode.
 * @param {!string} nodeType The type of the node. With the Node suffix removed.
 * @param {boolean} [isOffline] Whether this node pertains to an
 *     OfflineAudioContext.
 * @return {string} The hex color used to visualize the AudioNode.
 */
export const computeNodeColor = function(nodeType, isOffline) {
  // AudioNodes are grouped into color categories based on their purposes.
  switch (nodeType) {
    case 'AudioDestination':
      // The destination nodes of OfflineAudioContexts are brown. Those of
      // "non-offline" AudioContexts are a dark grey.
      return isOffline ? '#5D4037' : '#37474F';
    case 'AudioBufferSource':
    case 'Oscillator':
      return '#009688';
    case 'BiquadFilter':
    case 'Convolver':
    case 'Delay':
    case 'DynamicsCompressor':
    case 'IIRFilter':
    case 'Panner':
    case 'StereoPanner':
    case 'WaveShaper':
      return '#2196F3';
    case 'Analyser':
      return '#00BCD4';
    case 'Gain':
    case 'ChannelMerger':
    case 'ChannelSplitter':
      return '#3F51B5';
    case 'MediaElementAudioSource':
    case 'MediaStreamAudioDestination':
    case 'MediaStreamAudioSource':
      return '#9C27B0';
    case 'ScriptProcessor':
      return '#C62828';
    default:
      // Nothing matched. Odd. Highlight this node in dark red.
      return '#C62828';
  }
};