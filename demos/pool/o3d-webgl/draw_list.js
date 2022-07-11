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
 * A DrawList gets used during rendering to collect DrawElements to
 * render.  Each Material references a DrawList.  Depending on the material, as
 * DrawElements get collected they will be put on different DrawLists.
 * @constructor
 */
o3d.DrawList = function() {
  o3d.NamedObject.call(this);
  this.list_ = [];
};
o3d.inherit('DrawList', 'NamedObject');

/**
 * Private list to actually hold the DrawElements
 * @type {!Array.<!Object>}
 */
this.list_ = [];


/**
 * @type {number}
 */
o3d.DrawList.SortMethod = goog.typedef;


/**
 *  SortMethod,
 *    BY_PERFORMANCE
 *    BY_Z_ORDER
 *    BY_PRIORITY
 *
 * Method to sort DrawList by.
 */
o3d.DrawList.BY_PERFORMANCE = 0;
o3d.DrawList.BY_Z_ORDER = 1;
o3d.DrawList.BY_PRIORITY = 2;


/**
 * Renders the draw list.
 */
o3d.DrawList.prototype.render = function() {
  // TODO(petersont): Add sort.
  for (var i = 0; i < this.list_.length; ++i) {
    var drawElementInfo = this.list_[i];
    var world = drawElementInfo.world;
    var view = drawElementInfo.view;
    var viewProjection = drawElementInfo.viewProjection;
    var worldViewProjection = drawElementInfo.worldViewProjection;
    var projection = drawElementInfo.projection;
    var transform = drawElementInfo.transform;
    var drawElement = drawElementInfo.drawElement;
    var element = drawElementInfo.drawElement.owner;
    var material = drawElementInfo.drawElement.material ||
                   drawElementInfo.drawElement.owner.material;
    var effect = material.effect;

    o3d.Param.SAS.setWorld(world);
    o3d.Param.SAS.setView(view);
    o3d.Param.SAS.setProjection(projection);
    o3d.Param.SAS.setViewProjection(viewProjection);
    o3d.Param.SAS.setWorldViewProjection(worldViewProjection);

    var paramObjects = [
      transform,
      drawElement,
      element,
      material,
      effect,
      o3d.Param.SAS
    ];

    effect.searchForParams_(paramObjects);
    element.render();
  }
};


