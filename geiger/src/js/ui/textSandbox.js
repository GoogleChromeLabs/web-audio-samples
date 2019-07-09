// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import './textSandbox.css'

class TextSandbox {
  constructor(elemId) {
    let elem = document.getElementById(elemId)
    if (!elem) {
      elem = document.createElement('div');
      elem.setAttribute('id', elemId);
      document.body.appendChild(elem);
    }
    this.elem = elem;
  }

  start(className) {
    this.elem.classList.add(className);
  }

  stop(className) {
    this.elem.classList.remove(className);
  }

  setText(text) {
    this.elem.textContent = text;
  }

  clientWidth() {
    return this.elem.clientWidth;
  }

}

export const textSandbox = new TextSandbox('text-sandbox');
