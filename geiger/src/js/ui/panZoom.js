
/**
 * Enable Pan Zoom by drag and mousewheel
 * @credit inspired by http://fabricjs.com/fabric-intro-part-5
 * @param {!fabric.Canvas} canvas 
 */
export const enablePanZoom = (canvas) => {
  canvas.on('mouse:down', function(opt) {
    var evt = opt.e;
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  });

  canvas.on('mouse:move', function(opt) {
    if (this.isDragging) {
      var e = opt.e;
      this.viewportTransform[4] += e.clientX - this.lastPosX;
      this.viewportTransform[5] += e.clientY - this.lastPosY;
      this.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  });

  canvas.on('mouse:up', function(opt) {
    this.isDragging = false;
    this.selection = true;
    if (opt.target) {
      console.log(opt.target.id);
      
    }
    // after panning, we have to setCoords in order to select objects
    // @credit: https://stackoverflow.com/a/49850382
    this.forEachObject(obj => {
      obj.setCoords();
    });
    this.requestRenderAll();
  });

  canvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    // var pointer = canvas.getPointer(opt.e);
    var zoom = canvas.getZoom();
    zoom = zoom - delta/300;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.1) zoom = 0.1;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
}