function getAbsolutePosition(element) {
  const r = {x: element.offsetLeft, y: element.offsetTop};
  if (element.offsetParent) {
    const tmp = getAbsolutePosition(element.offsetParent);
    r.x += tmp.x;
    r.y += tmp.y;
  }
  return r;
}

function getRelativeCoordinates(eventInfo, options) {
  let x; let y;
  const event = eventInfo.event;
  const element = eventInfo.element;
  const reference = options || eventInfo.element;
  if (!window.opera && typeof event.offsetX != 'undefined') {
    // Use offset coordinates and find common offsetParent
    const pos = {x: event.offsetX, y: event.offsetY};
    // Send the coordinates upwards through the offsetParent chain.
    let e = element;
    while (e) {
      e.mouseX = pos.x;
      e.mouseY = pos.y;
      pos.x += e.offsetLeft;
      pos.y += e.offsetTop;
      e = e.offsetParent;
    }
    // Look for the coordinates starting from the reference element.
    e = reference;
    const offset = {x: 0, y: 0};
    while (e) {
      if (typeof e.mouseX != 'undefined') {
        x = e.mouseX - offset.x;
        y = e.mouseY - offset.y;
        break;
      }
      offset.x += e.offsetLeft;
      offset.y += e.offsetTop;
      e = e.offsetParent;
    }
    // Reset stored coordinates
    e = element;
    while (e) {
      e.mouseX = undefined;
      e.mouseY = undefined;
      e = e.offsetParent;
    }
  } else {
    // Use absolute coordinates
    const pos = getAbsolutePosition(reference);
    x = event.pageX - pos.x;
    y = event.pageY - pos.y;
  }
  // Subtract distance to middle
  return {x: x, y: y};
}

// eslint-disable-next-line no-unused-vars
function getElementCoordinates(element, event) {
  const c = getAbsolutePosition(element);
  c.x = event.x - c.x;
  c.y = event.y - c.y;

  let position = c;

  // This isn't the best, should abstract better.
  if (isNaN(c.y)) {
    const eventInfo = {event: event, element: element};
    position = getRelativeCoordinates(eventInfo);
  }

  return position;
}

// eslint-disable-next-line no-unused-vars
function addSlider(name) {
  const controls = document.getElementById('controls');
  const divName = name + 'Slider';
  const sliderText = '<div style="width:500px; height:20px;"> <input id="' +
    divName + '" ' +
    'type="range" min="0" max="1" step="0.01" value="0" style="height: ' +
    '20px; width: 450px;"> <div id="' +
    name + '-value" style="position:relative; left:480px; top:-18px;">' +
    name + '</div> </div> <br>';

  controls.innerHTML = controls.innerHTML + sliderText;
}

// eslint-disable-next-line no-unused-vars
function configureSlider(name, value, min, max, handler) {
  const divName = name + 'Slider';
  const slider = document.getElementById(divName);
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.oninput = function() {
    handler(0, this);
  };
  // Run the handler once so any additional text is displayed.
  handler(0, {value: value});
}
