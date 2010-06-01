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
 * The Buffer object is a low level container for a flat list of
 * floating point or integer values. These are currently used to define
 * geometry.
 * @constructor
 */
o3d.Buffer = function() {
  this.fields_ = [];
  this.array_ = null;
};
o3d.inherit('Buffer', 'NamedObject');


/**
 * A private array to hold the fields.
 * @type {!Array.<o3d.Field>}
 */
o3d.Buffer.prototype.fields_ = [];


/**
 * Total number of components.
 * @type {number}
 */
o3d.Buffer.prototype.totalComponents = 0;

/**
 * Index of the corresponding gl buffer object.
 * @type {number}
 */
o3d.Buffer.prototype.gl_buffer_ = 0;

/**
 * Type of the array element.
 * @type {!WebGLFloatArray}
 */
o3d.Buffer.prototype.ArrayType = WebGLFloatArray;

/**
 * Allocates memory for the data to be stored in the buffer based on
 * the types of fields set on the buffer.
 * 
 * @param {number} numElements Number of elements to allocate..
 * @return {boolean}  True if operation was successful.
 */
o3d.Buffer.prototype.allocateElements =
    function(numElements) {
  var total = 0;
  for (var i = 0; i < this.fields_.length; ++i) {
    this.fields_[i].offset_ = total;
    total += this.fields_[i].numComponents;
  }
  this.totalComponents = total;

  this.resize(numElements * this.totalComponents);
};

/**
 * Reallocate the array element to have the given number of elements.
 * @param {number} numElements The new number of elements.
 */
o3d.Buffer.prototype.resize = function(numElements) {
  this.gl_buffer_ = this.gl.createBuffer();
  // Callers (in particular the deserializer) occasionally call this
  // with floating-point numbers.
  this.array_ = new this.ArrayType(Math.floor(numElements));
};

/**
 * Defines a field on this buffer.
 * 
 * Note: Creating a field after having allocated the buffer is an expensive
 * operation as the data currently in the buffer has to be shuffled around
 * to make room for the new field.
 * 
 * @param {string} field_type type of data in the field. Valid types
 *     are "FloatField", "UInt32Field", and "UByteNField".
 * @param {number} num_components number of components in the field.
 * @return {!o3d.Field}  The created field.
 */
o3d.Buffer.prototype.createField =
    function(fieldType, numComponents) {
  var f = new o3d.Field();
  f.buffer = this;
  f.numComponents = numComponents;
  f.size = numComponents * (fieldType=='UByteNField' ? 1 : 4);
  this.fields_.push(f);
  return f;
};


/**
 * Removes a field from this buffer.
 * 
 * Note: Removing a field after having allocated the buffer is an expensive
 * operation as the data currently in the buffer has to be shuffled around
 * to remove the old field.
 * 
 * @param {!o3d.Field} field field to remove.
 */
o3d.Buffer.prototype.removeField =
    function(field) {
  var i = 0;
  for (var j = 0; j < this.fields_.length; ++j) {
    if (this.fields_[i] == field)
      j++;
    this.fields_[j] = this.fields_[i];
    i++;
  }
  if (this.fields_.length > i) {
    this.fields_.pop();
  }
};


/**
 * Prepares the buffer for read/write.
 */
o3d.Buffer.prototype.lock = function() {
  // For now, this doesn't need to do anything.
};


/**
 * Delivers the buffer to the graphics hardware when read/write is finished.
 */
o3d.Buffer.prototype.unlock = function() {
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl_buffer_);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, this.array_, this.gl.STATIC_DRAW);
};


/**
 * Sets the values in the buffer given array.
 * TODO(petersont): This should take other kinds of arguments, like RawData.
 * 
 * @param {!Array.<number>} values contains data to assign to the Buffer
 *     data itself.
 * @return {boolean}  True if operation was successful.
 */
o3d.Buffer.prototype.set =
    function(values) {
  if (this.array_ == null) {
    this.resize(values.length);
  }
  this.lock();
  for (var i = 0; i < values.length; ++i) {
    this.array_[i] = values[i];
  }
  this.unlock();
};


/**
 * The total components in all fields in this buffer.
 * @type {number}
 */
o3d.Buffer.prototype.total_components = 0;


/**
 * VertexBufferBase is a the base class for both VertexBuffer and SourceBuffer
 * @constructor
 */
o3d.VertexBufferBase = function() {
  o3d.Buffer.call(this);
};
o3d.inherit('VertexBufferBase', 'Buffer');


/**
 * Gets a copy of the values of the data stored in the buffer.
 * Modifying this copy has no effect on the buffer.
 */
o3d.VertexBufferBase.prototype.get = function() {
  o3d.notImplemented();
};


/**
 * Gets a copy of a sub range of the values in the data stored in the buffer.
 * Modifying this copy has no effect on the buffer.
 * 
 * @param {number} start_index index of the element value to get.
 * @param {number} numElements the number of elements to get.
 * @return {!Array.<number>}  An array of values.
 */
o3d.VertexBufferBase.prototype.getAt =
    function(start_index, numElements) {
};


/**
 * VertexBuffer is a Buffer object used for storing vertex data for geometry.
 * (e.g. vertex positions, normals, colors, etc).
 * A VertexBuffer can be rendered directly by the GPU.
 * @constructor
 */
o3d.VertexBuffer = function() {
  o3d.Buffer.call(this);
};
o3d.inherit('VertexBuffer', 'Buffer');

/**
 * The name of the class as a string.
 * @type {string}
 */
o3d.VertexBuffer.prototype.className = "o3d.VertexBuffer";


/**
 * SourceBuffer is a Buffer object used for storing vertex data for
 * geometry. (e.g. vertex positions, normals, colors, etc).
 * 
 * A SourceBuffer is the source for operations like skinning and morph
 * targets. It can not be directly rendered by the GPU.
 * @constructor
 */
o3d.SourceBuffer = function() {
  o3d.Buffer.call(this);
};
o3d.inherit('SourceBuffer', 'Buffer');


/**
 * IndexBuffer is a buffer object used for storing geometry index data (e.g.
 * triangle indices).
 * @constructor
 */
o3d.IndexBuffer = function() {
  o3d.Buffer.call(this);
};
o3d.inherit('IndexBuffer', 'Buffer');


/**
 * Type of the array element.
 * @type {!WebGLUnsignedShortArray}
 */
o3d.IndexBuffer.prototype.ArrayType = WebGLUnsignedShortArray;


/**
 * Delivers the buffer to the graphics hardware when read/write is finished.
 */
o3d.IndexBuffer.prototype.unlock = function() {
  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl_buffer_);
  this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER, this.array_, this.gl.STATIC_DRAW);
};
