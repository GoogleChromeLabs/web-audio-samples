// In cents
const CUTOFF_OFFSET_CENTS = 9600;
const FILTER_MOD_OFFSET_CENTS = 7200;

export class Note {
  constructor(noteData) {
    const { context, periodicWaves, params, destination } = noteData;
    
    this.context = context;

    const oscOptions1 = {type: 'custom', periodicWave: periodicWaves[0]};
    this.osc1 = new OscillatorNode(context, oscOptions1);
    this.osc1Octave = new OscillatorNode(context, oscOptions1);
    const oscOptions2 = {type: 'custom', periodicWave: periodicWaves[1]};
    this.osc2 = new OscillatorNode(context, oscOptions2);
    this.osc2Octave = new OscillatorNode(context, oscOptions2);
    this.panner1 = new PannerNode(context, {panningModel: 'equalpower'});
    this.panner2 = new PannerNode(context, {panningModel: 'equalpower'});
    this.ampEnv = new GainNode(context, {gain:0.0});
    this.biquad = new BiquadFilterNode(context, {type:'lowpass'});
    this.volume = new GainNode(context, {gain:0.0});

    this.detune1 = 0.0;
    this.detune2 = 0.0;
    this.filterCutoff = 0.5;
    this.filterResonance = 6.0;
    this.filterAmount = 0.5;
    this.filterAttack = 0.020;
    this.filterDecay = 0.500;
    this.ampAttack = 0.020;
    this.ampDecay = 0.500;
    this.width = 0.5;
    this.setParams(params);

    this.osc1.connect(this.panner1).connect(this.ampEnv).connect(this.biquad);
    this.osc2.connect(this.panner2).connect(this.ampEnv);
    this.biquad.connect(this.volume);
    this.volume.connect(destination);

    this.volume.gain.value = 0.1;
  }

  setParams(params) {
    for (const key in params) {
      if (Object.hasOwnProperty.call(this, key)) {
        this[key] = params[key];
        // console.log(key, this[key]);
      }
    }
  }

  play(semitone, octave, time) {
    // console.log('[NOTE] play: ', semitone, octave, time);
    // Calculate the fundamental frequency from semitone.
    this.pitchFrequency = 20.0 * Math.pow(2.0, semitone / 12.0);

    const osc1Freq = this.pitchFrequency * Math.pow(2.0, -this.detune1 / 1200);
    const osc1OctaveFreq =
        this.pitchFrequency * Math.pow(2.0, octave - this.detune2 / 1200);
    const osc2Freq = this.pitchFrequency * Math.pow(2.0, this.detune1 / 1200);
    const osc2OctaveFreq =
        this.pitchFrequency * Math.pow(2.0, octave + this.detune2 / 1200);
    this.osc1.frequency.setValueAtTime(osc1Freq, time);
    this.osc1Octave.frequency.setValueAtTime(osc1OctaveFreq, time);
    this.osc2.frequency.setValueAtTime(osc2Freq, time);
    this.osc2Octave.frequency.setValueAtTime(osc2OctaveFreq, time);

    // Convert the width spread to a pan value between -90 ~ +90 degrees.
    const x = Math.sin(0.5 * Math.PI * this.width);
    const z = -Math.cos(0.5 * Math.PI * this.width);
    this.panner1.positionX.linearRampToValueAtTime(-x, time);
    this.panner1.positionZ.linearRampToValueAtTime(z, time);
    this.panner2.positionX.linearRampToValueAtTime(x, time);
    this.panner2.positionX.linearRampToValueAtTime(z, time);

    this.ampEnv.gain.cancelScheduledValues(0);
    this.ampEnv.gain.setValueAtTime(0.0, time);
    const decayStartTime = time + this.ampAttack;
    this.ampEnv.gain.setTargetAtTime(1, time, this.ampAttack);
    this.ampEnv.gain.setTargetAtTime(0, decayStartTime, this.ampDecay);

    this.biquad.frequency.cancelScheduledValues(0);
    const nyquistFrequency = this.context.sampleRate / 2;
    const cutoffRate =
        Math.pow(2, CUTOFF_OFFSET_CENTS * this.filterCutoff / 1200);
    const startFrequency =
        Math.min(nyquistFrequency, cutoffRate * this.pitchFrequency);
    const filterAmountRate =
        Math.pow(2, FILTER_MOD_OFFSET_CENTS * this.filterAmount / 1200.0);
    const filterAmountFrequency =
        Math.min(nyquistFrequency, filterAmountRate * startFrequency);

    this.biquad.frequency.setValueAtTime(startFrequency, time);
    this.biquad.frequency.setTargetAtTime(
        filterAmountFrequency, time, this.filterAttack);
    this.biquad.frequency.setTargetAtTime(
        startFrequency, time + this.filterAttack, this.filterDecay);

    this.biquad.Q.setValueAtTime(this.filterResonance, time);

    this.osc1.start(time);
    this.osc2.start(time);
    this.osc1Octave.start(time);
    this.osc2Octave.start(time);

    const decayEndTime = decayStartTime + 1.0; // 0.1 ~ 4.0
    this.osc1.stop(decayEndTime);
    this.osc2.stop(decayEndTime);
    this.osc1Octave.stop(decayEndTime);
    this.osc2Octave.stop(decayEndTime);

    setTimeout(() => {
      this.volume.disconnect();
    }, (decayEndTime + 1.0) * 1000);
  }
};