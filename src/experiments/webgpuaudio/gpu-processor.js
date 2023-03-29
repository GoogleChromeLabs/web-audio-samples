/**
 * A WebGPU Processor for processing audio data.
 *
 * @typedef GpuProcessor
 * @property {Uint32Array} adapter Adapter.
 * @property {number} device Device.
 * @property {} gpuWriteBuffer
 * @property {} gpuReadBuffer
 */

class GpuProcessor {

  process = async (Float32Array inputs) => {
      if(!gpuWriteBuffer) {
          this.gpuWriteBuffer = this.createWriteBuffer(128);
      }
      if(!gpuReadBuffer) {
          this.gpuReadBuffer = this.createReadBuffer(128);
      }
      this.writeData(inputs); // bypass
      return this.readData();
  };

  constructor = async () => {
      this.adapter = await navigator.gpu.requestAdapter();
      this.device = await adapter.requestDevice();
  };

  function createWriteBuffer(size) {
      this.gpuWriteBuffer = this.device.CreateBuffer({
          mappedAtCreation: true,
          size: size * Float32Array.BYTES_PER_ELEMENT,
          usage: GPUBufferUsage.MAP_WRITE;
      });
  }

  function createReadBuffer(size) {
      this.gpuReadBuffer = this.device.CreateBuffer({
          size: size * Float32Array.BYTES_PER_ELEMENT,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
  }

  function writeData(Float32Array inputs) {
      const arrayBuffer = this.gpuWriteBuffer.getMappedRange();
      new Float32Array(arrayBuffer);
      arrayBuffer = inputs;
  }

  readData = async () => {
      await this.gpuReadBuffer.mapAsync(GPUMapMode.READ);
      const copyArrayBuffer = this.gpuReadBuffer.getMappedRange();
      return new Float32Array(copyArrayBuffer);
  }
};

export default GpuProcessor;