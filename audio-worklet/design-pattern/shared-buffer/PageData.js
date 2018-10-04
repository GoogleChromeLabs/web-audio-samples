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

export default {
  TopBar: {
    pathData: [
      ['Home', '../../../'],
      ['AudioWorklet', '../../'],
      ['AudioWorklet, SharedArrayBuffer and Worker'],
    ],
  },

  Description: {
    title: 'AudioWorklet, SharedArrayBuffer and Worker',
    detail: `Demonstrates how to take advantage of Worker thread and
        SharedArrayBuffer in conjunction with AudioWorklet. This pattern is
        useful when bringing legacy audio application written in C/C++ into
        the web platform.`
  },
};
