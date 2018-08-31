let kBox2DCanvasElement = document.getElementById('canvas');
let kWorldWidth = kBox2DCanvasElement.clientWidth; // 500
let kWorldHeight = kBox2DCanvasElement.clientHeight; // 300
let kWorldWallWidth = 5;


/**
 * [createWorld description]
 * @return {[type]} [description]
 */
function createWorld() {
  let worldAABB = new b2AABB();
  worldAABB.minVertex.Set(-1000, -1000);
  worldAABB.maxVertex.Set(1000, 1000);
  let gravity = new b2Vec2(0, 300);
  let doSleep = true;
  let world = new b2World(worldAABB, gravity, doSleep);
  createGround(world);
  createBox(world, kWorldWallWidth, 0.5 * kWorldWidth, 
            kWorldWallWidth, 0.5 * kWorldWidth);
  createBox(world, kWorldWidth - kWorldWallWidth, 0.5 * kWorldWidth, 
            kWorldWallWidth, 0.5 * kWorldWidth);
  return world;
}


/**
 * [createGround description]
 * @param  {[type]} world [description]
 * @return {[type]}       [description]
 */
function createGround(world) {
  let groundSd = new b2BoxDef();
  groundSd.extents.Set(1000, 50);
  groundSd.restitution = 0.2;
  let groundBd = new b2BodyDef();
  groundBd.AddShape(groundSd);
  groundBd.position.Set(0, 340);
  return world.CreateBody(groundBd)
}


/**
 * [createBall description]
 * @param  {[type]} world [description]
 * @param  {[type]} x     [description]
 * @param  {[type]} y     [description]
 * @return {[type]}       [description]
 */
function createBall(world, x, y) {
  let ballSd = new b2CircleDef();
  ballSd.density = 1.0;
  ballSd.radius = 20;
  ballSd.restitution = 1.0;
  ballSd.friction = 0;
  let ballBd = new b2BodyDef();
  ballBd.AddShape(ballSd);
  ballBd.position.Set(x,y);
  return world.CreateBody(ballBd);
}


/**
 * [createBox description]
 * @param  {[type]} world  [description]
 * @param  {[type]} x      [description]
 * @param  {[type]} y      [description]
 * @param  {[type]} width  [description]
 * @param  {[type]} height [description]
 * @param  {[type]} fixed  [description]
 * @return {[type]}        [description]
 */
function createBox(world, x, y, width, height, fixed) {
  if (typeof(fixed) == 'undefined') fixed = true;
  let boxSd = new b2BoxDef();
  if (!fixed) boxSd.density = 1.0;
  boxSd.extents.Set(width, height);
  let boxBd = new b2BodyDef();
  boxBd.AddShape(boxSd);
  boxBd.position.Set(x,y);
  return world.CreateBody(boxBd)
}


/**
 * [demos description]
 * @type {Object}
 */
let demos = {};
demos.InitWorlds = [];
