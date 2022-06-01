function GlobalEffects(context) {
    this.context = context;
    
    // Create dynamics compressor to sweeten the overall mix.
    var compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);

    var convolver = context.createConvolver();

    convolver.connect(compressor);

    // BPM delay through delayWaveShaper feedback loop
    var bpmDelay = new BpmDelay(context);

    bpmDelay.delay.connect(compressor);

    var delayFeedback = context.createGain();
    delayFeedback.gain.value = 0.5;
    bpmDelay.delay.connect(delayFeedback);
    delayWaveShaper = new WaveShaper(context);
    
    delayFeedback.connect(delayWaveShaper.input);
    delayWaveShaper.output.connect(bpmDelay.delay);

    this.compressor = compressor;
    this.convolver = convolver;
    this.bpmDelay = bpmDelay;
    this.delayFeedback = delayFeedback;
    this.delayWaveShaper = delayWaveShaper;
    
    this.setDelayGrunge(4.0);
}

GlobalEffects.prototype.setDelayFeedback = function(x) {
    this.delayFeedback.gain.value = x;
}

GlobalEffects.prototype.setDelayGrunge = function(driveDb) {
    this.delayWaveShaper.setDrive(Math.pow(10, 0.05*driveDb));
}

GlobalEffects.prototype.setConvolverBuffer = function(buffer) {
    this.convolver.buffer = buffer;
}
