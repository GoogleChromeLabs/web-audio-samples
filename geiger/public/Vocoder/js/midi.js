/*
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function midiMessageReceived( e ) {
  var cmd = e.data[0] >> 4;
  var channel = e.data[0] & 0xf;
  var b = e.data[1];
  var c = e.data[2];

  if ( cmd==8 || ((cmd==9)&&(c==0)) ) { // with MIDI, note on with velocity zero is the same as note off
  //    if (b == lastNote) {   // this keeps from shutting off if we're overlapping notes
          // we don't currently need note off
  //        lastNote = -1;
  //    }
  } else if (cmd == 9) {  // note on message
    if (channel == 0 ) { // Change oscillator detune.
      var noteNumber = b - 60;
      var detuneValue = noteNumber * 100;
      var detunegroup = document.getElementById("detunegroup");
      $( detunegroup.children[1] ).slider( "value", detuneValue );
      updateSlider( detunegroup, detuneValue, " cents" );
      if (oscillatorNode)
        oscillatorNode.detune.value = detuneValue;
    } else if (channel == 1) { //pads - play previews
      if (b==48)
        previewModulator(); // is a toggle.
      else if (b==49)
        previewCarrier(); // is a toggle.
      else if (b==44)
        vocode(); // is a toggle.
    }
  } else if (cmd == 11) { // continuous controller
    switch (b) {
      case 1:  // CC2: "Gender" - tuning frequencies
      scaleCarrierFilterFrequencies((Math.floor( (100 * c) / 63.5) / 100) + 0.5) // ideally would be 0.5 - 2.0, centered on 1.
      break;

      case 71:
      case 2:  // CC1: Modulator gain level
      var value = Math.floor( (100 * c) / 63.5) / 50; // 0.0-4.0
      var modgaingroup = document.getElementById("modgaingroup");
      $( modgaingroup.children[1] ).slider( "value", value );
      updateSlider( modgaingroup, value, "" );
      modulatorGainValue = value;
      if (modulatorGain)
        modulatorGain.gain.value = value;
      break;

      case 74:
      case 5:  //  CC5: Carrier sample level
      var sampleValue = Math.floor( (100 * c) / 63.5) / 100; // 0.0-2.0
      var samplegroup = document.getElementById("samplegroup");
      $( samplegroup.children[1] ).slider( "value", sampleValue );
      updateSlider( samplegroup, sampleValue, "" );
      if (carrierSampleGain)
        carrierSampleGain.gain.value = sampleValue;
      break;

      case 10:
      case 6:  //  CC6: Carrier synth level
      var synthValue = Math.floor( (100 * c) / 63.5) / 100; // 0.0-2.0
      var synthgroup = document.getElementById("synthgroup");
      $( synthgroup.children[1] ).slider( "value", synthValue );
      updateSlider( synthgroup, synthValue, "" );
      if (oscillatorGain)
        oscillatorGain.gain.value = synthValue;
      break;

      case 7:  //  CC7: Carrier noise level
      var noiseValue = Math.floor( (100 * c) / 63.5) / 100; // 0.0-2.0
      var noisegroup = document.getElementById("noisegroup");
      $( noisegroup.children[1] ).slider( "value", noiseValue );
      updateSlider( noisegroup, noiseValue, "" );
      if (noiseGain)
        noiseGain.gain.value = noiseValue;
      break;

      case 73:
      case 8:  // CC8: HP filter gain
      hpFilterGain.gain.value = c / 63.5; // 0.0-1.0
      break;

      default:
      console.log("Controller " + b + " received: " + c );
    }
  }
}

//init: create plugin
window.addEventListener('load', function() {   
  navigator.requestMIDIAccess().then( gotMIDI, didntGetMIDI );
} );

var midi = null;
var midiIn = null;

function gotMIDI( midiAccess ) {
  midi = midiAccess;
  if ((typeof(midiAccess.inputs) == "function")) {  //Old Skool MIDI inputs() code
    var ins = midiAccess.inputs();
    for (var i=0; i<ins.length; i++)
      ins[i].onmidimessage = midiMessageReceived;
  } else {
    var inputs=midiAccess.inputs.values();
    for ( var input = inputs.next(); input && !input.done; input = inputs.next())
      input.value.onmidimessage = midiMessageReceived;
  }
}

function didntGetMIDI( error ) {
  console.log("No MIDI access: " + error.code );
}
