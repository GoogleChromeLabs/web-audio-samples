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

class SourceController {
  /**
   * Event Handler and layout for start / stop buttons
   * @param  {String} parentId string id for parent element
   * @param  {Function} audioStart callback for play button
   * @param  {Function} audioStop callback for stop button
   */
  constructor(parentId, audioStart, audioStop) {
    // Arrange play and stop button vertically and trigger audioStart
    // and audioStop when these buttons are pressed
    parent = document.getElementById(parentId);
    this.playButton_ = document.createElement("button");
    this.stopButton_ = document.createElement("button");
    parent.appendChild(this.playButton_);
    parent.appendChild(this.stopButton_);

    this.playButton_.innerHTML = "Play";
    this.stopButton_.innerHTML = "Stop";
    this.stopButton_.disabled = true;

    this.playButton_.addEventListener("click", this.start.bind(this));
    this.stopButton_.addEventListener("click", this.stop.bind(this));
    this.audioStart_ = audioStart;
    this.audioStop_ = audioStop;
  }

  enable() {
    this.playButton_.disabled = false;
  }

  disable() {
    this.stopButton_.disabled = true;
    this.playButton_.disabled = true;
  }
  
  start() {
    this.playButton_.disabled = true;
    this.stopButton_.disabled = false;
    this.audioStart_();
  }

  stop() {
    this.playButton_.disabled = false;
    this.stopButton_.disabled = true;
    this.audioStop_();
  }
}