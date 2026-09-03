const filePath = {
  ping: '../../sounds/fx/filter-noise-2.wav',
  impulse: '../../sounds/impulse-responses/cardiod-true-stereo-15-8.wav'
};

class AudioNodeCounter {

  constructor () {
    this.nodeCounts_ = {
      BiquadFilter: 0,
      BufferSource: 0,
      DynamicsCompressor: 0,
      Convolver: 0,
      Gain: 0,
      Panner: 0
    };

    this.changed_ = false;
  }

  addNode (nodeType) {
    this.nodeCounts_[nodeType]++;
    this.changed_ = true;
  }

  getNodeCounts () {
    this.changed_ = false;
    return this.nodeCounts_;
  }

  isChanged () {
    return this.changed_;
  }

}


/**
 * Harmful globals.
 */
let context;
let convolver;
let compressor;
let pingBuffer;
let gCount = 0;

let gNodeCounter = new AudioNodeCounter();

/**
 * Collision event callback.
 * @param  {[type]} body1 [description]
 * @param  {[type]} body2 [description]
 * @return {[type]}       [description]
 */
function countContact(body1, body2) {
  gCount++;

  let velocity1 = body1.GetLinearVelocity();
  let velocity2 = body2.GetLinearVelocity();

  let v1 = velocity1.Length();
  let v2 = velocity2.Length();
  let maxV = v1 > v2 ? v1 : v2;

  // base volume on velocity
  let xx = maxV / 150.0;  // 200.0;
  if (xx > 1.0) xx = 1.0;
  if (xx < 0.0) xx = 0.0;
  // let s = Math.sin(0.5 * xx * Math.PI);
  let s = xx;
  s = s * s;
  let gain = s;

  let position1 = body1.GetCenterPosition();
  let position2 = body2.GetCenterPosition();
  let x = v1 > v2 ? position1.x : position2.x;
  let y = position1.y;

  if (gCount > 0) {
    let ping = context.createBufferSource();
    gNodeCounter.addNode('BufferSource');

    if (ping) {
      let isQuiet = (gain < 0.5);
      ping.buffer = pingBuffer;  // isQuiet ? quietBuffer : pingBuffer;

      // Use biquad filter API if available.
      let filter = context.createBiquadFilter();
      let panner = context.createPanner();
      gNodeCounter.addNode('BiquadFilter');
      gNodeCounter.addNode('Panner');

      // Create inputs to dry/wet mixers
      let dryGainNode = context.createGain();
      let wetGainNode = context.createGain();
      gNodeCounter.addNode('Gain');
      gNodeCounter.addNode('Gain');

      ping.connect(filter);
      filter.connect(panner);
      panner.connect(dryGainNode);
      dryGainNode.connect(compressor);

      panner.connect(wetGainNode);
      wetGainNode.connect(convolver);

      wetGainNode.gain.value = gain < 0.125 ? 0.15 : 0.1;
      dryGainNode.gain.value = gain;  // isQuiet ? 0.0 : gain;

      // Randomize pitch
      let r = Math.random();
      let cents = 600.0 * (r - 0.5);
      let rate = Math.pow(2.0, cents / 1200.0);
      ping.playbackRate.value = rate;

      // Adjust filter
      let value = 0.5 + 0.5 * xx;
      let noctaves = Math.log(22050.0 / 40.0) / Math.LN2;
      let v2 = Math.pow(2.0, noctaves * (value - 1.0));

      let sampleRate = 44100.0;
      let nyquist = sampleRate * 0.5;

      filter.frequency.value = v2 * nyquist;
      filter.Q.value = 10.0;  // this is actually resonance in dB

      let azimuth = 0.5 * Math.PI * (x - 200.0 /*250.0*/) / 150.0;
      if (azimuth < -0.5 * Math.PI) azimuth = -0.5 * Math.PI;
      if (azimuth > 0.5 * Math.PI) azimuth = 0.5 * Math.PI;

      let posX = 10.0 * Math.sin(azimuth);
      let posZ = 10.0 * Math.cos(azimuth);

      let elevation = -0.5 * Math.PI * (y - 250.0) / 150.0;
      if (elevation < -0.5 * Math.PI) elevation = -0.5 * Math.PI;
      if (elevation > 0.5 * Math.PI) elevation = 0.5 * Math.PI;

      let scaleY = Math.sin(elevation);
      let scaleXZ = Math.cos(elevation);
      posX *= scaleXZ;
      posZ *= scaleXZ;
      let posY = scaleY * 10.0;

      panner.setPosition(posX, posY /*0*/, isQuiet ? +posZ : -posZ);

      ping.start(0);
    }
  }
}


/**
 * [mixToMono description]
 * @param  {[type]} buffer [description]
 * @return {[type]}        [description]
 */
function mixToMono(buffer) {
  if (buffer.numberOfChannels == 2) {
    let pL = buffer.getChannelData(0);
    let pR = buffer.getChannelData(1);
    let length = buffer.length;

    for (let i = 0; i < length; ++i) {
      let mono = 0.5 * (pL[i] + pR[i]);
      pL[i] = mono;
      pR[i] = mono;
    }
  }
}


/**
 * [loadPing description]
 * @param  {[type]} url [description]
 * @return {[type]}     [description]
 */
function loadPing(url) {
  // Load asynchronously
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    context.decodeAudioData(
        request.response,
        function(buffer) {
          mixToMono(buffer);
          pingBuffer = buffer;
        },
        function(buffer) {
          console.log('Error decoding ping!');
        });
  };

  request.send();
}


/**
 * [loadImpulseResponse description]
 * @param  {[type]} url [description]
 * @return {[type]}     [description]
 */
function loadImpulseResponse(url) {
  // Load impulse response asynchronously
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    context.decodeAudioData(
        request.response,
        function(buffer) {
          convolver.buffer = buffer;
        },
        function(buffer) {
          console.log('Error decoding impulse response!');
        });
  };

  request.send();
}


/**
 * Entry point.
 */
function initWebAudio() {
  context = new AudioContext();

  if (context.createDynamicsCompressor) {
    // Create dynamics compressor to sweeten the overall mix.
    compressor = context.createDynamicsCompressor();
    gNodeCounter.addNode('DynamicsCompressor');

    compressor.connect(context.destination);
  } else {
    // Compressor is not available on this implementation - bypass and simply
    // point to destination.
    compressor = context.destination;
  }

  convolver = context.createConvolver();
  gNodeCounter.addNode('Convolver');

  convolver.connect(compressor);

  pingBuffer = 0;
  loadPing(filePath.ping);
  loadImpulseResponse(filePath.impulse);
}
