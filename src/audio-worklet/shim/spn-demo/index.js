const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

let isRecording = false,
    isMonitoring = false,
    visualizationEnabled = true;

const BUFFER_SIZE = 256;

// TODO: Refactor as buffers
let recordingBuffer,
    streamSampleRate,
    currData = new Array(2).fill([]),
    recordLength = 0;

const ls = async (x) => console.log(await x);

document.addEventListener("DOMContentLoaded", init);

// TODO comment as necessary
async function init() {
    if (context.state === "suspended") {
        context.resume();
    }

    // Create intermediary nodes
    // TODO remove medians?
    const liveAnalyserNode = await new AnalyserNode(context, {
        fftSize: 128,
    });

    const recordingAnalyserNode = await new AnalyserNode(context, {
        fftSize: 128,
    });
    const monitorNode = context.createGain();
    const medianStart = context.createGain();
    const medianEnd = context.createGain();

    // Setup mic and processor
    const micStream = await setupMic(medianStart);
    streamSampleRate = await micStream.getAudioTracks()[0].getSettings()
        .sampleRate;

    recordingBuffer = context.createBuffer(
        2,
        streamSampleRate * 5,
        streamSampleRate,
    );

    const spNode = setupScriptProcessor(micStream, medianStart);

    ls(streamSampleRate);

    // Setup components
    setupMonitor(monitorNode);
    setupRecording();
    setupVisualizers(liveAnalyserNode);

    // Mic to proces
    medianStart
        .connect(medianEnd)
        .connect(liveAnalyserNode)
        .connect(monitorNode)
        .connect(context.destination);

    // Separate out for SP. Thru SP to dest only doesn't output any audio
    // NEVERMIND I DIDNT SET OUTPUT
    // https://github.com/WebAudio/web-audio-api/issues/345
    medianEnd.connect(spNode).connect(context.destination);

    // Watch Context Status

    const setStatusText = (text) =>
        (document.querySelector("#ctx-status").innerHTML = text);
    context.addEventListener("statechange", (e) =>
        setStatusText(context.state),
    );
    setStatusText(context.state);
}

function setupScriptProcessor(stream, attachNode) {
    const micSource = context.createMediaStreamSource(stream);

    micSource.connect(attachNode);

    const processor = context.createScriptProcessor(BUFFER_SIZE);

    // Callback for ScriptProcessorNode.
    processor.onaudioprocess = function (e) {
        // Just pushes data to dataArr and currData
        for (let i = 0; i < currData.length; i++) {
            currData[i] = e.inputBuffer.getChannelData(i);

            if (isRecording)
                recordingBuffer.copyToChannel(currData[i], i, recordLength);
        }

        if (isRecording) {
            recordLength += BUFFER_SIZE;
        }
    };

    return processor;
}

async function setupMic() {
    // Triggered when mic is selected

    const at20 =
        "7c142e20af72ddc0bb42359c74b7693031ac4cf27870749f0f53553d15fd6c8f";

    return await navigator.mediaDevices.getUserMedia({
        audio: {
            deviceId: at20,
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
            latency: 0,
        },
    });
}
// AUDIO

/**
 * Sets up monitor feature (listen to mic live) and handles gain changes
 */
function setupMonitor(monitorNode) {
    monitorNode.gain.value = 0;

    const updateMonitorGain = (enabled) => {
        const newVal = enabled ? 1 : 0;
        monitorNode.gain.setTargetAtTime(newVal, context.currentTime, 0.01);
    };

    // Controls
    const monitorButton = document.querySelector("#monitor"),
        monitorText = monitorButton.querySelector("span");

    monitorButton.addEventListener("click", (e) => {
        isMonitoring = !isMonitoring;
        updateMonitorGain(isMonitoring);
        monitorText.innerHTML = isMonitoring ? "off" : "on";
    });
}

/**
 * Setup Recording
 */
function setupRecording() {
    const recordButton = document.querySelector("#record"),
        recordText = recordButton.querySelector("span"),
        player = document.querySelector("#player"),
        downloadButton = document.querySelector("#download");

    recordButton.addEventListener("click", (e) => {
        isRecording = !isRecording;

        recordText.innerHTML = isRecording ? "Stop" : "Start";

        // Call
        if (!isRecording) {
            const wavUrl = getWavFromData();
            drawRecordingVis();

            document.querySelector("#data-len").innerHTML = recordLength;
            // Update player and download file src
            player.src = wavUrl;
            downloadButton.src = wavUrl;
            downloadButton.download = "recording.wav";
        }
    });
}

/** Finalize current clip recording */
function getWavFromData() {
    const getWavBytes = (buffer, options) => {
        const type = options.isFloat ? Float32Array : Uint16Array;
        const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT;

        ls([numFrames, buffer.byteLength, type.BYTES_PER_ELEMENT]);

        const headerBytes = getWavHeader(
            Object.assign({}, options, { numFrames }),
        );
        const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

        // prepend header, then add pcmBytes
        wavBytes.set(headerBytes, 0);
        wavBytes.set(new Uint8Array(buffer), headerBytes.length);

        return wavBytes;
    };

    // adapted from https://gist.github.com/also/900023
    // returns Uint8Array of WAV header bytes
    const getWavHeader = (options) => {
        const numFrames = options.numFrames;
        const numChannels = options.numChannels || 2;
        const sampleRate = options.sampleRate || streamSampleRate || 44100;
        const bytesPerSample = options.isFloat ? 4 : 2;
        const format = options.isFloat ? 3 : 1;

        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = numFrames * blockAlign;

        const buffer = new ArrayBuffer(44);
        const dv = new DataView(buffer);

        let p = 0;

        function writeString(s) {
            for (let i = 0; i < s.length; i++) {
                dv.setUint8(p + i, s.charCodeAt(i));
            }
            p += s.length;
        }

        function writeUint32(d) {
            dv.setUint32(p, d, true);
            p += 4;
        }

        function writeUint16(d) {
            dv.setUint16(p, d, true);
            p += 2;
        }

        writeString("RIFF"); // ChunkID
        writeUint32(dataSize + 36); // ChunkSize
        writeString("WAVE"); // Format
        writeString("fmt "); // Subchunk1ID
        writeUint32(16); // Subchunk1Size
        writeUint16(format); // AudioFormat https://i.stack.imgur.com/BuSmb.png
        writeUint16(numChannels); // NumChannels
        writeUint32(sampleRate); // SampleRate
        writeUint32(byteRate); // ByteRate
        writeUint16(blockAlign); // BlockAlign
        writeUint16(bytesPerSample * 8); // BitsPerSample
        writeString("data"); // Subchunk2ID
        writeUint32(dataSize); // Subchunk2Size

        return new Uint8Array(buffer);
    };

    // Get sample array from dataArr
    const [left, right] = [
        recordingBuffer.getChannelData(0),
        recordingBuffer.getChannelData(1),
    ];

    // Interleave audio into a 1d stream
    const interleaved = new Float32Array(left.length + right.length);
    for (let src = 0, dst = 0; src < left.length; src++, dst += 2) {
        interleaved[dst] = left[src];
        interleaved[dst + 1] = right[src];
    }

    // get WAV file bytes and audio params of your audio source
    const wavBytes = getWavBytes(interleaved.buffer, {
        isFloat: true, // floating point or 16-bit integer
        numChannels: 2,
        sampleRate: streamSampleRate,
    });

    const wavBlob = new Blob([wavBytes], { type: "audio/wav" }),
        wavUrl = URL.createObjectURL(wavBlob, {
            type: "audio/wav",
        });

    return wavUrl;
}

/** Setup all visualizers.  */
function setupVisualizers(analyserNode) {
    setupGainVis();
    setupLiveAnalyserVis(analyserNode);

    const visToggle = document.querySelector("#viz-toggle");
    visToggle.addEventListener("click", (e) => {
        visualizationEnabled = !visualizationEnabled;
        visToggle.querySelector("span").innerHTML = visualizationEnabled
            ? "Pause"
            : "Play";
    });
}

/**
 * Script Processor Frequency Visualizer
 */
const setupGainVis = () => {
    const canvas = document.querySelector("#live-canvas");
    const bufferLength = currData.length;

    const width = canvas.width,
        height = canvas.height;

    const canvasContext = canvas.getContext("2d");

    // save buffer as data
    let currX = 0;

    const draw = () => {
        if (!visualizationEnabled || !currData) return;

        let loudness =
                currData[0].reduce((e, a) => a + e, 0) / currData[0].length,
            centerY = ((1 - loudness) * height) / 2;

        canvasContext.fillStyle = "red";
        canvasContext.fillRect(currX, centerY, 1, 1);

        canvasContext.fillStyle = "black";
        canvasContext.fillRect(currX, centerY, 1, loudness * height);

        if (currX < width - 1) {
            currX++;
        } else {
            currX = 0;
        }

        canvasContext.fillStyle = "rgba(255,255,255,.8)";
        canvasContext.fillRect(currX + 1, 0, 1, height);
        canvasContext.fillStyle = "black";
        canvasContext.fillRect(currX - 1, centerY, 1, 1);

        requestAnimationFrame(draw);
    };

    draw();
};

/**
 * Analyser Frequency Visualizer
 */
function setupLiveAnalyserVis(analyserNode) {
    const canvas = document.querySelector("#analyzer-vis"),
        canvasContext = canvas.getContext("2d");

    const bufferLength = analyserNode.frequencyBinCount;

    const width = canvas.width,
        height = canvas.height,
        barWidth = width / bufferLength;

    function draw() {
        if (!visualizationEnabled) return;

        canvasContext.clearRect(0, 0, width, height);

        // save buffer as data

        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        dataArray.forEach((item, index) => {
            const y = (item / 255) * height * 0.9;
            const x = barWidth * index;

            canvasContext.fillStyle = `hsl(${
                (y / height) * 2 * 200
            }, 100%, 50%)`;
            canvasContext.fillRect(x, height - y, barWidth, y);
        });

        requestAnimationFrame(draw);
    }

    draw();
}

const drawRecordingVis = () => {
    const canvas = document.querySelector("#recording-canvas");
    const bufferLength = recordLength;

    const width = canvas.width,
        height = canvas.height;

    const canvasContext = canvas.getContext("2d");

    const channelData = recordingBuffer.getChannelData(0);

    // save buffer as data
    let currX = 0;

    const draw = (loudness, offset) => {
        let centerY = ((1 - loudness) * height) / 2;

        canvasContext.fillStyle = "red";
        canvasContext.fillRect(currX, centerY, 1, 1);

        canvasContext.fillStyle = "black";
        canvasContext.fillRect(currX, centerY, 1, loudness * height);

        if (currX < width - 1) {
            currX++;
        } else {
            currX = 0;
        }

        canvasContext.fillStyle = "rgba(255,255,255,.8)";
        canvasContext.fillRect(currX + 1, 0, 1, height);
        canvasContext.fillStyle = "black";
        canvasContext.fillRect(currX - 1, centerY, 1, 1);

        requestAnimationFrame(draw);
    };

    for (let i = 0; i < bufferLength; i += BUFFER_SIZE) {
        let loudness = 0;

        for (let j = i; j < i + BUFFER_SIZE; j++) loudness += channelData[0];

        loudness /= BUFFER_SIZE;

        draw(loudness, i);
    }
    // draw();
};
