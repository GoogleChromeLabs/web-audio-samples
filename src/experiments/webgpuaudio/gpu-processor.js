import { FRAME_SIZE, WORKGROUP_SIZE } from "./constants.js";

console.assert(navigator.gpu);
console.assert(navigator.gpu.requestAdapter);

/**
 * A class to perform all WebGPU related activities, like processing data, 
 * performing convolution on audio data etc.
 *
 * @class GPUProcessor
 * @property {Float32Array} irArray_ The impulse response array for convolution.
 * @property {GPUAdapter} adapter The size of the impulse response array.
 * @property {GPUDevice} device The size of the impulse response array.
 * throughout channels.
 */
class GPUProcessor {

  constructor() {
    this.irArray_ = null;
    this.adapter_ = null;
    this.device_ = null;
  }

  async initialize () {
    this.adapter_ = await navigator.gpu.requestAdapter();
    this.device_ = await this.adapter_.requestDevice();
  }

  setIRArray (irFloat32Array) {
    this.irArray_ = irFloat32Array;
  }

  async processBypass (input) {
    // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
    const gpuWriteBuffer = this.device_.createBuffer({
        mappedAtCreation: true,
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE
    });

    // Write data to the GPUWriteBuffer first and unmap so that it can be used
    // later for copying.
    const arrayBuffer = gpuWriteBuffer.getMappedRange();
    new Float32Array(arrayBuffer).set(input);
    gpuWriteBuffer.unmap();

    // Create a compute buffer that is used for storing computed data.
    const gpuComputeBuffer = this.device_.createBuffer({
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    gpuComputeBuffer.unmap();

    // Compute shader code defining the group, bindings and the WORKGROUP_SIZE
    // needed to parallelize the work.
    const computeModule = this.device_.createShaderModule({
      code: `
        @group(0) @binding(0)
        var<storage, read> input: array<f32>;

        @group(0) @binding(1)
        var<storage, read_write> output: array<f32>;

        @compute @workgroup_size(${WORKGROUP_SIZE})
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
          output[global_id.x] = input[global_id.x] * 0.1;
        }
      `
    });

    // Create a compute pipeline with the layout and compute defined.
    const computePipeline = this.device_.createComputePipeline({
      layout : "auto",
      compute: {
        module: computeModule,
        entryPoint: "main",
      }
    });

    const bindGroup = this.device_.createBindGroup({
      layout: computePipeline.getBindGroupLayout(/*index=*/0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: gpuWriteBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: gpuComputeBuffer
          }
        }
      ]
    });

    // Create a commandEncoder that is responsible for running the commands
    // inside the GPU.
    const commandEncoder = this.device_.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    const workgroup_size = Math.ceil(FRAME_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroup_size);
    computePass.end();

    const gpuReadBuffer = this.device_.createBuffer({
      size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
      
    // Encode commands for copying from the compute to the read buffer.
    commandEncoder.copyBufferToBuffer(
        gpuComputeBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT);

    // Submit copy commands.
    const gpuCommandsEnd = commandEncoder.finish();
    this.device_.queue.submit([ gpuCommandsEnd ]);

    // Read the buffer back from GPU device and return data.
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = gpuReadBuffer.getMappedRange();
    return new Float32Array(copyArrayBuffer);
  }

  // TODO: Currently not used. Enable this when IR selection is implemented.
  async processConvolution (input) {
    let modified_input = new Float32Array(input.length + this.irArray_.length);
    for(let i = 0; i < modified_input.length; i++) {
      modified_input[i] = (i < input.length) ? input[i] : 0;
    }

    const inputDataBuffer = this.device_.createBuffer({
      mappedAtCreation: true,
      size: modified_input.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE
    });
    const inputArrayBuffer = inputDataBuffer.getMappedRange();
    new Float32Array(inputArrayBuffer).set(modified_input);
    inputDataBuffer.unmap();

    const gpuImpulseBuffer = this.device_.createBuffer({
      mappedAtCreation: true,
      size: this.irArray_.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE
    });
    const impulseArray = gpuImpulseBuffer.getMappedRange();
    new Float32Array(impulseArray).set(this.irArray_);
    gpuImpulseBuffer.unmap();

    const gpuComputeBuffer = this.device_.createBuffer({
      size: modified_input.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    gpuComputeBuffer.unmap();

    const computeModule = this.device_.createShaderModule({
      code: `
        @group(0) @binding(0)
        var<storage, read_write> input: array<f32>;

        @group(0) @binding(1)
        var<storage, read> impulse: array<f32>;

        @group(0) @binding(2)
        var<storage, read_write> output: array<f32>;

        @compute @workgroup_size(256)
        fn convolute(@builtin(global_invocation_id) global_id : vec3<u32>) {
          if(global_id.x > arrayLength(&input) - 1) {
              // Out of bounds.
              return;
          }

          for(var i = 0u; i < arrayLength(&input) - 1; i = i + 1u) {
              output[i] = 0.0;
              for(var j = 0u; j < arrayLength(&impulse); j = j + 1u) {
                  output[i] = output[i] + input[i - j] * impulse[j];
              }
          }
        }
      `,
    });

    // Create a compute pipeline with the layout and compute defined.
    const computePipeline = this.device_.createComputePipeline({
      layout : 'auto',
      compute: {
        module: computeModule,
        entryPoint: 'convolute',
      }
    });

    const bindGroup = this.device_.createBindGroup({
      layout: computePipeline.getBindGroupLayout(/*index=*/0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: inputDataBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: gpuImpulseBuffer
          }
        },
        {
          binding: 2,
          resource: {
            buffer: gpuComputeBuffer
          }
        }
      ]
    });
      
    const commandEncoder = this.device_.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    const workgroup_size = Math.ceil(modified_input.length / 256);
    computePass.dispatchWorkgroups(workgroup_size);
    computePass.end();

    const gpuReadBuffer = this.device_.createBuffer({
      size: modified_input.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
      
    // Encode commands for copying from the compute to the read buffer.
    commandEncoder.copyBufferToBuffer(
        gpuComputeBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        modified_input.length * Float32Array.BYTES_PER_ELEMENT);

    // Submit copy commands.
    const gpuCommandsEnd = commandEncoder.finish();
    this.device_.queue.submit([ gpuCommandsEnd ]);

    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = gpuReadBuffer.getMappedRange();
    return new Float32Array(copyArrayBuffer);
  }
};

export default GPUProcessor;
