/**
 * A simple demonstration of WASM-powered AudioWorkletProcessor.
 *
 * @class
 */
class WASMAudioWorkletProcessor extends AudioWorkletProcessor {

  constructor() {
    super();

    // Allocate the buffer for the heap access. Start with stereo, but it can
    // be expanded up to 32 channels.
    this._heapInputBuffer =
        new HeapAudioBuffer(WA2.RENDER_QUANTUM_FRAMES, 2, 32);
    this._heapOutputBuffer =
        new HeapAudioBuffer(WA2.RENDER_QUANTUM_FRAMES, 2, 32);

    this._kernel = new Module.AudioWorkletProcessorKernel();
  }

  process(inputs, outputs, parameters) {
    // Use the 1st input and output only. |input| and |output| here have the
    // same structure with the AudioBuffer interface. (An array of Float32Array)
    let input = inputs[0];
    let output = outputs[0];

    // The channel count of the pipeline in the node is static within a given
    // render quantum. Also identical for the input and output.
    let channelCount = input.length;

    // Prepare the dynamic channel count change.
    this._heapInputBuffer.adaptChannel(channelCount);
    this._heapOutputBuffer.adaptChannel(channelCount);

    // Copy-in, process and copy-out.
    for (let channel = 0; channel < channelCount; ++channel) {
      this._heapInputBuffer.getChannelData(channel).set(input[channel]);
    }

    this._kernel.process(this._heapInputBuffer.getHeap(),
                         this._heapOutputBuffer.getHeap(),
                         channelCount);

    for (let channel = 0; channel < channelCount; ++channel) {
      output[channel].set(this._heapOutputBuffer.getChannelData(channel));
    }

    return true;
  }
}

registerProcessor('wasm-audio-worklet-processor', WASMAudioWorkletProcessor);
