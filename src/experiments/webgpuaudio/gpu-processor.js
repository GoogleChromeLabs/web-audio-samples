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

    this.gpuWriteBuffer = this.device.createBuffer({
      mappedAtCreation: true,
      size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_WRITE
    });
    this.gpuReadBuffer = this.device.createBuffer({
      size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });


    const noiseShaderModule = this.device.createShaderModule({
        code: `
          @group(0) @binding(0)
          var<storage, read> input: array<f32>;

          @group(0) @binding(1)
          var<storage, read_write> output: array<f32>;

          @compute @workgroup_size(1)
          fn computeMain(@builtin(global_invocation_id) global_id : vec3<u32>) {
            output[global_id.x] = input[global_id.x];
          }
        `,
      });

    this.noisePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: noiseShaderModule,
          entryPoint: 'computeMain',
        }
    });

    this.bindGroup = this.device.createBindGroup({
        layout: this.noisePipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: { buffer: this.gpuWriteBuffer }
        }, {
          binding: 1,
          resource: { buffer: this.gpuReadBuffer }
        }]
      });
  }

  process = async (input) => {
    this.device.queue.writeBuffer(this.gpuWriteBuffer, 0, input);
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.noisePipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(FRAME_SIZE);
    pass.end();
    this.device.queue.submit([ encoder.finish() ]);
    console.log("Input fine");

    return input.map(sample => 0.1 * sample);
  }
};

export default GPUProcessor;