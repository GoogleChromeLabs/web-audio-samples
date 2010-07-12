// This file comes from Box2D-JS, Copyright (c) 2008 ANDO Yasushi.
// The original version is available at http://box2d-js.sourceforge.net/ under the
// zlib/libpng license (see License.txt).
// This version has been modified to make it work with O3D.

o3djs.require('o3djs.util');
o3djs.require('o3djs.math');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.primitives');
o3djs.require('o3djs.picking');

var initId = 0;
var world;
var canvasWidth;
var canvasHeight;
var canvasTop;
var canvasLeft;


// Audio stuff
var gCount = 0;

var pingFileName = "../sounds/hyper-reality/filter-noise-3.aif";
var pingBuffer = 0;

// Callback when a collision occurs
function countContact(body1, body2) {
  gCount++;

  var velocity1 = body1.GetLinearVelocity();
  var velocity2 = body2.GetLinearVelocity();

  var v1 = velocity1.Length();
  var v2 = velocity2.Length();
  var maxV = v1 > v2 ? v1 : v2;

  // base volume on velocity
  var xx = maxV / 200.0 /*50.0*/;
  if (xx > 1.0) xx = 1.0;
  if (xx < 0.0) xx = 0.0;
  var s = Math.sin(0.5 * xx * Math.PI);
  s = s*s;
  var gain = s; //Math.sqrt(s);  // base volume on velocity

  var position1 = body1.GetCenterPosition();
  var position2 = body2.GetCenterPosition();
  var x = v1 > v2 ? position1.x : position2.x;
  var y = position1.y;
  
  if (gCount > 0) {
    var ping = xaudio.getVoice();

    if (ping) {
      var isQuiet = (gain < 0.5);
      ping.buffer = pingBuffer; // isQuiet ? quietBuffer : pingBuffer;


      ping.sendGain = gain < 0.25 ? 0.6 : 0.25;
      ping.mainGain = gain;  //isQuiet ? 0.0 : gain;
      
      // Randomize pitch          
      var r = Math.random();
      var cents = 600.0 * (r - 0.5);
      var rate = Math.pow(2.0, cents / 1200.0);
      ping.playbackPitch = rate;  // really rate (not pitch)
      
      // Adjust filter
      var value = 0.5 + 0.5 * xx;
      var noctaves = Math.log(22050.0 / 40.0) / Math.LN2;
      var v2 = Math.pow(2.0, noctaves * (value - 1.0));
      
      var sampleRate = 44100.0;
      var nyquist = sampleRate * 0.5;
      ping.effect.param1 = v2;
      ping.effect.param2 = 5.0; // resonance
      
      var azimuth = 0.5*Math.PI * (x - 200.0 /*250.0*/) / 150.0;
      if (azimuth < -0.5*Math.PI) azimuth = -0.5*Math.PI;
      if (azimuth > 0.5*Math.PI) azimuth = 0.5*Math.PI;
      
      var posX = 10.0 * Math.sin(azimuth);
      var posZ = 10.0 * Math.cos(azimuth);
      
      
      var elevation = -0.5*Math.PI * (y - 250.0) / 150.0;
      if (elevation < -0.5*Math.PI) elevation = -0.5*Math.PI;
      if (elevation > 0.5*Math.PI) elevation = 0.5*Math.PI;
      
      var scaleY = Math.sin(elevation);
      var scaleXZ = Math.cos(elevation);
      posX *= scaleXZ;
      posZ *= scaleXZ;
      var posY = scaleY * 10.0;
      
      ping.setPosition(posX, posY /*0*/, isQuiet ? +posZ : -posZ);

      var when = 0.020 * Math.random();

      ping.play(when);
    }
  }
}

function setupWorld(did) {
    var transforms = g.client.getObjectsByClassName('o3d.Transform');
    for (var tt = 0; tt < transforms.length; ++tt) {
      var transform = transforms[tt];
      if (transform.clientId != g.root.clientId &&
          transform.clientId != g.client.root.clientId) {
        transform.parent = null;
        g.pack.removeObject(transform);
      }
    }
  if (!did) did = 0;
  world = createWorld();
  initId += did;
  initId %= demos.InitWorlds.length;
  if (initId < 0) initId = demos.InitWorlds.length + initId;
  demos.InitWorlds[initId](world);
}
function setupNextWorld() { setupWorld(1); }
function setupPrevWorld() { setupWorld(-1); }
function step(elapsedTime) {
  // NOTE: changed to use the renderEvent's elapsed time instead of
  // javascript timers. The check below makes the physics never do a time step
  // slower that 1/30th of a second because collision bugs will happen.
  if (elapsedTime > 1 / 30) {
    elapsedTime = 1 / 30;
  }
  var stepping = false;
  var timeStep = elapsedTime;
  var iteration = 1;
  if (world) {
    world.Step(timeStep, iteration);
    drawWorld(world);
  }
}

// When the sample is running in V8, window.g is the browser's global object and
// g is v8's. When the sample is running only in the browser, they are the same
// object.
window.g = {};

// A global object to track stuff with.
var g = {
  o3dWidth: -1,  // width of our client area
  o3dHeight: -1,  // height of our client area
  materials: [],  // all our materials
  shapes: []  // all our shapes
};

/**
 * Sets up the o3d stuff.
 * @param {HTML element} o3dElement The o3d object element.
 */
function setupO3D(o3dElement) {
  // Initializes global variables and libraries.
  g.o3dElement = o3dElement;
  g.o3d = o3dElement.o3d;
  g.math = o3djs.math;
  g.client = o3dElement.client;
  g.mgr = new O3DManager();

  // The browser needs to be able to see these globals so that it can
  // call unload later.
  window.g.client = g.client;

  // Get the width and height of our client area.
  g.o3dWidth = g.client.width;
  g.o3dHeight = g.client.height;

  // Creates a pack to manage our resources/assets
  g.pack = g.client.createPack();

  // Create the render graph for a view.
  g.viewInfo = o3djs.rendergraph.createBasicView(
      g.pack,
      g.client.root,
      g.client.renderGraphRoot);

  // Create an object to hold global params.
  g.globalParamObject = g.pack.createObject('ParamObject');
  g.lightWorldPosParam = g.globalParamObject.createParam('lightWorldPos',
                                                         'ParamFloat3');
  g.lightColorParam = g.globalParamObject.createParam('lightColor',
                                                      'ParamFloat4');
  g.lightWorldPosParam.value = [200, -1500, -1000];
  g.lightColorParam.value = [1, 1, 1.0, 1.0];

  // Create Materials.
  g.materials = [];
  var material = g.pack.createObject('Material');
  var effect = g.pack.createObject('Effect');
  effect.loadFromFXString(document.getElementById('shader').value);
  material.effect = effect;
  effect.createUniformParameters(material);
  material.getParam('lightWorldPos').bind(g.lightWorldPosParam);
  material.getParam('lightColor').bind(g.lightColorParam);
  material.getParam('emissive').set(0, 0, 0, 1);
  material.getParam('ambient').set(0, 0, 0, 1);
  material.getParam('specular').set(1, 1, 1, 1);
  material.getParam('shininess').value = 20;
  material.drawList = g.viewInfo.performanceDrawList;
  g.materials[0] = material;

  // Create a kind of checkboardish texture.
  var pixels = [];
  for (var y = 0; y < 32; ++y) {
    for (var x = 0; x < 32; ++x) {
      var offset = (y * 32 + x) * 3;  // rgb
      var u = x / 32 * Math.PI * 0.5;
      var v = y / 32 * Math.PI * 0.5;
      pixels[offset + 0] = 1;//Math.sin(Math.PI * 32 / x) * 0.2 + 0.8;  // red
      pixels[offset + 1] = Math.floor(x / 8) % 2 * 0.2 + 0.8;  // green
      pixels[offset + 2] = Math.floor(y / 8) % 2 * 0.5 + 0.5;  // blue
    }
  }
  var texture = g.pack.createTexture2D(32, 32, g.o3d.Texture.XRGB8, 1, false);
  texture.set(0, pixels);
  var samplerParam = material.getParam('diffuseSampler');
  var sampler = g.pack.createObject('Sampler');
  samplerParam.value = sampler;
  sampler.texture = texture;

  // Creates a transform to put our data on.
  g.root = g.pack.createObject('Transform');
  g.root.parent = g.client.root;

  // make a cube for drawing lines
  g.lineShape = o3djs.primitives.createRainbowCube(
      g.pack,
      g.materials[0],
      1,
      g.math.matrix4.translation([0, 0.5, 0]));

  // Set the projection matrix
  g.viewInfo.drawContext.projection = g.math.matrix4.perspective(
      g.math.degToRad(45),
      g.o3dWidth / g.o3dHeight,
      0.1,
      10000);

  // Set the view matrix.
  g.viewInfo.drawContext.view = g.math.matrix4.lookAt(
      [100, -50, -600],
      [250, 80, 0],
      [0, -1, 0]);

  // Make copies of the view and projection matrix to get fast access to them.
  g.projectionMatrix = g.math.matrix4.copy(g.viewInfo.drawContext.projection);
  g.viewMatrix = g.math.matrix4.copy(g.viewInfo.drawContext.view);

  // Make a bounding box to use for picking.
  g.worldBox = g.o3d.BoundingBox([0, -100, 0],
                                 [500, 250, 5]);

  // Steps the physics with a time of zero. This is left over from the orignial
  // code.
  step(0);

  g.client.setRenderCallback(o3dOnRender);
}

/**
 * Called just before rendering each frame.
 * @param {o3d.RenderEvent} renderEvent The render event passed by
 *     o3d.
 */
function o3dOnRender(renderEvent) {
  var newWidth = g.client.width;
  var newHeight = g.client.height;
  if (newWidth != g.o3dWidth || newHeight != g.o3dHeight) {
    g.o3dWidth = newWidth;
    g.o3dHeight = newHeight;

    // Adjust the projection matrix.
    var projectionMatrix = g.math.matrix4.perspective(g.math.degToRad(45),
                                                      g.o3dWidth / g.o3dHeight,
                                                      0.1,
                                                      10000);
    g.viewInfo.drawContext.projection = projectionMatrix;
    g.projectionMatrix = projectionMatrix;
  }
  step(renderEvent.elapsedTime);
}

/**
 * This is the original setup code modified to work with o3d.
 * @param {Array} clientElements Array of o3d objects.
 */
function setupStep2(clientElements) {
  // Initialize audio system here instead of init()
  // since we're loading compiled javascript

  xaudio = document.getElementById('myAudioTag');

  xaudio.listener.gain = 2.0;


  pingBuffer = 0;
  loadPing(pingFileName);

  loadReverbImpulseResponse('../impulse-responses/spreader55-75ms.aif');

  var canvasElm = clientElements[0];
  canvasElm.id = 'canvas';
  setupO3D(canvasElm);
  setupWorld();
  canvasWidth = g.client.width;
  canvasHeight = g.client.height;
  canvasTop = parseInt(canvasElm.style.top);
  canvasLeft = parseInt(canvasElm.style.left);
  o3djs.event.addEventListener(canvasElm, 'mousedown', function(e) {
    if (e.shiftKey || e.button == g.o3d.Event.BUTTON_RIGHT) {
      setupPrevWorld();
    } else {
      createNewRandomObject(world, e);
    }
  });

  window.g_finished = true;  // for selenium
}

/**
 * Creates a new random object using 3d picking to figure out where to start it.
 * @param {Object} world A B2World object.
 * @param {Object} offset Mouse position relative to o3d area.
 */
function createNewRandomObject(world, offset) {
  var worldRay = o3djs.picking.clientPositionToWorldRayEx(
      offset.x,
      offset.y,
      g.viewMatrix,
      g.projectionMatrix,
      g.o3dWidth,
      g.o3dHeight);
  var rayIntersectionInfo = g.worldBox.intersectRay(worldRay.near,
                                                    worldRay.far);
  if (rayIntersectionInfo.intersected) {
    var position = rayIntersectionInfo.position;
    if (Math.random() < 0.5) {
      demos.top.createBall(world, position[0], position[1]);
    } else {
      createBox(world, position[0], position[1], 10, 10, false);
    }
  }
}

function loadPing(url) {
  // Load asynchronously
  var request = xaudio.createAudioRequest(url, true);
  request.onload = function() { 
    pingBuffer = request.buffer;
  }

  request.send();
}

function loadReverbImpulseResponse(url) {
  // Load impulse response asynchronously
  var request = xaudio.createAudioRequest(url, false);
  request.onload = function() { 
    xaudio.impulseResponseBuffer = request.buffer;
  }

  request.send();
}


function init() {
  window.g_finished = false;  // for selenium.

  // Runs the sample in V8. Comment out this line to run it in the browser
  // JavaScript engine, for example if you want to debug it. This sample cannot
  // currently run in V8 on IE because it access the DOM.
  if (!o3djs.base.IsMSIE()) {
    o3djs.util.setMainEngine(o3djs.util.Engine.V8);
    o3djs.util.addScriptUri('third_party');
    o3djs.util.addScriptUri('demos');
    o3djs.util.addScriptUri('style');
  }

  o3djs.util.makeClients(setupStep2);
}

function uninit() {
  if (g.client) {
    g.client.cleanup();
  }
}
