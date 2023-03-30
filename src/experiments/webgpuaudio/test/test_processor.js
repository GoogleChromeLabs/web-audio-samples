import GPUProcessor from "../gpu-processor.js";
import IRHelper from "../ir-helper.js"

class TestProcessor {
    constructor() {}
    async testConvolution() {
        const test_ir = IRHelper.createTestIR();
        let gpuProcessor = new GPUProcessor();
        gpuProcessor.setIRArray(test_ir);
        await gpuProcessor.initialize();

        // Create impulse function.
        const input = new Float32Array(20);
        input[0] = 1;

        // Process convolution.
        const output_result = await gpuProcessor.processConvolution(input);

        // Parse outputs.
        const output_ir_size = output_result.slice(0, test_ir.length);

        // Verify.
        console.assert(output_ir_size.toString() === test_ir.toString(), "Test: testConvolution, Expected output : "+test_ir.toString()+" Received output: "+output_ir_size.toString());
    }
};

export default TestProcessor;