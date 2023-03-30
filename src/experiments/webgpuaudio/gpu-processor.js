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

    // Get a GPU buffer for reading in an unmapped state.
    const gpuComputeBuffer = this.device.createBuffer({
        mappedAtCreation: false,
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const computeModule = this.device.createShaderModule({
        code: `
          @group(0) @binding(0)
          var<storage, read> input: array<f32>;

          @group(0) @binding(1)
          var<storage, read_write> output: array<f32>;

          @compute @workgroup_size(1)
          fn computeMain(@builtin(global_invocation_id) global_id : vec3<u32>) {
            output[global_id.x] = input[global_id.x] * 0.1;
          }
        `,
    });

    const computePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: computeModule,
          entryPoint: 'computeMain',
        }
    });

    const bindGroup = this.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [{
        binding: 0,
        resource: { buffer: gpuWriteBuffer }
        }, {
        binding: 1,
        resource: { buffer: gpuComputeBuffer }
        }]
    });


    // const arrayBuffer = gpuWriteBuffer.getMappedRange();

    // // Write bytes to buffer.
    // new Float32Array(arrayBuffer).set(input);

    // // Unmap buffer so that it can be used later for copy.
    // gpuWriteBuffer.unmap();

    this.device.queue.writeBuffer(gpuWriteBuffer, 0, input);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(FRAME_SIZE);
    pass.end();
    this.device.queue.submit([ encoder.finish() ]);

    const gpuReadBuffer = this.device.createBuffer({
        size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
      
    // Encode commands for copying buffer to buffer.
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
        gpuComputeBuffer /* source buffer */,
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
    console.log(new Float32Array(copyArrayBuffer));
    // .map(sample => 0.1 * sample)

    return new Float32Array(copyArrayBuffer);
  }
};

export default GPUProcessor;