import GPUProcessor from "../gpu-processor.js";

class TestProcessor {

    constructor() {}
    testConvolution = async(gpuProcessor) => {
        // Create impulse function.
        const input = new Float32Array(2560);
        input[0] = 1;

        // Create convolution function.
        const impulse = new Float32Array([1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]);

        // Do convolution.
        const output_result = await gpuProcessor.processConvolution(input, impulse);

        // Parse outputs.
        const first_ten_output = output_result.slice(0, impulse.length);

        console.log(first_ten_output);
        console.log(impulse);

        // Verify.
        console.assert(first_ten_output.toString() === impulse.toString(), "Expected: "+impulse+" Received: "+first_ten_output);
    }
};

export default TestProcessor;