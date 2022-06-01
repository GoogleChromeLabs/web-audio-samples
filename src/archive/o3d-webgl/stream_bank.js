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
 * The StreamBank a collection of streams that hold vertices.
 * @constructor
 */
o3d.StreamBank = function() {
  o3d.NamedObject.call(this);
  this.vertexStreams = [];
};
o3d.inherit('StreamBank', 'NamedObject');

/**
 * Array of streams.
 */
o3d.StreamBank.prototype.vertexStreams = [];


/**
 * Binds a VertexBuffer field to the StreamBank and defines how the data in
 * the buffer should be interpreted. The field's buffer must be of a
 * compatible type otherwise the binding fails and the function returns false.
 * @param {o3d.Stream.Semantic} semantic The particular use of this stream.
 * @param {number} semantic_index Which index of a particular semantic to use.
 * @param {o3d.Field} field The field containing information for this stream.
 * @param {number} start_index The first element to use.
 * @return {boolean}  True if successful.
 */
o3d.StreamBank.prototype.setVertexStream =
    function(semantic, semantic_index, field, start_index) {
  if (this.vertexStreams[semantic] == undefined) {
    this.vertexStreams[semantic] = [];
  }
  this.vertexStreams[semantic][semantic_index] = new o3d.Stream(
    semantic, semantic_index, field, start_index);
};


/**
 * Searches the vertex streams bound to the StreamBank for one with the given
 * stream semantic.  If a stream is not found then it returns null.
 * @param {o3d.Stream.Semantic} semantic The particular use of this stream.
 * @param {o3d.Stream.Semantic} semantic_index Which index of a particular
 *     semantic to use.
 * @return {o3d.Stream}  The found stream or null if it does not exist.
 */
o3d.StreamBank.prototype.getVertexStream =
    function(semantic, semantic_index) {
  if (this.vertexStreams[semantic] == undefined) {
    return;
  }
  return this.vertexStreams[semantic][semantic_index];
};


/**
 * Removes a vertex stream from this StreamBank.
 * @param {o3d.Stream.Semantic} semantic The particular use of this stream.
 * @param {o3d.Stream.Semantic} semantic_index Which index of a particular
 *     semantic to use.
 * @return {boolean}  true if the specified stream existed.
 */
o3d.StreamBank.prototype.removeVertexStream =
    function(semantic, semantic_index) {
  if (this.vertexStreams[semantic] == undefined) {
    return false;
  }
  this.vertexStreams[semantic][semantic_index] = null;
  return true;
};


