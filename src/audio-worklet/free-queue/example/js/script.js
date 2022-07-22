// ***** Tests *****

let secureContext = window.isSecureContext;
let crossOriginIsolated = window.crossOriginIsolated;
let SharedArrayBufferAvailable = window.SharedArrayBuffer !== undefined
let AudioWorkletAvailable = window.AudioWorklet !== undefined
let WebAssemblyAvailable = window.WebAssembly !== undefined


const toogle_button = document.getElementById('toogle');
const checksTable = document.getElementById('checks');

let checks = [
    ["Secure Context", secureContext],
    ["Cross Origin Isolated", crossOriginIsolated],
    ["SharedArrayBuffer", SharedArrayBufferAvailable],
    ["AudioWorklet", AudioWorkletAvailable],
    ["WebAssembly", WebAssemblyAvailable]
]

checks.forEach(check => {
    checksTable.innerHTML += `
        <tr>
            <td>${check[0]}</td>
            <td>${check[1] ? "✔️" : "❌" }</td>
        </tr>
    `
})

if (checks.every(check => check[1])) {
    toogle_button.disabled = false;
}

// *****************


let worker = new Worker(new URL('./worker.js', import.meta.url), { type: "module" });


let audioContext;
let playing = false;

worker.onmessage = (msg) => {
    const { fq, state } = msg.data;
    toogle_button.onclick = async () => {
        if (audioContext === undefined) {
            audioContext = new AudioContext();
            await audioContext.audioWorklet.addModule(new URL('./sink_processor.js', import.meta.url));
            const sink_processor = new AudioWorkletNode(audioContext, 'sink_processor', {
                processorOptions: { fq, state }
            })
            sink_processor.connect(audioContext.destination);
            playing = true;
        } else {
            if (playing) {
                audioContext.suspend();
                playing = false;
            } else {
                audioContext.resume();
                playing = true;
            }
        }
        if (playing) {
            toogle_button.style.backgroundColor = "#00ff22";
        } else {
            toogle_button.style.backgroundColor = "#f35858";    
        }
    }
}
worker.onerror = (error) => console.log(error);

