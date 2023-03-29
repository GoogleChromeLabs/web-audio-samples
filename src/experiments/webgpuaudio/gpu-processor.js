import { FRAME_SIZE } from "./constants.js";

class GPUProcessor {
  constructor() {}

  init = async () => {
    if(!navigator.gpu) {
      console.log("Please enable WebGPU");
      return;
    }

    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
  }

  processInputAndReturn = async(input) => {
    // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
    const gpuWriteBuffer = this.device.createBuffer({
        mappedAtCreation: true,
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
    });
    const arrayBuffer = gpuWriteBuffer.getMappedRange();

    // Write bytes to buffer.
    new Float32Array(arrayBuffer).set(input);

    // Unmap buffer so that it can be used later for copy.
    gpuWriteBuffer.unmap();
    
    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = this.device.createBuffer({
        mappedAtCreation: false,
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

      // Encode commands for copying buffer to buffer.
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
        gpuWriteBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT
    );

    // Submit copy commands.
    const copyCommands = copyEncoder.finish();
    this.device.queue.submit([copyCommands]);

    // Read buffer.
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = gpuReadBuffer.getMappedRange();

    return new Float32Array(copyArrayBuffer).map(sample => 0.1 * sample);
  }
};

export default GPUProcessor;