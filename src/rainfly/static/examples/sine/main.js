// Use `context` as the AudioContext
// @sampleRate = 48000

await context.audioWorklet.addModule('processor.js');
const sineWorkletNode = new AudioWorkletNode(context, 'sine-processor');
sineWorkletNode.parameters.get('frequency').value = 440;
sineWorkletNode.connect(context.destination);
