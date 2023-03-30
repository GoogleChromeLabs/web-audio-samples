import { FRAME_SIZE, WORKGROUP_SIZE } from "./constants.js";

class GPUProcessor {
  constructor() {}

  initialize = async () => {
    if(!navigator.gpu) {
      console.log("Please enable WebGPU");
      return;
    }

    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
  }

  setIRArray (irFloat32Array) {
    this._irArray = irFloat32Array;
    this._irSize = this._irArray.length;
  }

  processInputAndReturn = async(input) => {
    // --------------WRITE TO INPUT BUFFER-------------
    // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
    const gpuWriteBuffer = this.device.createBuffer({
        mappedAtCreation: true,
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE
    });

    // Write data to the GPUWriteBuffer first and unmap so that it can be used later for copying.
    const arrayBuffer = gpuWriteBuffer.getMappedRange();
    new Float32Array(arrayBuffer).set(input);
    gpuWriteBuffer.unmap();

    // --------------COMPUTATION STAGE-----------------
    // Create a compute buffer that is used for storing computed data.
    const gpuComputeBuffer = this.device.createBuffer({
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    gpuComputeBuffer.unmap();


    // Compute shader code defining the group, bindings and the WORKGROUP_SIZE
    // needed to parallelize the work.
    const computeModule = this.device.createShaderModule({
        code: `
          @group(0) @binding(0)
          var<storage, read> input: array<f32>;

          @group(0) @binding(1)
          var<storage, read_write> output: array<f32>;

          @compute @workgroup_size(${WORKGROUP_SIZE})
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            output[global_id.x] = input[global_id.x] * 0.1;
          }
        `,
    });

    // Create a compute pipeline with the layout and compute defined.
    const computePipeline = this.device.createComputePipeline({
        layout : "auto",
        compute: {
          module: computeModule,
          entryPoint: "main",
        }
    });

    const bindGroup = this.device.createBindGroup({
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

    // Create a commandEncoder that is responsible for running the commands inside the GPU.
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    const workgroup_size = Math.ceil(FRAME_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroup_size);
    computePass.end();

    const gpuReadBuffer = this.device.createBuffer({
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
      
    // Encode commands for copying from the compute to the read buffer.
    commandEncoder.copyBufferToBuffer(
        gpuComputeBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT
    );

    // Submit copy commands.
    const gpuCommandsEnd = commandEncoder.finish();
    this.device.queue.submit([ gpuCommandsEnd ]);

    // --------------READ STAGE-----------------
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = gpuReadBuffer.getMappedRange();
    return new Float32Array(copyArrayBuffer);
  }

  processConvolution = async(input) => {
    // INPUT
    const inputDataBuffer = this.device.createBuffer({
        mappedAtCreation: true,
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE
    });
    const inputArrayBuffer = inputDataBuffer.getMappedRange();
    new Float32Array(inputArrayBuffer).set(input);
    inputDataBuffer.unmap();

    const gpuImpulseBuffer = this.device.createBuffer({
        mappedAtCreation: true,
        size: this._irSize * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE
    });
    const impulseArray = gpuImpulseBuffer.getMappedRange();
    new Float32Array(impulseArray).set(this._irArray);
    gpuImpulseBuffer.unmap();

    // COMPUTE
    const gpuComputeBuffer = this.device.createBuffer({
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    gpuComputeBuffer.unmap();

    const computeModule = this.device.createShaderModule({
        code: `
          @group(0) @binding(0)
          var<storage, read> input_music: array<f32>;

          @group(0) @binding(1)
          var<storage, read> impulse: array<f32>;

          @group(0) @binding(2)
          var<storage, read_write> output: array<f32>;

          @compute @workgroup_size(${this._irSize})
          fn convolute(@builtin(global_invocation_id) global_id : vec3<u32>) {
            if(global_id.x > arrayLength(&input_music) - 1) {
                // Out of bounds.
                return;
            }

            if(arrayLength(&impulse) > arrayLength(&input_music)) {
                return;
            }

            for(var i = 0u; i < arrayLength(&input_music); i = i + 1u) {
                var result = 0.0;
                for(var j = 0u; j < arrayLength(&impulse); j = j + 1u) {
                    result = result + input_music[i - j] * impulse[j];
                }
                output[i] = result;
            }
          }
        `,
    });

    // Create a compute pipeline with the layout and compute defined.
    const computePipeline = this.device.createComputePipeline({
        layout : "auto",
        compute: {
          module: computeModule,
          entryPoint: "convolute",
        }
    });

    const bindGroup = this.device.createBindGroup({
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
      
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    const workgroup_size = Math.ceil(FRAME_SIZE / this._irSize);
    computePass.dispatchWorkgroups(workgroup_size);
    computePass.end();

    const gpuReadBuffer = this.device.createBuffer({
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
      
    // Encode commands for copying from the compute to the read buffer.
    commandEncoder.copyBufferToBuffer(
        gpuComputeBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT
    );

    // Submit copy commands.
    const gpuCommandsEnd = commandEncoder.finish();
    this.device.queue.submit([ gpuCommandsEnd ]);

    // --------------READ STAGE-----------------
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = gpuReadBuffer.getMappedRange();
    return new Float32Array(copyArrayBuffer);
  }
};

export default GPUProcessor;
