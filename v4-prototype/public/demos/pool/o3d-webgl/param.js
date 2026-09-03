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
 * Params store data defined name/value pairs on ParamObjects.
 * Each Param has a name, a type and a value that can be set and queried.
 * One of their uses is to hold "uniform constants" used to parameterize
 * shaders.  Params can be connected in a source/destination fashion such
 * that a target Param gets its value from the source param.
 * @constructor
 */
o3d.Param = function(param_type_name) {
  o3d.Param.prototype.output_connections = [];
  this.outputConnections = [];
}
o3d.inherit('Param', 'NamedObject');


/**
 * If true, this param will make sure its input param is up to date when
 * using it as a source. Default = true.
 *
 * This is for helping with Param cycles.
 *
 * If paramA gets its value from paramB and paramB gets its value from
 * paramA:
 * If you go paramA.value, paramB will evaluate then copy to paramA.
 * If you go paramB.value, paramA will evaluate then copy to paramB.
 * If you set paramB.updateInput = false, then:
 * If you go paramA.value, paramB will evaluate then copy to paramA.
 * If you go paramB.value, paramB just copy paramA. paramA will NOT evaluate
 * when paramB asks for its value.
 */
o3d.Param.prototype.update_input = true;

/**
 * @type {o3d.Param}
 */
o3d.Param.prototype.inputConnection = null;

/**
 * @type {Array.<!o3d.Param>}
 */
o3d.Param.prototype.outputConnections = [];


/**
 * @type {o3d.ParamObject}
 */
o3d.Param.prototype.owner_ = null;

/**
 * @type {Object} The value of the parameter.
 */
o3d.Param.prototype.value_ = null;

o3d.Param.prototype.__defineSetter__('value',
    function(v) {
      if (this.inputConnection) {
        throw ('Tried to set bound parameter.');
      } else {
        if (this.value_ != undefined && (
           typeof this.value_ != typeof v ||
           (this.value_.length_ !== undefined &&
            (this.value_.length_ != v.length)))) {
          this.gl.client.error_callback('Param type error.');
        }
        this.value_ = v;
      }
    }
);

o3d.Param.prototype.__defineGetter__('value',
    function() {
      if (this.inputConnection) {
        return this.inputConnection.value;
      } else {
        return this.value_;
      }
    }
);


/**
 * Directly binds two Param elements such that this parameter gets its value
 * from the source parameter.  The source must be compatible with this
 * parameter.
 *
 * @param {o3d.Param} source_param The parameter that the value originates
 *     from. Passing in null will unbind any parameter currently bound.
 * @return {boolean}  True if the bind succeeded.
 */
o3d.Param.prototype.bind =
    function(source_param) {
  source_param.outputConnections.push(this);
  this.inputConnection = source_param;
};


/**
 * Breaks any input connection coming into the Param.
 */
o3d.Param.prototype.unbindInput =
    function() {
  o3d.notImplemented();
};


/**
 * Breaks a specific param-bind output connection on this param.
 *
 * @param {o3d.Param} destination_param param to unbind.
 */
o3d.Param.prototype.unbindOutput =
    function(destination_param) {
  o3d.notImplemented();
};


/**
 * Breaks all param-bind output connections on this param.
 */
o3d.Param.prototype.unbindOutputs = function() {
  o3d.notImplemented();
};



/**
 * If true the param is read only. Its value can not be set nor can it be used
 * as the destination in a ParamBind.
 */
o3d.Param.prototype.read_only_ = false;


/**
 * @constructor
 */
o3d.ParamBoolean = function() {
  o3d.Param.call(this);
  this.value = false;
};
o3d.inherit('ParamBoolean', 'Param');


/**
 * @constructor
 */
o3d.ParamBoundingBox = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamBoundingBox', 'Param');

// ParamBoundingBox requires a specialized setter because it must
// accept arrays of arrays and convert them into BoundingBoxes. It
// seems that if we define a setter against this prototype we must
// also define a getter -- it is not inherited.
o3d.ParamBoundingBox.prototype.__defineSetter__('value',
    function(v) {
      if (this.inputConnection) {
        throw ('Tried to set bound parameter.');
      } else {
        if (!v) {
          v = new o3d.BoundingBox();
        } else if (v.length !== undefined) {
          if (v.length == 0) {
            v = new o3d.BoundingBox();
          } else if (v.length == 2) {
            for (var ii = 0; ii < 2; ++ii) {
              if (v[ii].length != 3) {
                throw ('Expected sub-array of length 3 at index ' + ii +
                       ', got ' + v[ii].length);
              }
            }
            v = new o3d.BoundingBox(v[0], v[1]);
          } else {
            throw 'Expected array of length 2';
          }
        }
        this.value_ = v;
      }
    }
);

o3d.ParamBoundingBox.prototype.__defineGetter__('value',
    function() {
      if (this.inputConnection) {
        return this.inputConnection.value;
      } else {
        return this.value_;
      }
    }
);

/**
 * @constructor
 */
o3d.ParamDrawContext = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamDrawContext', 'Param');


/**
 * @constructor
 */
o3d.ParamDrawList = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamDrawList', 'Param');


/**
 * @constructor
 */
o3d.ParamEffect = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamEffect', 'Param');


/**
 * @constructor
 */
o3d.ParamFloat = function() {
  o3d.Param.call(this);
  this.value = 0.0;
};
o3d.inherit('ParamFloat', 'Param');


/**
 * @constructor
 */
o3d.ParamFloat2 = function() {
  o3d.Param.call(this);
  this.value = [0.0, 0.0];
};
o3d.inherit('ParamFloat2', 'Param');


/**
 * @constructor
 */
o3d.ParamFloat3 = function() {
  o3d.Param.call(this);
  this.value = [0.0, 0.0, 0.0];
};
o3d.inherit('ParamFloat3', 'Param');


/**
 * @constructor
 */
o3d.ParamFloat4 = function() {
  o3d.Param.call(this);
  this.value = [0.0, 0.0, 0.0, 0.0];
};
o3d.inherit('ParamFloat4', 'Param');


/**
 * @constructor
 */
o3d.ParamFunction = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamFunction', 'Param');


/**
 * @constructor
 */
o3d.ParamInteger = function() {
  o3d.Param.call(this);
  this.value = 0;
};
o3d.inherit('ParamInteger', 'Param');


/**
 * @constructor
 */
o3d.ParamMaterial = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamMaterial', 'Param');


/**
 * @constructor
 */
o3d.ParamMatrix4 = function() {
  o3d.Param.call(this);
  this.value = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
};
o3d.inherit('ParamMatrix4', 'Param');


/**
 * @constructor
 */
o3d.ParamParamArray = function() {
  o3d.Param.call(this);
  this.value = [];
};
o3d.inherit('ParamParamArray', 'Param');


/**
 * @constructor
 */
o3d.ParamRenderSurface = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamRenderSurface', 'Param');


/**
 * @constructor
 */
o3d.ParamRenderDepthStencilSurface = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamRenderDepthStencilSurface', 'Param');


/**
 * @constructor
 */
o3d.ParamSampler = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamSampler', 'Param');


/**
 * @constructor
 */
o3d.ParamSkin = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamSkin', 'Param');


/**
 * @constructor
 */
o3d.ParamSteamBank = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamSteamBank', 'Param');


/**
 * @constructor
 */
o3d.ParamState = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamState', 'Param');


/**
 * @constructor
 */
o3d.ParamStreamBank = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamStreamBank', 'Param');


/**
 * @constructor
 */
o3d.ParamString = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamString', 'Param');


/**
 * @constructor
 */
o3d.ParamTexture = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamTexture', 'Param');


/**
 * @constructor
 */
o3d.ParamTransform = function() {
  o3d.Param.call(this);
  this.value = null;
};
o3d.inherit('ParamTransform', 'Param');


/**
 * Base class for the types of matrix4 params that compute their own
 * value when asked (ProjectionParamMatrix4 etc).
 * @constructor
 */
o3d.CompositionParamMatrix4 = function() {
  o3d.ParamMatrix4.call(this);
  this.matrix_names_ = [];
};
o3d.inherit('CompositionParamMatrix4', 'ParamMatrix4');

/**
 * The array of names of matrix params for the matrices that are to be
 * composed to get the value.
 * @type {Array.<o3d.ParamMatrix4>}
 */
o3d.CompositionParamMatrix4.prototype.matrix_names_ = [];

/**
 * Whether the inverse is taken right before returning the value.
 * @type {Array.<o3d.ParamMatrix4>}
 */
o3d.CompositionParamMatrix4.prototype.inverse_ = false;


/**
 * Whether the inverse is taken right before returning the value.
 * @type {Array.<o3d.ParamMatrix4>}
 */
o3d.CompositionParamMatrix4.prototype.transpose_ = false;

o3d.CompositionParamMatrix4.prototype.__defineGetter__('value',
    // TODO(petersont): Cache the result if it hasn't changed.
    function() {
      var product = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
      for (var i = 0; i < this.matrix_names_.length; ++i) {
        o3d.Transform.compose(product, o3d.Param.SAS[this.matrix_names_[i]]);
      }
      if (this.inverse_) {
        o3d.Transform.inverse(product);
      }
      if (this.transpose_) {
        o3d.Transform.transpose(product);
      }
      return product;
    }
);

o3d.CompositionParamMatrix4.prototype.__defineSetter__('value',
    function(value) { }
);


/**
 * @constructor
 */
o3d.ProjectionParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['projection'];
};
o3d.inherit('ProjectionParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ProjectionInverseParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['projection'];
  this.inverse_ = true;
};
o3d.inherit('ProjectionInverseParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ProjectionTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['projection'];
  this.transpose_ = true;
};
o3d.inherit('ProjectionTransposeParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ProjectionInverseTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['projection'];
  this.inverse_ = true;
  this.transpose_ = true;
};
o3d.inherit('ProjectionInverseTransposeParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view'];
};
o3d.inherit('ViewParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewInverseParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view'];
  this.inverse_ = true;
};
o3d.inherit('ViewInverseParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view'];
  this.transpose_ = true;
};
o3d.inherit('ViewTransposeParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewInverseTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view'];
  this.inverse_ = true;
  this.transpose_ = true;
};
o3d.inherit('ViewInverseTransposeParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewProjectionParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['viewProjection'];
};
o3d.inherit('ViewProjectionParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewProjectionInverseParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['viewProjection'];
  this.inverse_ = true;
};
o3d.inherit('ViewProjectionInverseParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewProjectionTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['viewProjection'];
  this.transpose_ = true;
};
o3d.inherit('ViewProjectionTransposeParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.ViewProjectionInverseTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['viewProjection'];
  this.inverse_ = true;
  this.transpose_ = true;
};
o3d.inherit('ViewProjectionInverseTransposeParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['world'];
};
o3d.inherit('WorldParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldInverseParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['world'];
  this.inverse_ = true;
};
o3d.inherit('WorldInverseParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['world'];
  this.transpose_ = true;
};
o3d.inherit('WorldTransposeParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldInverseTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['world'];
  this.inverse_ = true;
  this.transpose_ = true;
};
o3d.inherit('WorldInverseTransposeParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view', 'world'];
};
o3d.inherit('WorldViewParamMatrix4', 'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewInverseParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view', 'world'];
  this.inverse_ = true;
};
o3d.inherit('WorldViewInverseParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view', 'world'];
  this.transpose_ = true;
};
o3d.inherit('WorldViewTransposeParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewInverseTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['view', 'world'];
  this.inverse_ = true;
  this.transpose_ = true;
};
o3d.inherit('WorldViewInverseTransposeParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewProjectionParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['worldViewProjection'];
};
o3d.inherit('WorldViewProjectionParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewProjectionInverseParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['worldViewProjection'];
  this.inverse_ = true;
};
o3d.inherit('WorldViewProjectionInverseParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewProjectionTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['worldViewProjection'];
  this.transpose_ = true;
};
o3d.inherit('WorldViewProjectionTransposeParamMatrix4',
    'CompositionParamMatrix4');


/**
 * @constructor
 */
o3d.WorldViewProjectionInverseTransposeParamMatrix4 = function() {
  o3d.CompositionParamMatrix4.call(this);
  this.matrix_names_ = ['worldViewProjection'];
  this.inverse_ = true;
  this.transpose_ = true;
};
o3d.inherit('WorldViewProjectionInverseTransposeParamMatrix4',
    'CompositionParamMatrix4');

/**
 * Called to specify the value of a uniform variable.
 */
o3d.ParamFloat.prototype.applyToLocation = function(gl, location) {
  gl.uniform1f(location, this.value);
};

/**
 * Called to specify the value of a uniform variable.
 */
o3d.ParamFloat2.prototype.applyToLocation = function(gl, location) {
  gl.uniform2fv(location, this.value);
};

/**
 * Called to specify the value of a uniform variable.
 */
o3d.ParamFloat3.prototype.applyToLocation = function(gl, location) {
  gl.uniform3fv(location, this.value);
};

/**
 * Called to specify the value of a uniform variable.
 */
o3d.ParamFloat4.prototype.applyToLocation = function(gl, location) {
  gl.uniform4fv(location, this.value);
};

/**
 * Called to specify the value of a uniform variable.
 */
o3d.ParamMatrix4.prototype.applyToLocation = function(gl, location) {
  gl.uniformMatrix4fv(location,
                      false,
                      o3d.Transform.flattenMatrix4(this.value));
};

/**
 * A counter to ensure each texture sampler gets a unqiue id.
 * @private
 */
o3d.Param.texture_index_ = 0;

/**
 * Called to specify the value of a uniform variable.
 */
o3d.ParamSampler.prototype.applyToLocation = function(gl, location) {
  // When before the effect object assigns values to parameters,
  // it sets this variable to 0.
  var i = o3d.Param.texture_index_;
  gl.activeTexture(gl.TEXTURE0 + i);

  var value = null;
  var target = 0;

  if (this.value) {
    this.value.bindAndSetParameters_();
    gl.uniform1i(location, i);
    o3d.Param.texture_index_++;
  }
};


/**
 * Object to compute all combinations of world/view/projection
 * inverse/transpose matrices and provide them as parameters.
 *
 * @type {o3d.ParamObject}
 */
o3d.Param.SAS = new o3d.ParamObject;

o3d.Param.SAS.createParam('world',
    'WorldParamMatrix4');
o3d.Param.SAS.createParam('view',
    'ViewParamMatrix4');
o3d.Param.SAS.createParam('projection',
    'ProjectionParamMatrix4');
o3d.Param.SAS.createParam('worldView',
    'WorldViewParamMatrix4');
o3d.Param.SAS.createParam('viewProjection',
    'ViewProjectionParamMatrix4');
o3d.Param.SAS.createParam('worldViewProjection',
    'WorldViewProjectionParamMatrix4');

o3d.Param.SAS.createParam('worldInverse',
    'WorldInverseParamMatrix4');
o3d.Param.SAS.createParam('viewInverse',
    'ViewInverseParamMatrix4');
o3d.Param.SAS.createParam('projectionInverse',
    'ProjectionInverseParamMatrix4');
o3d.Param.SAS.createParam('worldViewInverse',
    'WorldViewInverseParamMatrix4');
o3d.Param.SAS.createParam('viewProjectionInverse',
    'ViewProjectionInverseParamMatrix4');
o3d.Param.SAS.createParam('worldViewProjectionInverse',
    'WorldViewProjectionInverseParamMatrix4');

o3d.Param.SAS.createParam('worldTranspose',
    'WorldInverseParamMatrix4');
o3d.Param.SAS.createParam('viewTranspose',
    'ViewTransposeParamMatrix4');
o3d.Param.SAS.createParam('projectionTranspose',
    'ProjectionTransposeParamMatrix4');
o3d.Param.SAS.createParam('worldViewTranspose',
    'WorldViewTransposeParamMatrix4');
o3d.Param.SAS.createParam('viewProjectionTranspose',
    'ViewProjectionTransposeParamMatrix4');
o3d.Param.SAS.createParam('worldViewProjectionTranspose',
    'WorldViewProjectionTransposeParamMatrix4');

o3d.Param.SAS.createParam('worldInverseTranspose',
    'WorldInverseTransposeParamMatrix4');
o3d.Param.SAS.createParam('viewInverseTranspose',
    'ViewInverseTransposeParamMatrix4');
o3d.Param.SAS.createParam('projectionInverseTranspose',
    'ProjectionInverseTransposeParamMatrix4');
o3d.Param.SAS.createParam('worldViewInverseTranspose',
    'WorldViewInverseTransposeParamMatrix4');
o3d.Param.SAS.createParam('viewProjectionInverseTranspose',
    'ViewProjectionInverseTransposeParamMatrix4');
o3d.Param.SAS.createParam('worldViewProjectionInverseTranspose',
    'WorldViewProjectionInverseTransposeParamMatrix4');

/**
 * Sets the base world matrix that gets use to compute all other products for
 * SAS parameters.
 */
o3d.Param.SAS.setWorld = function(world) {
  this['world'] = world;
};

/**
 * Sets the base world matrix that gets use to compute all other products for
 * SAS parameters.
 */
o3d.Param.SAS.setView = function(view) {
  this['view'] = view;
};

/**
 * Sets the base world matrix that gets use to compute all other products for
 * SAS parameters.
 */
o3d.Param.SAS.setProjection = function(projection) {
  this['projection'] = projection;
};

/**
 * Sets the viewProjection matrix.
 */
o3d.Param.SAS.setViewProjection = function(viewProjection) {
  this['viewProjection'] = viewProjection;
};

/**
 * Sets the worldViewProjection matrix.
 */
o3d.Param.SAS.setWorldViewProjection = function(worldViewProjection) {
  this['worldViewProjection'] = worldViewProjection;
};
