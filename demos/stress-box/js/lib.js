// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileOverview Utility collection for stress testing.
 */

const Lib = {

  getSystemInfo: () => {
    let ua = navigator.userAgent;
    let M = ua.match(
      /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) ||
        [];
    let tem;
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return {name:'IE', version: (tem[1] || '')};
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR|Edge\/(\d+)/)
      if(tem != null) {
        return {name: 'Opera', version: tem[1]};
      }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if((tem = ua.match(/version\/([\d.]+)/i)) != null) {
      M.splice(1, 1, tem[1]);
    }
    return {
      name: M[0],
      version: M[1]
    };
  },

  getLoadingTime: () => {
    let timingInfo = performance.timing;
    return timingInfo.loadEventStart - timingInfo.navigationStart;
  },

  maybe: () => {
    return Math.random() < 0.5;
  },

  getMousePosition: (element, clickEvent) => {
    let rect = element.getBoundingClientRect();
    return {
      x: clickEvent.clientX - rect.left,
      y: clickEvent.clientY - rect.top
    };
  }
};
