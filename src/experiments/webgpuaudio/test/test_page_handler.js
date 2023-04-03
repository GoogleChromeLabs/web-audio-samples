import TestProcessor from "./test_processor.js"

/**
 * A simple file that handles everything that happens on
 * http://localhost:8080/experiments/webgpuaudio/test/. To set up a new test:
 * 
 * 1. Add the test function in test_processor.js.
 * 2. Create a table entry in test/index.html by adding new <tr> and <td> fields.
 *    See the test-gpu-convolution id and class to see how it is done. 
 * 3. The handler should follow a similar logic (won't be async if the thing under test
 *    is not async):
 *         const newTestHandler = async() => {
 *           newTestButton.disabled = true;
 *           let testResult = await testProcessor.testStuff();
 *           populateTestResult(newTestElements, testResult);
 *           newTestButton.disabled = false;
 *         }
 *  4. Hook up the test handler to the button inside the load function.
 *       window.addEventListener('load', () => {
 *         // old tests.
 *         newTestButton = document.getElementById('test-id');
 *         newTestElements = document.getElementsByClassName('test-id')[0].childNodes;
 *         newTestButton.onclick = newTestHandler;
 *         newTestButton.disabled = false;
 * 
 * 
 *         // new tests go here.
 *       })  
 * 
 * 
 * Things to keep in mind:
 * 1. The span elements can be copied over as expected. DO NOT MODIFY
 *    the id names of the span fields, or the CSS will not work.
 * 2. Each test should have the same name in the button.id and div.class fields.
 * 3. Different tests should have different ids so as to not overlap with other
 *    tests.
 */

let convolutionTestButton = null;
let convolutionTestElements = [];
let testProcessor = new TestProcessor();

function populateTestResult(tableStatusElements, testPassed) {
    tableStatusElements.forEach(element => {
        if(element.nodeName == "#text") {
            return;
        }

        if(element.id == "idle") {
            element.hidden = true;
        } else if(element.id == "cross" && !testPassed) {
            element.hidden = false;
        } else if(element.id == "check" && testPassed) {
            element.hidden = false;
        }
    });
};

const toggleConvolutionTestHandler = async() => {
    convolutionTestButton.disabled = true;
    let testPassed = await testProcessor.testConvolution();
    populateTestResult(convolutionTestElements, testPassed);
    convolutionTestButton.disabled = false;
};

window.addEventListener('load', () => {
    convolutionTestButton = document.getElementById('test-gpu-convolution');
    convolutionTestElements = document.getElementsByClassName('test-gpu-convolution')[0].childNodes;
    convolutionTestButton.onclick = toggleConvolutionTestHandler;
    convolutionTestButton.disabled = false;
})