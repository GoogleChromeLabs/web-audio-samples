/*
Copyright 2017, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
    * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

class BitcrusherController {
  /**
   * Initalizes and modifies bitcrusher_ in response to GUI input
   * @param  {Number} bitDepth the number of bits for each sample
   * @param  {Number} reduction the amount of sample rate reduction to apply
   * @param  {Number} gain the volume of the output
   */
  constructor(bitDepth, reduction, gain) {
    this.context = new AudioContext();
    this.bitDepth_ = bitDepth || 24;
    this.reduction_ = reduction || 1;
    
    this.gainNode_ = new GainNode(this.context);
    this.gainNode_.gain.value = gain || 0.5;
  }

  /**
   * Initalize HTML elements when document has loaded
   * @param  {String} containerId the id of parent container
   */
  initializeGUI(containerId) {
    this.sourceButton_ = new SourceController(containerId, this.start.bind(this), 
      this.stop.bind(this));
    this.sourceButton_.disable();
    
    // Place 3 parameters in container to real-time adjust Bitcrusher_ settings
    this.bitDepthParam_ = new ParamController(containerId, 
      this.setBitDepth.bind(this), {type: "range", min: 1, max: 24,
      step: 0.1, default: 24, name: "Bit Depth"});
    this.bitDepthParam_.disable();

    this.reductionParam_ = new ParamController(containerId, 
      this.setReduction.bind(this), {type: "range", min: 1, max: 20,
      step: 0.1, default: 1, name: "Sample Rate Reduction"});
    this.reductionParam_.disable();

    this.gainParam = new ParamController(containerId, 
      this.setGain.bind(this), {type: "range", min: 0, max: 1,
      step: 0.01, default: 0.5, name: "Volume"});

    const songUrl = "audio/it-from-bit.mp3";
    let that = this;

    // Fetch song from server and decode into buffer
    fetch(songUrl).then((response) => { 
      return response.arrayBuffer();})
        .then((song) => { 
          that.context.decodeAudioData(song)
            .then((buffer) => {
              that.songBuffer = buffer;
              that.sourceButton_.enable();
            }, (message) => {console.error(message)});
    });
  }

  /**
   * Change bit depth (bound to event listener by a ParamController)
   * @param {Number} value the new bit depth
   */
  setBitDepth(value) {
    this.bitDepth_ = value || this.bitDepth_;
    this.bitcrusher_.bitDepth = this.bitDepth_;
  }
 
  /**
   * Change sample rate reduction (bound to event listener by a ParamController)
   * @param {Number} value the new sample rate reduction
   */
  setReduction(value) {
    this.reduction_ = value || this.reduction;
    this.bitcrusher_.reduction = this.reduction_;
  }
 
  /**
   * Change the volume
   * @param {Number} value the new gain
   */
  setGain(value) {
    this.gainNode_.gain.value = value || 0.5;
  }

  /**
   * Configure and initiate audio processing
   */
  start() {
    // Play loaded song, running samples through a bitcrusher under user control
    this.song_ = this.context.createBufferSource(); 
    this.song_.buffer = this.songBuffer; 
    this.song_.start();
    this.bitDepthParam_.enable();
    this.reductionParam_.enable();

    this.bitcrusher_ = new Bitcrusher(this.context, 
      {inputChannels: 1, outputChannels: 1, 
      bitDepth: this.bitDepth_, reduction: this.reduction_});

    this.song_.connect(this.bitcrusher_.input);
    this.bitcrusher_.output.connect(this.gainNode_);
    this.gainNode_.connect(this.context.destination);
  }
  
  /**
   * Abort audio processing
   */
  stop() {
    this.song_.stop();
    this.bitDepthParam_.disable();
    this.reductionParam_.disable();
  }
}