// For configurable directory for the resource, this needs to be prepended
// to the glue code. (Use with --pre-js option)
// See: https://kripken.github.io/emscripten-site/docs/api_reference/module.html#Module.locateFile
var Module = {
  locateFile: function(path) {
    return '../build/' + path;
  }
};
