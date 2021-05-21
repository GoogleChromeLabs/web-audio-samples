/**
 * Copyright 2021 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * An abstraction of the one-shot sampler
 *
 * @class DrumCell
 */
class DrumCell {
  /**
   * Creates an instance of DrumCell with two required arguments.
   *
   * @param {Audionode} outputNode The outgoing AudioNode
   * @param {AudioBuffer} audioBuffer An AudioBuffer to be played
   * @memberof DrumCell
   */
  constructor(outputNode, audioBuffer) {
    this._context = outputNode.context;
    this._buffer = audioBuffer;
    this._outputNode = outputNode;
  }

  /**
   * Plays the assigned buffer when called.
   *
   * @memberof DrumCell
   */
  playSample() {
    const bufferSource =
        new AudioBufferSourceNode(this._context, {buffer: this._buffer});
    const amp = new GainNode(this._context);
    bufferSource.connect(amp).connect(this._outputNode);
    bufferSource.start();
  }
}

export default DrumCell;
