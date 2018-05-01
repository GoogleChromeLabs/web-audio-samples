/**
 * An example of AudioWorkletProcessor that uses RingBuffer inside. If your
 * audio processing function uses the buffer size other than 128 frames, using
 * RingBuffer can be a solution.
 *
 * Note that this example uses the WASM processor, but it can be utilized for
 * the ScriptProcessor's callback function with a bit of coordination.
 *
 * @class
 */
class RingBufferWorkletProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super();

    this._kernelBufferSize = options.processorOptions.kernelBufferSize;
    this._channelCount = options.processorOptions.channelCount;

    // RingBuffers for input and output.
    this._inputRingBuffer =
        new RingBuffer(this._kernelBufferSize, this._channelCount);
    this._outputRingBuffer =
        new RingBuffer(this._kernelBufferSize, this._channelCount);

    // For WASM memory, also for input and output.
    this._heapInputBuffer =
        new HeapAudioBuffer(this._kernelBufferSize, this._channelCount);
    this._heapOutputBuffer =
        new HeapAudioBuffer(this._kernelBufferSize, this._channelCount);

    // WASM audio processing kernel.
    this._kernel =
        new Module.RingBufferWorkletProcessorKernel(this._kernelBufferSize);
  }

  process(inputs, outputs, parameters) {
    let input = inputs[0];
    let output = outputs[0];

    // AudioWorkletProcessor always gets 128 frams in and 128 frames out. Here
    // we push 128 frames into the ring buffer.
    this._inputRingBuffer.push(input);

    // Process only if we have enough frames for the kernel.
    if (this._inputRingBuffer.framesAvailable >= this._kernelBufferSize) {

      // Get the queued data from the input ring buffer.
      this._inputRingBuffer.pull(this._heapInputBuffer.getChannelData());

      // This WASM process function can be replaced with ScriptProcessor's
      // |onaudioprocess| callback funciton. However, if the event handler
      // touches DOM in the main scope, it needs to be translated with the
      // async messaging via MessagePort.
      this._kernel.process(this._heapInputBuffer.getHeap(),
                           this._heapOutputBuffer.getHeap(),
                           this._channelCount);

      // Fill the output ring buffer with the processed data.
      this._outputRingBuffer.push(this._heapOutputBuffer.getChannelData());
    }

    // Always pull 128 frames out. If the ring buffer does not have enough
    // frames, the output will be silent.
    this._outputRingBuffer.pull(output);

    return true;
  }
}  // class RingBufferWorkletProcessor

registerProcessor('ring-buffer-worklet-processor', RingBufferWorkletProcessor);
