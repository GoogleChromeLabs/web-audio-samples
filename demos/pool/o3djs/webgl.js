/*
 * Copyright 2009, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
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


/**
 * @fileoverview This file contains utility functions for o3d running on
 * top of webgl.  The function o3djs.webgl.makeClients replaces the
 * function o3djs.util.makeClients.
 */

o3djs.provide('o3djs.webgl');

o3djs.require('o3djs.effect');
o3djs.require('o3djs.util');


/**
 * A Module with various utilities.
 * @namespace
 */
o3djs.webgl = o3djs.webgl || {};


/**
 * Finds all divs with an id that starts with "o3d" and inits a canvas
 * under them with o3d client object and the o3d namespace.
 */
o3djs.webgl.makeClients = function(callback,
                                   opt_features,
                                   opt_requiredVersion,
                                   opt_failureCallback,
                                   opt_id,
                                   opt_tag,
                                   opt_debug) {
  opt_failureCallback = opt_failureCallback || o3djs.webgl.informPluginFailure;

  var clientElements = [];
  var elements = o3djs.util.getO3DContainerElements(opt_id, opt_tag);

  for (var ee = 0; ee < elements.length; ++ee) {
    var element = elements[ee];
    var features = opt_features;
    if (!features) {
      var o3d_features = element.getAttribute('o3d_features');
      if (o3d_features) {
        features = o3d_features;
      } else {
        features = '';
      }
    }
    var objElem = o3djs.webgl.createClient(element, features, opt_debug);
    clientElements.push(objElem);
  }

  // Wait for the client elements to be fully initialized. This
  // involves waiting for the page to fully layout and the initial
  // resize event to be processed.
  var clearId = window.setInterval(function() {
    for (var cc = 0; cc < clientElements.length; ++cc) {
      var element = clientElements[cc];
      if (!element.sizeInitialized_) {
        return;
      }
    }
    window.clearInterval(clearId);
    callback(clientElements);
  });
};


/**
 * Adds a wrapper object to single gl function context that checks for errors
 * before the call.
 * @param {WebGLContext} context
 * @param {string} fname The name of the function.
 * @return {}
 */
o3djs.webgl.createGLErrorWrapper = function(context, fname) {
    return function() {
        var rv = context[fname].apply(context, arguments);
        var err = context.getError();
        if (err != 0) {
            throw "GL error " + err + " in " + fname;
        }
        return rv;
    };
};


/**
 * Adds a wrapper object to a webgl context that checks for errors
 * before each function call.
 */
o3djs.webgl.addDebuggingWrapper = function(context) {
    // Thanks to Ilmari Heikkinen for the idea on how to implement this
    // so elegantly.
    var wrap = {};
    for (var i in context) {
      if (typeof context[i] == 'function') {
          wrap[i] = o3djs.webgl.createGLErrorWrapper(context, i);
      } else {
          wrap[i] = context[i];
      }
    }
    wrap.getError = function() {
        return context.getError();
    };
    return wrap;
};


/**
 * Creates a canvas under the given parent element and an o3d.Client
 * under that.
 *
 * @ param {!Element} element The element under which to insert the client.
 * @ param {string} opt_features Features to turn on.
 * @ param {boolean} opt_debug Whether gl debugging features should be
 *     enabled.
 */
o3djs.webgl.createClient = function(element, opt_features, opt_debug) {
  opt_features = opt_features || '';
  opt_debug = opt_debug || false;

  // If we're creating a webgl client, the assumption is we're using webgl,
  // in which case the only acceptable shader language is glsl.  So, here
  // we set the shader language to glsl.
  o3djs.effect.setLanguage('glsl');

  // Make the canvas automatically resize to fill the containing
  // element (div), and initialize its size correctly.
  var canvas;
  canvas = document.createElement('canvas');
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  var client = new o3d.Client;

  var resizeHandler = function() {
    var width = Math.max(1, canvas.clientWidth);
    var height = Math.max(1, canvas.clientHeight);
    canvas.width = width;
    canvas.height = height;
    canvas.sizeInitialized_ = true;
    client.gl.displayInfo = {width: canvas.width, height: canvas.height};
  };
  window.addEventListener('resize', resizeHandler, false);
  setTimeout(resizeHandler, 0);

  client.initWithCanvas(canvas);
  canvas.client = client;
  canvas.o3d = o3d;

  if (opt_debug) {
    client.gl = o3djs.webgl.addDebuggingWrapper(client.gl);
  }

  element.appendChild(canvas);
  return canvas;
};


