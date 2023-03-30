import { FRAME_SIZE } from "./constants.js";

const WORKGROUP_SIZE = 4;

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
    computePass.dispatchWorkgroups(FRAME_SIZE / WORKGROUP_SIZE);
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
