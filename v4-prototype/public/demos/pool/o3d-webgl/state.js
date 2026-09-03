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
 * A State object sets the RenderStates for a particular material or StateSet.
 * @constructor
 */
o3d.State = function() {
  o3d.ParamObject.call(this);

  // TODO(petersont): Only some of these have been implemented.
  var stateInfos = [
    {name: 'AlphaBlendEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'AlphaComparisonFunction', paramType: 'ParamInteger',
        defaultValue: o3d.State.CMP_ALWAYS},
    {name: 'AlphaReference', paramType: 'ParamFloat',
        defaultValue: 0},
    {name: 'AlphaTestEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'BlendAlphaEquation', paramType: 'ParamInteger',
        defaultValue: o3d.State.BLEND_ADD},
    {name: 'BlendEquation', paramType: 'ParamInteger',
        defaultValue: o3d.State.BLEND_ADD},
    {name: 'CCWStencilComparisonFunction', paramType: 'ParamInteger',
        defaultValue: o3d.State.CMP_ALWAYS},
    {name: 'CCWStencilFailOperation',  paramType: 'ParamInteger',
        defaultValue: o3d.State.STENCIL_KEEP},
    {name: 'CCWStencilPassOperation',  paramType: 'ParamInteger',
        defaultValue: o3d.State.STENCIL_KEEP},
    {name: 'CCWStencilZFailOperation',  paramType: 'ParamInteger',
        defaultValue: o3d.State.STENCIL_KEEP},
    {name: 'ColorWriteEnable', paramType: 'ParamInteger',
        defaultValue: 15},
    {name: 'CullMode', paramType: 'ParamInteger',
        defaultValue: o3d.State.CULL_CW},
    {name: 'DestinationBlendAlphaFunction',  paramType: 'ParamInteger',
        defaultValue: o3d.State.BLENDFUNC_ZERO},
    {name: 'DestinationBlendFunction',  paramType: 'ParamInteger',
        defaultValue: o3d.State.BLENDFUNC_ZERO},
    {name: 'DitherEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'FillMode', paramType: 'ParamInteger',
        defaultValue: o3d.State.SOLID},
    {name: 'LineSmoothEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'PointSize', paramType: 'ParamFloat',
        defaultValue: 0},
    {name: 'PointSpriteEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'PolygonOffset1',  paramType: 'ParamFloat',
        defaultValue: 0},
    {name: 'PolygonOffset2', paramType: 'ParamFloat',
        defaultValue: 0},
    {name: 'SeparateAlphaBlendEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'SourceBlendAlphaFunction',  paramType: 'ParamInteger',
        defaultValue: o3d.State.BLENDFUNC_ONE},
    {name: 'SourceBlendFunction',  paramType: 'ParamInteger',
        defaultValue: o3d.State.BLENDFUNC_ONE},
    {name: 'StencilComparisonFunction',  paramType: 'ParamInteger',
        defaultValue: o3d.State.CMP_ALWAYS},
    {name: 'StencilEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'StencilFailOperation',  paramType: 'ParamInteger',
        defaultValue: o3d.State.STENCIL_KEEP},
    {name: 'StencilMask', paramType: 'ParamInteger',
        defaultValue: 255},
    {name: 'StencilPassOperation',  paramType: 'ParamInteger',
        defaultValue: o3d.State.STENCIL_KEEP},
    {name: 'StencilReference', paramType: 'ParamInteger',
        defaultValue: 0},
    {name: 'StencilWriteMask', paramType: 'ParamInteger',
        defaultValue: 255},
    {name: 'StencilZFailOperation',  paramType: 'ParamInteger',
        defaultValue: o3d.State.STENCIL_KEEP},
    {name: 'TwoSidedStencilEnable', paramType: 'ParamBoolean',
        defaultValue: false},
    {name: 'ZComparisonFunction',  paramType: 'ParamInteger',
        defaultValue: o3d.State.CMP_LESS},
    {name: 'ZEnable', paramType: 'ParamBoolean',
        defaultValue: true},
    {name: 'ZWriteEnable', paramType: 'ParamBoolean',
        defaultValue: true}
  ];

  this.state_params_ = {};

  for (var i = 0; i < stateInfos.length; ++i) {
    var info = stateInfos[i];
    var param = new o3d.global.o3d[info.paramType];
    param.value = info.defaultValue;
    this.state_params_[info.name] = param;
  }
};
o3d.inherit('State', 'ParamObject');

/**
 * A private object containing the the state params by name.
 */
o3d.State.prototype.state_params_ = { };


/**
 *  Comparison
 *  CMP_NEVER  (Never)
 *  CMP_LESS  (Less Than)
 *  CMP_EQUAL  (Equal To)
 *  CMP_LEQUAL  (Less Than or Equal To)
 *  CMP_GREATER  (Greater Than)
 *  CMP_NOTEQUAL  (Not Equal To)
 *  CMP_GEQUAL  (Greater Than or Equal To)
 *  CMP_ALWAYS  (Always)
 */
o3d.State.CMP_NEVER = 0;
o3d.State.CMP_LESS = 1;
o3d.State.CMP_EQUAL = 2;
o3d.State.CMP_LEQUAL = 3;
o3d.State.CMP_GREATER = 4;
o3d.State.CMP_NOTEQUAL = 5;
o3d.State.CMP_GEQUAL = 6;
o3d.State.CMP_ALWAYS = 7;



/**
 * type {number}
 */
o3d.Cull = goog.typedef;

/**
 *  Cull
 *  CULL_NONE  Don't Cull by face
 *  CULL_CW  Cull clock-wise faces
 *  CULL_CCW  Cull counter clock-wise faces
 */
o3d.State.CULL_NONE = 0;
o3d.State.CULL_CW = 1;
o3d.State.CULL_CCW = 2;




/**
 *  Fill
 *  POINT
 *  WIREFRAME
 *  SOLID
 */
o3d.State.POINT = 0;
o3d.State.WIREFRAME = 1;
o3d.State.SOLID = 2;



/**
 *  BlendingFunction
 *  BLENDFUNC_ZERO
 *  BLENDFUNC_ONE
 *  BLENDFUNC_SOURCE_COLOR
 *  BLENDFUNC_INVERSE_SOURCE_COLOR
 *  BLENDFUNC_SOURCE_ALPHA
 *  BLENDFUNC_INVERSE_SOURCE_ALPHA
 *  BLENDFUNC_DESTINATION_ALPHA
 *  BLENDFUNC_INVERSE_DESTINATION_ALPHA
 *  BLENDFUNC_DESTINATION_COLOR
 *  BLENDFUNC_INVERSE_DESTINATION_COLOR
 *  BLENDFUNC_SOURCE_ALPHA_SATUTRATE
 */
o3d.State.BLENDFUNC_ZERO = 0;
o3d.State.BLENDFUNC_ONE = 1;
o3d.State.BLENDFUNC_SOURCE_COLOR = 2;
o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR = 3;
o3d.State.BLENDFUNC_SOURCE_ALPHA = 4;
o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA = 5;
o3d.State.BLENDFUNC_DESTINATION_ALPHA = 6;
o3d.State.BLENDFUNC_INVERSE_DESTINATION_ALPHA = 7;
o3d.State.BLENDFUNC_DESTINATION_COLOR = 8;
o3d.State.BLENDFUNC_INVERSE_DESTINATION_COLOR = 9;
o3d.State.BLENDFUNC_SOURCE_ALPHA_SATUTRATE = 10;



/**
 *  BlendingEquation
 *  BLEND_ADD
 *  BLEND_SUBTRACT
 *  BLEND_REVERSE_SUBTRACT
 *  BLEND_MIN
 *  BLEND_MAX
 */
o3d.State.BLEND_ADD = 0;
o3d.State.BLEND_SUBTRACT = 1;
o3d.State.BLEND_REVERSE_SUBTRACT = 2;
o3d.State.BLEND_MIN = 3;
o3d.State.BLEND_MAX = 4;



/**
 *  StencilOperation
 *  STENCIL_KEEP
 *  STENCIL_ZERO
 *  STENCIL_REPLACE
 *  STENCIL_INCREMENT_SATURATE
 *  STENCIL_DECREMENT_SATURATE
 *  STENCIL_INVERT
 *  STENCIL_INCREMENT
 *  STENCIL_DECREMENT
 */
o3d.State.STENCIL_KEEP = 0;
o3d.State.STENCIL_ZERO = 1;
o3d.State.STENCIL_REPLACE = 2;
o3d.State.STENCIL_INCREMENT_SATURATE = 3;
o3d.State.STENCIL_DECREMENT_SATURATE = 4;
o3d.State.STENCIL_INVERT = 5;
o3d.State.STENCIL_INCREMENT = 6;
o3d.State.STENCIL_DECREMENT = 7;



/**
 * Returns a Param for a given state. If the param does not already exist it
 * will be created. If the state_name is invalid it will return null.
 * @param {string} state_name name of the state
 * @return {o3d.Param}  param or null if no matching state.
 *
 * Example:
 *
 *
 * g_o3d = document.o3d.o3d;
 * ...
 *
 * var state = my_pack.createState("my_state");
 *
 *
 * state.getStateParam('StencilEnable').value = true;
 * state.getStateParam('StencilReference').value = 25;
 * state.getStateParam('StencilPassOperation').value =
 *     g_o3d.State.STENCIL_REPLACE;
 * state.getStateParam('StencilComparisonFunction').value =
 *     g_o3d.State.CMP_ALWAYS;
 * state.getStateParam('ZEnable').value = false;
 * state.getStateParam('ZWriteEnable').value = false;
 * state.getStateParam('ColorWriteEnable').value = 0;
 *
 * Valid states:
 *
 * State NameTypeDefault Value
 * o3d.AlphaBlendEnableParamBoolean
 *     default = false
 * o3d.AlphaComparisonFunctionParamInteger,
 *     State.Comparisondefault = State.CMP_ALWAYS
 * o3d.AlphaReferenceParamFloat 0-1
 *     default = 0
 * o3d.AlphaTestEnableParamBoolean
 *     default = false
 * o3d.BlendAlphaEquation
 *     ParamInteger, State.BlendingEquation
 *     default = State.BLEND_ADD
 * o3d.BlendEquation
 *     ParamInteger, State.BlendingEquation
 *     default = State.BLEND_ADD
 * o3d.CCWStencilComparisonFunction
 *     ParamInteger, State.Comparison
 *     default = State.CMP_ALWAYS
 * o3d.CCWStencilFailOperation
 *     ParamInteger, State.StencilOperation
 *     default = State.STENCIL_KEEP
 * o3d.CCWStencilPassOperation
 *     ParamInteger, State.StencilOperation
 *     default = State.STENCIL_KEEP
 * o3d.CCWStencilZFailOperation
 *     ParamInteger, State.StencilOperation
 *     default = State.STENCIL_KEEP
 * o3d.ColorWriteEnable
 *     ParamInteger 0-15 bit 0 = red, bit 1 = green,
 *     bit 2 = blue, bit 3 = alphadefault = 15
 * o3d.CullModeParamInteger, State.Cull
 *     default = State.CULL_CW
 * o3d.DestinationBlendAlphaFunction
 *     ParamInteger, State.BlendingFunction
 *     default = State.BLENDFUNC_ZERO
 * o3d.DestinationBlendFunction
 *     ParamInteger, State.BlendingFunction
 *     default = State.BLENDFUNC_ZERO
 * o3d.DitherEnableParamBoolean
 *     default = false
 * o3d.FillModeParamInteger, State.Fill
 *     default = State.SOLID
 * o3d.LineSmoothEnableParamBoolean
 *     default = false
 * o3d.PointSizeParamFloatTBD
 * o3d.PointSpriteEnableParamBoolean
 *     default = false
 * o3d.PolygonOffset1
 *     ParamFloat, polygon offset slope factor0
 * o3d.PolygonOffset2ParamFloat, polygon offset bias (in
 *     resolvable units)0
 * o3d.SeparateAlphaBlendEnableParamBoolean
 *     default = false
 * o3d.SourceBlendAlphaFunction
 *     ParamInteger, State.BlendingFunction
 *     default = State.BLENDFUNC_ONE
 * o3d.SourceBlendFunction
 *     ParamInteger, State.BlendingFunction
 *     default = State.BLENDFUNC_ONE
 * o3d.StencilComparisonFunction
 *     ParamInteger, State.Comparison
 *     default = State.CMP_ALWAYS
 * o3d.StencilEnableParamBoolean
 *     default = false
 * o3d.StencilFailOperation
 *     ParamInteger, State.StencilOperation
 *     default = State.STENCIL_KEEP
 * o3d.StencilMaskParamInteger 0-255
 *     default = 255
 * o3d.StencilPassOperation
 *     ParamInteger, State.StencilOperation
 *     default = State.STENCIL_KEEP
 * o3d.StencilReferenceParamInteger 0-255
 *     default = 0
 * o3d.StencilWriteMaskParamInteger 0-255
 *     default = 255
 * o3d.StencilZFailOperation
 *     ParamInteger, State.StencilOperation
 *     default = State.STENCIL_KEEP
 * o3d.TwoSidedStencilEnableParamBoolean
 *     default = false
 * o3d.ZComparisonFunction
 *     ParamInteger, State.Comparison
 *     default = State.CMP_LESS
 * o3d.ZEnableParamBoolean
 *     default = true
 * o3d.ZWriteEnableParamBoolean
 *     default = true
 *
 *
 * Note: Polygon offset is computed with the following formula:
 *
 * totalOffset = PolygonOffset1 * slope + PolygonOffset2 * r
 *
 * Slope is the maximum difference in depth between 2 adjacent pixels of the
 * polygon. r is the smallest value that would fail the NOTEQUAL test against
 * 0.
 * Typical useful values to layer a polygon on top of another one are -1.0 for
 * each of PolygonOffset1 and PolygonOffset2.
 */
o3d.State.prototype.getStateParam =
    function(state_name) {
  return this.state_params_[state_name];
};



o3d.State.prototype.convertCmpFunc = function(cmp) {
  switch(cmp) {
    case o3d.State.CMP_ALWAYS:
      return this.gl.ALWAYS;
    case o3d.State.CMP_NEVER:
      return this.gl.NEVER;
    case o3d.State.CMP_LESS:
      return this.gl.LESS;
    case o3d.State.CMP_GREATER:
      return this.gl.GREATER;
    case o3d.State.CMP_LEQUAL:
      return this.gl.LEQUAL;
    case o3d.State.CMP_GEQUAL:
      return this.gl.GEQUAL;
    case o3d.State.CMP_EQUAL:
      return this.gl.EQUAL;
    case o3d.State.CMP_NOTEQUAL:
      return this.gl.NOTEQUAL;
    default:
      break;
  }
  return this.gl.ALWAYS;
};


o3d.State.prototype.convertFillMode = function(mode) {
  switch (mode) {
    case o3d.State.POINT:
      return this.gl.POINT;
    case o3d.State.WIREFRAME:
      return this.gl.LINE;
    case o3d.State.SOLID:
      return this.gl.FILL;
    default:
      break;
  }
  return this.gl.FILL;
};


o3d.State.prototype.convertBlendFunc = function(blend_func) {
  switch (blend_func) {
    case o3d.State.BLENDFUNC_ZERO:
      return this.gl.ZERO;
    case o3d.State.BLENDFUNC_ONE:
      return this.gl.ONE;
    case o3d.State.BLENDFUNC_SOURCE_COLOR:
      return this.gl.SRC_COLOR;
    case o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR:
      return this.gl.ONE_MINUS_SRC_COLOR;
    case o3d.State.BLENDFUNC_SOURCE_ALPHA:
      return this.gl.SRC_ALPHA;
    case o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA:
      return this.gl.ONE_MINUS_SRC_ALPHA;
    case o3d.State.BLENDFUNC_DESTINATION_ALPHA:
      return this.gl.DST_ALPHA;
    case o3d.State.BLENDFUNC_INVERSE_DESTINATION_ALPHA:
      return this.gl.ONE_MINUS_DST_ALPHA;
    case o3d.State.BLENDFUNC_DESTINATION_COLOR:
      return this.gl.DST_COLOR;
    case o3d.State.BLENDFUNC_INVERSE_DESTINATION_COLOR:
      return this.gl.ONE_MINUS_DST_COLOR;
    case o3d.State.BLENDFUNC_SOURCE_ALPHA_SATUTRATE:
      return this.gl.SRC_ALPHA_SATURATE;
    default:
      break;
  }
  return this.gl.ONE;
};


o3d.State.prototype.convertBlendEquation = function(blend_equation) {
  switch (blend_equation) {
    case o3d.State.BLEND_ADD:
      return this.gl.FUNC_ADD;
    case o3d.State.BLEND_SUBTRACT:
      return this.gl.FUNC_SUBTRACT;
    case o3d.State.BLEND_REVERSE_SUBTRACT:
      return this.gl.FUNC_REVERSE_SUBTRACT;
    case o3d.State.BLEND_MIN:
      return this.gl.MIN;
    case o3d.State.BLEND_MAX:
      return this.gl.MAX;
    default:
      break;
  }
  return this.gl.FUNC_ADD;
};


o3d.State.prototype.convertStencilOp = function(stencil_func) {
  switch (stencil_func) {
    case o3d.State.STENCIL_KEEP:
      return this.gl.KEEP;
    case o3d.State.STENCIL_ZERO:
      return this.gl.ZERO;
    case o3d.State.STENCIL_REPLACE:
      return this.gl.REPLACE;
    case o3d.State.STENCIL_INCREMENT_SATURATE:
      return this.gl.INCR;
    case o3d.State.STENCIL_DECREMENT_SATURATE:
      return this.gl.DECR;
    case o3d.State.STENCIL_INVERT:
      return this.gl.INVERT;
    case o3d.State.STENCIL_INCREMENT:
      return this.gl.INCR_WRAP;
    case o3d.State.STENCIL_DECREMENT:
      return this.gl.DECR_WRAP;
    default:
      break;
  }
  return this.gl.KEEP;
};


o3d.State.prototype.set = function() {
  var stateParams = this.state_params_;

  if (stateParams['AlphaBlendEnable'].value) {
    this.gl.enable(this.gl.BLEND);
  } else {
    this.gl.disable(this.gl.BLEND);
  }

  if (stateParams['SeparateAlphaBlendEnable'].value) {
    this.gl.blendFuncSeparate(
        this.convertBlendFunc(stateParams['SourceBlendFunction'].value),
        this.convertBlendFunc(stateParams['DestinationBlendFunction'].value),
        this.convertBlendFunc(stateParams['SourceBlendAlphaFunction'].value),
        this.convertBlendFunc(
            stateParams['DestinationBlendAlphaFunction'].value));
    this.gl.blendEquationSeparate(
      this.convertBlendEquation(stateParams['BlendEquation'].value),
      this.convertBlendEquation(stateParams['BlendAlphaEquation'].value));
  } else {
    this.gl.blendFunc(
        this.convertBlendFunc(stateParams['SourceBlendFunction'].value),
        this.convertBlendFunc(stateParams['DestinationBlendFunction'].value));
    this.gl.blendEquation(
      this.convertBlendEquation(stateParams['BlendEquation'].value));
  }

  switch (stateParams['CullMode'].value) {
    case o3d.State.CULL_CW:
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.BACK);
      break;
    case o3d.State.CULL_CCW:
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.FRONT);
      break;
    default:
      this.gl.disable(this.gl.CULL_FACE);
      break;
  }

  if (stateParams['DitherEnable'].value) {
    this.gl.enable(this.gl.DITHER);
  } else {
    this.gl.disable(this.gl.DITHER);
  }

  if (stateParams['ZEnable'].value) {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(
        this.convertCmpFunc(stateParams['ZComparisonFunction'].value));
  } else {
    this.gl.disable(this.gl.DEPTH_TEST);
  }

  if (stateParams['StencilEnable'].value) {
    this.gl.enable(this.gl.STENCIL_TEST);
    this.gl.stencilFunc(
        this.convertCmpFunc(stateParams['StencilComparisonFunction'].value));
  } else {
    this.gl.disable(this.gl.STENCIL_TEST);
  }
};

