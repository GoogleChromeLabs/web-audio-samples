/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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
 * A simple MessagePort tester.
 *
 * @class MessengerProcessor
 * @extends AudioWorkletProcessor
 */
class MessengerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._lastUpdate = currentTime;
    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    console.log('[Processor:Received] ' + event.data.message +
                ' (' + event.data.contextTimestamp + ')');
  }

  process() {
    // Post a message to the node for every 1 second.
    if (currentTime - this._lastUpdate > 1.0) {
      this.port.postMessage({
        message: '1 second passed.',
        contextTimestamp: currentTime,
      });
      this._lastUpdate = currentTime;
    }

    return true;
  }
}

registerProcessor('messenger-processor', MessengerProcessor);
