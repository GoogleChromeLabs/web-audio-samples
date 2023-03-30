import GPUProcessor from "../gpu-processor.js";
import IRHelper from "../ir-helper.js"

class TestProcessor {

    constructor() {}
    testConvolution = async(gpuProcessor) => {
        // Create impulse function.
        const input = new Float32Array(20);
        input[0] = 1;

        // Process convolution.
        const output_result = await gpuProcessor.processConvolution(input);

        // Parse outputs.
        const expected_output = IRHelper.createTestIR();
        const first_outputs = output_result.slice(0, expected_output.length);

        // Verify.
        console.assert(first_outputs.toString() === expected_output.toString(), "Expected: "+expected_output+" Received: "+first_outputs);
    }
};

export default TestProcessor;