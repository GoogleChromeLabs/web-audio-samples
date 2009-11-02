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
 * @fileoverview This file contains a class which assists with the
 * loading of GLSL shaders.
 */

o3djs.provide('o3djs.shader');

/**
 * A module for shaders.
 * @namespace
 */
o3djs.shader = o3djs.shader || {};

/**
 * Helper which convers GLSL names to JavaScript names.
 * @private
 */
o3djs.shader.glslNameToJs_ = function(name) {
  return name.replace(/_(.)/g, function(_, p1) { return p1.toUpperCase(); });
}

/**
 * Creates a new Shader object, loading and linking the given vertex
 * and fragment shaders into a program.
 * @param {!CanvasRenderingContextGL} gl The CanvasRenderingContextGL
 *     into which the shader will be loaded.
 * @param {!string} vertex The vertex shader.
 * @param {!string} fragment The fragment shader.
 */
o3djs.shader.Shader = function(gl, vertex, fragment) {
  this.program = gl.createProgram();
  this.gl = gl;

  var vs = this.loadShader(this.gl.VERTEX_SHADER, vertex);
  if (vs == null) {
    return;
  }
  this.gl.attachShader(this.program, vs);
  this.gl.deleteShader(vs);

  var fs = this.loadShader(this.gl.FRAGMENT_SHADER, fragment);
  if (fs == null) {
    return;
  }
  this.gl.attachShader(this.program, fs);
  this.gl.deleteShader(fs);

  this.gl.linkProgram(this.program);
  this.gl.useProgram(this.program);

  // Check the link status
  var linked = this.gl.getProgrami(this.program, this.gl.LINK_STATUS);
  if (linked == 0) {
    var infoLog = this.gl.getProgramInfoLog(this.program);
    output("Error linking program:\n" + infoLog);
    this.gl.deleteProgram(this.program);
    this.program = null;
    return;
  }

  // find uniforms and attributes
  var re = /(uniform|attribute)\s+\S+\s+(\S+)\s*;/g;
  var match = null;
  while ((match = re.exec(vertex + '\n' + fragment)) != null) {
    var glslName = match[2];
    var jsName = o3djs.shader.glslNameToJs_(glslName);
    var loc = -1;
    if (match[1] == "uniform") {
      this[jsName + "Loc"] = this.getUniform(glslName);
    } else if (match[1] == "attribute") {
      this[jsName + "Loc"] = this.getAttribute(glslName);
    }
    if (loc >= 0) {
      this[jsName + "Loc"] = loc;
    }
  }
}

/**
 * Binds the shader's program.
 */
o3djs.shader.Shader.prototype.bind = function() {
  this.gl.useProgram(this.program);
}

/**
 * Helper for loading a shader.
 * @private
 */
o3djs.shader.Shader.prototype.loadShader = function(type, shaderSrc) {
  var shader = this.gl.createShader(type);
  if (shader == null) {
    return null;
  }

  // Load the shader source
  this.gl.shaderSource(shader, shaderSrc);
  // Compile the shader
  this.gl.compileShader(shader);
  // Check the compile status
  if (this.gl.getShaderi(shader, this.gl.COMPILE_STATUS) == 0) {
    var infoLog = this.gl.getShaderInfoLog(shader);
    output("Error compiling shader:\n" + infoLog);
    this.gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Helper for looking up an attribute's location.
 * @private
 */
o3djs.shader.Shader.prototype.getAttribute = function(name) {
  return this.gl.getAttribLocation(this.program, name);
};

/**
 * Helper for looking up an attribute's location.
 * @private
 */
o3djs.shader.Shader.prototype.getUniform = function(name) {
  return this.gl.getUniformLocation(this.program, name);
}
