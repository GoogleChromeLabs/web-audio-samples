/**
 * Harmful Globals.
 */
let canvasElement;
let canvasContext;
let canvasWidth;
let canvasHeight;
let canvasTop;
let canvasLeft;

let initialDemoId = 0;

let world = createWorld();
let kFrameInterval = 1.0 / 60;
let kUIThrottleInterval = kFrameInterval * 1000;
let kNumberOfIterationPerFrame = 1;


/**
 * [setupWorld description]
 * @param  {[type]} did [description]
 * @return {[type]}     [description]
 */
function setupWorld(did) {
  if (!did)
    did = 0;

  world = createWorld();
  initialDemoId += did;
  initialDemoId %= demos.InitWorlds.length;

  if (initialDemoId < 0)
    initialDemoId = demos.InitWorlds.length + initialDemoId;

  demos.InitWorlds[initialDemoId](world);
}

function setupNextWorld() {
  setupWorld(1);
}

function setupPrevWorld() {
  setupWorld(-1);
}


/**
 * The application class.
 */
const App = {

  state: {
    mouseDown: false,
    previousTimeStamp: 0,
    numberOfObjects: 0
  },

  initialize: () => {
    initWebAudio();
    setupWorld();

    canvasElement = document.getElementById('canvas');
    canvasWidth = canvasElement.clientWidth;
    canvasHeight = canvasElement.clientHeight;
    canvasContext = canvasElement.getContext('2d');
  },

  updateSystemInfo: () => {
    let systemInfo = Lib.getSystemInfo();
    let div = document.getElementById('eSystemInfo');
    if (div) {
      div.innerHTML =
          systemInfo.name + ' ' + systemInfo.version;
    }
  },

  updateRealtimeInformation: () => {
    if (gNodeCounter.isChanged()) {
      let div = document.getElementById('eRealtimeInfo');
      let nodeCounts = gNodeCounter.getNodeCounts();
      if (div) {
        div.innerHTML = 'Number of Objects = ' + App.state.numberOfObjects +
            '<br>';
        for (let nodeType in nodeCounts) {
          div.innerHTML += nodeType + ' = ' + nodeCounts[nodeType] + '<br>';
        }
      }
    }
  },

  render: () => {
    world.Step(kFrameInterval, kNumberOfIterationPerFrame);
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWorld(world, canvasContext);
    App.updateRealtimeInformation();
    requestAnimationFrame(App.render);
  },

  createObjectOnEvent: (event) => {
    let position = Lib.getMousePosition(canvasElement, event);
    let didCreate = false;
    if (Lib.maybe()) {
      didCreate = createBox(world, position.x, position.y, 10, 10, false);
    } else {
      didCreate = demos.top.createBall(world, position.x, position.y);
    }

    if (didCreate) {
      App.state.numberOfObjects += 1;
    }
  },

  registerUIEvents: () => {
    canvasElement.addEventListener('mousedown', (event) => {
      App.state.mouseDown = true;
      App.createObjectOnEvent(event);
    });
    canvasElement.addEventListener('mousemove', (event) => {
      if (App.state.mouseDown &&
          event.timeStamp - App.state.previousTimeStamp > kUIThrottleInterval) {
        App.createObjectOnEvent(event);
        App.state.previousTimeStamp = event.timeStamp;
      }
    });
    canvasElement.addEventListener('mouseup', (event) => {
      App.state.mouseDown = false;
    });
    canvasElement.addEventListener('mouseout', (event) => {
      App.state.mouseDown = false;
    });
    canvasElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      setupPrevWorld();
    });
  },

  onLoad: () => {
    App.updateSystemInfo();
    App.updateRealtimeInformation();
    App.initialize();
    App.registerUIEvents();

    // Start the application loop.
    App.render();
  }

};


/**
 * Entry point.
 */
window.addEventListener('load', App.onLoad);
