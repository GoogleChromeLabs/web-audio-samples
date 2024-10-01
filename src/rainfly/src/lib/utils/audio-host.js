// import AsyncFunction
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

/** @type {Array<Array<number>>} */
export let recordedSamples = [[]];

/** @type {AudioContext | undefined} */
let context;
/** @type {AudioWorkletNode | undefined} */
let recorder;
let sampleRate = 48000;
let _blobUrl = '';

// -----------------------------------------------------------------------------
// EDITOR CODE HANDLING
// -----------------------------------------------------------------------------
/**
 * Replace addModule url to be blobUrl for AudioWorkletNode
 * @param {string} code - code containing addModule function
 * @return {string} code with addModule url replaced to blobUrl
 */
function transformWorkletModuleUrl(code) {
  if (_blobUrl === '') {
    return code;
  }
  return code.replace(/addModule\(["'].*?["']\)/, `addModule('${_blobUrl}')`);
}

/**
 * Find and replace all instances of a string in a code block
 * @param {string} code - code block to search
 * @param {string} find - string to find
 * @param {string} replace - string to replace
 * @return {string} transformed code block
 */
function findReplace(code, find, replace) {
  return code.replace(new RegExp(find, 'g'), replace);
}

/**
 * Parse parameter from header code comments
 * @param {string} code - code to parse
 * @param {string} paramName - syntax: // @paramName = value
 * @return {number | null} parsed value or null
 */
function parseParam(code, paramName) {
  const regex = new RegExp(`@${paramName}\\s*=\\s*(\\d+)`);
  const match = code.match(regex);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Run AudioWorkletProcessor code to build an AudioWorkletNode
 * @param {string} code - Processor code to run
 */
export function runProcessorCode(code) {
  _blobUrl = window.URL.createObjectURL(
      new Blob([code], {type: 'text/javascript'}),
  );
}

/**
 * Run AudioContext code to execute Web Audio Code. If this code contains
 * AudioWorklet instantiation, `runProcessorCode` must be run first.
 * @param {string} code - AudioContext Graph code to run
 */
export async function runMainCode(code) {
  await context?.close();

  const tryParseSampleRate = parseParam(code, 'sampleRate');
  sampleRate = tryParseSampleRate ? tryParseSampleRate : sampleRate;

  await createContext();

  let transformCode = transformWorkletModuleUrl(code);
  transformCode = findReplace(transformCode,
      'context.destination',
      'recorder).connect(context.destination');

  const evalFunction = new AsyncFunction('context', 'sampleRate', 'recorder',
      transformCode);
  await evalFunction(context, sampleRate, recorder);
}

// -----------------------------------------------------------------------------
// AUDIO CONTEXT
// -----------------------------------------------------------------------------
/**
 * Create an AudioContext and all the essentials for Rainfly audio processing
 */
async function createContext() {
  context = new AudioContext({sampleRate});
  await context.audioWorklet.addModule('processor/recorder-processor.js');
  recorder = new AudioWorkletNode(context, 'recorder-processor');
  recorder.port.onmessage = (event) => {
    // if channel doesn't exist, create it with empty array
    if (!(event.data.channel in recordedSamples)) {
      recordedSamples[event.data.channel] = [];
    }
    recordedSamples[event.data.channel].push(...event.data.data);
  };
}

/**
 * Resume the AudioContext
 */
export function resumeContext() {
  context?.resume();
}

/**
 * Suspend the AudioContext
 */
export function suspendContext() {
  context?.suspend();
}

/**
 * Destroy the AudioContext
 */
export function stopContext() {
  context?.close();
  context = undefined;
  recorder = undefined;
  recordedSamples = [[]];
}

// -----------------------------------------------------------------------------
// RECORDER
// -----------------------------------------------------------------------------
/**
 * Get current recorded samples
 * @return {Array<Array<number>>} - The recorded samples
 */
export function getRecordedSamples() {
  return recordedSamples;
}

/**
 * Returns the current sample rate of the AudioContext
 * @return {number} - The current sample rate
 */
export function getSampleRate() {
  return sampleRate;
}
