import TestProcessor from "./test_processor.js"

let convolutionTestButton = null;
let testProcessor = new TestProcessor();


const toggleConvolutionTestHandler = async() => {
    convolutionTestButton.disabled = true;
    let testResult = await testProcessor.testConvolution();
    convolutionTestButton.disabled = false;
};

window.addEventListener('load', () => {
    convolutionTestButton = document.getElementById('test-gpu-convolution');
    convolutionTestButton.onclick = toggleConvolutionTestHandler;
    convolutionTestButton.disabled = false;
})