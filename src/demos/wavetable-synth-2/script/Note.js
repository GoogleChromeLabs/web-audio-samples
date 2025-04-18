
export class Note {

  constructor(context, periodicWave, globalEffectInput) {
    this.context = context;

    const oscOptions = {type:'custom', periodicWave};
    this.osc1 = new OscillatorNode(context, oscOptions);
    this.osc1Octave = new OscillatorNode(context, oscOptions);
    this.osc2 = new OscillatorNode(context, oscOptions);
    this.osc2Octave = new OscillatorNode(context, oscOptions);
    this.panner1 = new PannerNode(context, {panningModel: 'equalpower'});
    this.panner2 = new PannerNode(context, {panningModel: 'equalpower'});
    this.ampEnv = new GainNode(context, {gain:0.0});
    this.biquad = new BiquadFilterNode(context, {type:'lowpass'});
    this.volume = new GainNode(context, {gain:0.5});

    this.detune1 = 0.0;
    this.detune2 = 0.0;
    this.filterCutoff = 2500;
    this.filterResonance = 1.0;
    this.filterAmount = 1.0;
    this.filterAttack = 0.01;
    this.filterDecay = 0.1;
    this.ampAttack = 0.01;
    this.ampDecay = 0.1;
    this.width = 1.0;

    this.osc1.connect(this.panner1).connect(this.ampEnv).connect(this.biquad);
    this.osc2.connect(this.panner2).connect(this.ampEnv);
    this.biquad.connect(this.volume);
    this.volume.connect(globalEffectInput);
  }

  play(semitone, octave, time) {
    console.log('play: ', semitone, octave, time);
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
    const cutoffRate = Math.pow(2, 9600 * this.filterCutoff / 1200);
    const startFrequency =
        Math.min(nyquistFrequency, cutoffRate * this.pitchFrequency);
    const filterAmountRate = Math.pow(2, 7200 * this.filterAmount / 1200.0);
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
      console.log('disconnected');
      this.volume.disconnect();
    }, (decayEndTime + 1.0) * 1000);
  }
};