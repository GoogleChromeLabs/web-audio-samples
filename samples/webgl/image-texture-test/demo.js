
var gl = null;
var g_width = 0;
var g_height = 0;
var g_texture = null;
var g_textureLoc = -1;
var g_programObject = null;
var g_vbo = null;
var g_texCoordOffset=0;

function main() {
  var c = document.getElementById("c");
  gl = c.getContext("GL");
  g_width = c.width;
  g_height = c.height;
  init();
}

function init() {
  gl.clearColor(0., 0., .7, 1.);
  g_texture = loadTexture("test_texture.jpg");
  initShaders();
}

function checkGLError() {
  var error = gl.getError();
  if (error != gl.NO_ERROR) {
    var str = "GL Error: " + error;
    document.body.appendChild(document.createTextNode(str));
    throw str;
  }
}

function loadShader(type, shaderSrc) {
  var shader = gl.createShader(type);
  if (shader == null) {
    return null;
  }
  // Load the shader source
  gl.shaderSource(shader, shaderSrc);
  // Compile the shader
  gl.compileShader(shader);
  // Check the compile status
  if (gl.getShaderi(shader, gl.COMPILE_STATUS) == 0) {
    var infoLog = gl.getShaderInfoLog(shader);
    alert("Error compiling shader:\n" + infoLog);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initShaders() {
  var vShaderStr = [
    "attribute vec3 g_Position;",
    "attribute vec2 g_TexCoord0;",
    "varying vec2 texCoord;",
    "void main()",
    "{",
    "   gl_Position = vec4(g_Position.x, g_Position.y, g_Position.z, 1.0);",
    "   texCoord = g_TexCoord0;",
    "}"
  ].join("\n");
  var fShaderStr = [
    "uniform sampler2D tex;",
    "varying vec2 texCoord;",
    "void main()",
    "{",
    "  gl_FragColor = texture2D(tex, texCoord);",
    "}"
  ].join("\n");

  var vertexShader = loadShader(gl.VERTEX_SHADER, vShaderStr);
  var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fShaderStr);
  // Create the program object
  var programObject = gl.createProgram();
  if (programObject == null) {
    alert("Creating program failed");
    return;
  }
  gl.attachShader(programObject, vertexShader);
  gl.attachShader(programObject, fragmentShader);
  // Bind g_Position to attribute 0   
  // Bind g_TexCoord0 to attribute 1   
  gl.bindAttribLocation(programObject, 0, "g_Position");
  gl.bindAttribLocation(programObject, 1, "g_TexCoord0");
  // Link the program
  gl.linkProgram(programObject);
  // Check the link status
  var linked = gl.getProgrami(programObject, gl.LINK_STATUS);
  if (linked == 0) {
    var infoLog = gl.getProgramInfoLog(programObject);
    alert("Error linking program:\n" + infoLog);
    gl.deleteProgram(programObject);
    return;
  }
  g_programObject = programObject;
  g_textureLoc = gl.getUniformLocation(g_programObject, "tex");
  checkGLError();
  g_vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo);
  var vertices = new CanvasFloatArray([
      0.25,  0.75, 0.0,
     -0.75,  0.75, 0.0,
     -0.75, -0.25, 0.0,
      0.25,  0.75, 0.0,
     -0.75, -0.25, 0.0,
      0.25, -0.25, 0.0]);
  var texCoords = new CanvasFloatArray([
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 1.0,
      0.0, 0.0,
      1.0, 0.0]);
  g_texCoordOffset = vertices.alignedSizeInBytes();
  gl.bufferData(gl.ARRAY_BUFFER,
                  g_texCoordOffset + texCoords.alignedSizeInBytes(),
                  gl.STATIC_DRAW);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
  gl.bufferSubData(gl.ARRAY_BUFFER, g_texCoordOffset, texCoords);
  checkGLError();
}

function draw() {
  // Note: the viewport is automatically set up to cover the entire Canvas.
  // Clear the color buffer
  gl.clear(gl.COLOR_BUFFER_BIT);
  checkGLError();
  // Use the program object
  gl.useProgram(g_programObject);
  checkGLError();
  // Load the vertex data
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 0, g_texCoordOffset);
  checkGLError();
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, g_texture);
  checkGLError();
  // Point the uniform sampler to texture unit 0
  gl.uniform1i(g_textureLoc, 0);
  checkGLError();
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  checkGLError();
  gl.flush();
}

function loadTexture(src) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  var image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, image, true);
    checkGLError();
    draw();
  }
  image.src = src;
  return texture;
}
