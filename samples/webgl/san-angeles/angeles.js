
var canvas = null;
var gl = null;
var start_time = null;

function main() {
  canvas = document.getElementById("c");
  gl = canvas.getContext("GL");

  gl.clearColor(0., 0., 0., 1.);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.flush();

  // hack to get mozilla to draw black and update the UI before runnign the
  // precompute
  setTimeout(init, 200);
}

function init() {
  appInit();
  start_time = (new Date()).getTime();
  setTimeout(render, 0);
}

function render() {
  appRender((new Date()).getTime() - start_time,
            canvas.width, canvas.height);
  gl.flush();
  setTimeout(render, 0);
}
