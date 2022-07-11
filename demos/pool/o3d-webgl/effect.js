/*
 * Copyright 2010, Google Inc.
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
 * EffectParameterInfo holds information about the Parameters an Effect needs.
 * o3d.Effect.getParameterInfo
 */
o3d.EffectParameterInfo = function() { };
o3d.inherit('EffectParameterInfo', 'NamedObject');


/**
 * The name of the parameter.
 * @type {string}
 */
o3d.EffectParameterInfo.prototype.name = '';



/**
 * The type of the parameter.
 * @type {string}
 */
o3d.EffectParameterInfo.prototype.className = '';



/**
 * The number of elements.  Non-zero for array types, zero for non-array types.
 * @type {number}
 */
o3d.EffectParameterInfo.prototype.numElements = 0;



/**
 * The semantic of the parameter. This is always in UPPERCASE.
 * @type {o3d.Stream.Semantic}
 */
o3d.EffectParameterInfo.prototype.semantic = o3d.Stream.UNKNOWN_SEMANTIC;


/**
 * If this is a standard parameter (SAS) this will be the name of the type
 * of Param needed. Otherwise it will be the empty string.
 *
 * Standard Parameters are generally handled automatically by o3d but you
 * can supply your own if you have a unique situation.
 *
 * @type {string}
 */
o3d.EffectParameterInfo.prototype.sas_class_name = '';



/**
 * EffectStreamInfo holds information about the Streams an Effect needs.
 * @param {o3d.Stream.Semantic} opt_semantic The semantic of the stream
 * @param {number} opt_semantic_index
 * @constructor
 */
o3d.EffectStreamInfo = function(opt_semantic, opt_semantic_index) {
  o3d.NamedObject.call(this);
  if (!opt_semantic) {
    opt_semantic = o3d.Stream.UNKNOWN_SEMANTIC;
  }
  if (!opt_semantic_index) {
    opt_semantic_index = 0;
  }
  this.semantic = opt_semantic;
  this.opt_semantic_index = opt_semantic_index;
};
o3d.inherit('EffectStreamInfo', 'NamedObject');


/**
 * The semantic of the stream.
 * @type {!o3d.Stream.Semantic}
 */
o3d.EffectStreamInfo.prototype.semantic = o3d.Stream.UNKNOWN_SEMANTIC;



/**
 * The semantic index of the stream.
 * @type {number}
 */
o3d.EffectStreamInfo.prototype.semanticIndex = 0;


/**
 * An Effect contains a vertex and pixel shader.
 * @constructor
 */
o3d.Effect = function() {
  o3d.ParamObject.call(this);
  this.program_ = null;
  this.uniforms_ = {};
  this.attributes_ = {};
};
o3d.inherit('Effect', 'ParamObject');

o3d.Effect.HELPER_CONSTANT_NAME = 'dx_clipping';


/**
 * An object mapping the names of uniform variables to objects containing
 * information about the variable.
 * @type {Object}
 * @private
 */
o3d.Effect.prototype.uniforms_ = {};


/**
 * An object mapping the names of attributes to objects containing
 * information about the attribute.
 * @type {Object}
 * @private
 */
o3d.Effect.prototype.attributes_ = {};


/**
 * Indicates whether the vertex shader has been loaded, so we can
 * postpone linking until both shaders are in.
 *
 * @type {boolean}
 */
o3d.Effect.prototype.vertexShaderLoaded_ = false;


/**
 * Indicates whether the fragment shader has been loaded, so we can
 * postpone linking until both shaders are in.
 *
 * @type {boolean}
 */
o3d.Effect.prototype.fragmentShaderLoaded_ = false;


/**
 * Binds standard attribute locations for the shader.
 */
o3d.Effect.prototype.bindAttributesAndLinkIfReady = function() {
  if (this.vertexShaderLoaded_ && this.fragmentShaderLoaded_) {
    var attributes = ['position', 'normal', 'tangent', 'binormal', 'color',
                      'texCoord0', 'texCoord1', 'texCoord2', 'texCoord3',
                      'texCoord4', 'texCoord5', 'texCoord6', 'texCoord7'];
    for (var i = 0; i < attributes.length; ++i) {
      this.gl.bindAttribLocation(this.program_, i, attributes[i]);
    }
    this.gl.linkProgram(this.program_);
    if (!this.gl.getProgramParameter(this.program_, this.gl.LINK_STATUS)) {
      var log = this.gl.getShaderInfoLog(this.program_);
      this.gl.client.error_callback(
          'Program link failed with error log:\n' + log);
    }
    this.getUniforms_();
    this.getAttributes_();
  }
};


/**
 * Helper function for loadVertexShaderFromString and
 * loadPixelShaderFromString that takes the type as an argument.
 * @param {string} shaderString The shader code.
 * @param {number} type The type of the shader: either
 *    VERTEX_SHADER or FRAGMENT_SHADER.
 * @return {bool} Success.
 */
o3d.Effect.prototype.loadShaderFromString = function(shaderString, type) {
  if (!this.program_) {
    this.program_ = this.gl.createProgram();
  }

  var success = true;

  var shader = this.gl.createShader(type);
  this.gl.shaderSource(shader, shaderString);
  this.gl.compileShader(shader);

  if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    success = false;
    var log = this.gl.getShaderInfoLog(shader);
    this.gl.client.error_callback(
        'Shader compile failed with error log:\n' + log);
  }

  this.gl.attachShader(this.program_, shader);

  return success;
};


/**
 * Loads a glsl vertex shader for this effect from a string.
 * @param {string} shaderString The string.
 * @return {bool} Success.
 */
o3d.Effect.prototype.loadVertexShaderFromString =
    function(shaderString) {
  var success =
      this.loadShaderFromString(shaderString, this.gl.VERTEX_SHADER);
  this.vertexShaderLoaded_ = true;
  o3d.Effect.prototype.bindAttributesAndLinkIfReady();
  return success;
};


/**
 * Loads a glsl vertex shader for this effect from a string.
 * @param {string} shaderString The string.
 * @return {bool} Success.
 */
o3d.Effect.prototype.loadPixelShaderFromString =
    function(shaderString) {
  var success =
      this.loadShaderFromString(shaderString, this.gl.FRAGMENT_SHADER);
  this.fragmentShaderLoaded_ = true;
  this.bindAttributesAndLinkIfReady();
  return success;
};


/**
 * Loads a glsl vertex shader and pixel shader from one string.
 * Assumes the vertex shader and pixel shader are separated by
 * the text '// #o3d SplitMarker'.
 * @param {string} shaderString The string.
 * @return {bool} Success.
 */
o3d.Effect.prototype.loadFromFXString =
    function(shaderString) {
  var splitIndex = shaderString.indexOf('// #o3d SplitMarker');
  return this.loadVertexShaderFromString(shaderString.substr(0, splitIndex)) &&
      this.loadPixelShaderFromString(shaderString.substr(splitIndex));
};


/**
 * Iterates through the active uniforms of the program and gets the
 * location of each one and stores them by name in the uniforms
 * object.
 * @private
 */
o3d.Effect.prototype.getUniforms_ =
    function() {
  this.uniforms_ = {};
  var numUniforms = this.gl.getProgramParameter(
      this.program_, this.gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < numUniforms; ++i) {
    var info = this.gl.getActiveUniform(this.program_, i);
    this.uniforms_[info.name] = {info:info,
        location:this.gl.getUniformLocation(this.program_, info.name)};
  }
};


/**
 * Iterates through the active attributes of the program and gets the
 * location of each one and stores them by name in the attributes
 * object.
 * @private
 */
o3d.Effect.prototype.getAttributes_ =
    function() {
  this.attributes_ = {};
  var numAttributes = this.gl.getProgramParameter(
      this.program_, this.gl.ACTIVE_ATTRIBUTES);
  for (var i = 0; i < numAttributes; ++i) {
    var info = this.gl.getActiveAttrib(this.program_, i);
    this.attributes_[info.name] = {info:info,
        location:this.gl.getAttribLocation(this.program_, info.name)};
  }
};


/**
 * For each of the effect's uniform parameters, creates corresponding
 * parameters on the given ParamObject. Skips SAS Parameters.
 *
 * If a Param with the same name but the wrong type already exists on the
 * given ParamObject createUniformParameters will attempt to replace it with
 * one of the correct type.
 *
 * Note: The most common thing to pass to this function is a Material but
 * depending on your application it may be more appropriate to pass in a
 * Transform, Effect, Element or DrawElement.
 *
 * @param {!o3d.ParamObject} param_object The param object on which the
 *     new paramters will be created.
 */
o3d.Effect.prototype.createUniformParameters =
    function(param_object) {
  var sasNames = {'world': true,
                  'view': true,
                  'projection': true,
                  'worldView': true,
                  'worldProjection': true,
                  'worldViewProjection': true,
                  'worldInverse': true,
                  'viewInverse': true,
                  'projectionInverse': true,
                  'worldViewInverse': true,
                  'worldProjectionInverse': true,
                  'worldViewProjectionInverse': true,
                  'worldTranspose': true,
                  'viewTranspose': true,
                  'projectionTranspose': true,
                  'worldViewTranspose': true,
                  'worldProjectionTranspose': true,
                  'worldViewProjectionTranspose': true,
                  'worldInverseTranspose': true,
                  'viewInverseTranspose': true,
                  'projectionInverseTranspose': true,
                  'worldViewInverseTranspose': true,
                  'worldProjectionInverseTranspose': true,
                  'worldViewProjectionInverseTranspose': true};

  for (var name in this.uniforms_) {
    var info = this.uniforms_[name].info;

    if (sasNames[name])
      continue;

    var paramType = '';
    switch (info.type) {
      case this.gl.FLOAT:
        paramType = 'ParamFloat';
        break;
      case this.gl.FLOAT_VEC2:
        paramType = 'ParamFloat2';
        break;
      case this.gl.FLOAT_VEC3:
        paramType = 'ParamFloat3';
        break;
      case this.gl.FLOAT_VEC4:
        paramType = 'ParamFloat4';
        break;
      case this.gl.INT:
        paramType = 'ParamInteger';
        break;
      case this.gl.BOOL:
        paramType = 'ParamBoolean';
        break;
      case this.gl.FLOAT_MAT4:
        paramType = 'ParamMatrix4';
        break;
      case this.gl.SAMPLER_2D:
        paramType = 'ParamSampler';
        break;
      case this.gl.SAMPLER_CUBE:
        paramType = 'ParamSampler';
        break;
    }

    param_object.createParam(info.name, paramType);
  }
};


/**
 * For each of the effect's uniform parameters, if it is a SAS parameter
 * creates corresponding StandardParamMatrix4 parameters on the given
 * ParamObject.  Note that SAS parameters are handled automatically by the
 * rendering system. so except in some rare cases there is no reason to call
 * this function.  Also be aware that the StandardParamMatrix4 Paramters like
 * WorldViewProjectionParamMatrix4, etc.. are only valid during rendering.
 * At all other times they will not return valid values.
 *
 * If a Param with the same name but the wrong type already exists on the
 * given ParamObject CreateSASParameters will attempt to replace it with
 * one of the correct type.
 *
 * @param {!o3d.ParamObject} param_object The param object on which the new
 *     paramters will be created.
 */
o3d.Effect.prototype.createSASParameters =
    function(param_object) {
  o3d.notImplemented();
};


/**
 * Gets info about the parameters this effect needs.
 * @return {!Array.<!o3d.EffectParameterInfo>} an array of
 *     EffectParameterInfo objects.
 */
o3d.Effect.prototype.getParameterInfo = function() {
  o3d.notImplemented();
  return [];
};


/**
 * Gets info about the streams this effect needs.
 * @return {!Array.<!o3d.EffectStreamInfo>} an array of
 *     EffectStreamInfo objects.
 */
o3d.Effect.prototype.getStreamInfo = function() {
  var infoList = [];

  for (var name in this.attributes_) {
    var attributes = {
      'position': {semantic: o3d.Stream.POSITION, index: 0},
      'normal': {semantic: o3d.Stream.NORMAL, index: 0},
      'tangent': {semantic: o3d.Stream.TANGENT, index: 0},
      'binormal': {semantic: o3d.Stream.BINORMAL, index: 0},
      'color': {semantic: o3d.Stream.COLOR, index: 0},
      'texCoord0': {semantic: o3d.Stream.TEXCOORD, index: 0},
      'texCoord1': {semantic: o3d.Stream.TEXCOORD, index: 1},
      'texCoord2': {semantic: o3d.Stream.TEXCOORD, index: 2},
      'texCoord3': {semantic: o3d.Stream.TEXCOORD, index: 3},
      'texCoord4': {semantic: o3d.Stream.TEXCOORD, index: 4},
      'texCoord5': {semantic: o3d.Stream.TEXCOORD, index: 5},
      'texCoord6': {semantic: o3d.Stream.TEXCOORD, index: 6},
      'texCoord7': {semantic: o3d.Stream.TEXCOORD, index: 7}};
    var semantic_index_pair = attributes[name];
    infoList.push(new o3d.EffectStreamInfo(
        semantic_index_pair.semantic, semantic_index_pair.index));
  }
  return infoList;
};


/**
 * Searches the objects in the given list for parameters to apply to the
 * uniforms defined on this effects program, and applies them, favoring
 * the objects nearer the begining of the list.
 *
 * @param {!Array.<!o3d.ParamObject>} object_list The param objects to search.
 * @private
 */
o3d.Effect.prototype.searchForParams_ = function(object_list) {
  var filled_map = {};
  for (var name in this.uniforms_) {
    filled_map[name] = false;
  }
  this.gl.useProgram(this.program_);
  o3d.Param.texture_index_ = 0;
  for (var i = 0; i < object_list.length; ++i) {
    var obj = object_list[i];
    for (var name in this.uniforms_) {
      var uniformInfo = this.uniforms_[name];
      if (filled_map[name]) {
        continue;
      }
      var param = obj.getParam(name);
      if (param) {
        param.applyToLocation(this.gl, uniformInfo.location);
        filled_map[name] = true;
      }
    }
  }

  this.updateHelperConstants_(this.gl.displayInfo.width,
                              this.gl.displayInfo.height);
  filled_map[o3d.Effect.HELPER_CONSTANT_NAME] = true;

  for (var name in this.uniforms_) {
    if (!filled_map[name]) {
      throw ('Uniform param not filled: "'+ name + '"');
    }
  }
};


/**
 * Updates certain parameters used to make the GLSL shaders have the
 * same clipping semantics as D3D's.
 * @param {number} width width of the viewport in pixels
 * @param {number} height height of the viewport in pixels
 * @private
 */
o3d.Effect.prototype.updateHelperConstants_ = function(width, height) {
  var uniformInfo = this.uniforms_[o3d.Effect.HELPER_CONSTANT_NAME];
  var dx_clipping = [ 0.0, 0.0, 0.0, 0.0 ];
  if (uniformInfo) {
    // currentRenderSurfaceSet is set in render_surface_set.js.
    dx_clipping[0] = 1.0 / width;
    dx_clipping[1] = -1.0 / height;
    dx_clipping[2] = 2.0;
    if (this.gl.currentRenderSurfaceSet) {
      dx_clipping[3] = -1.0;
    } else {
      dx_clipping[3] = 1.0;
    }

    this.gl.uniform4f(uniformInfo.location,
                      dx_clipping[0], dx_clipping[1],
                      dx_clipping[2], dx_clipping[3]);
  }
};

/**
 * @type {number}
 */
o3d.Effect.MatrixLoadOrder = goog.typedef;

/**
 *  MatrixLoadOrder,
 *  ROW_MAJOR,  Matrix parameters are loaded in row-major order (DX-style).
 *  COLUMN_MAJOR,   Matrix parameters are loaded in column-major order
 *     (OpenGL-style).
 */
o3d.Effect.ROW_MAJOR = 0;
o3d.Effect.COLUMN_MAJOR = 1;


/**
 * The order in which matrix data is loaded to the GPU.
 * @type {o3d.Effect.MatrixLoadOrder}
 */
o3d.Effect.prototype.matrix_load_order_ = o3d.Effect.ROW_MAJOR;


/**
 * The source for the shaders on this Effect.
 * @type {string}
 */
o3d.Effect.prototype.source_ = '';


