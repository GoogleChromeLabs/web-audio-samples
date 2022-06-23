function getElementCoordinates(element, event) {
    var c = getAbsolutePosition(element);
    c.x = event.x - c.x;
    c.y = event.y - c.y;
    
    var position = c;
    
    // This isn't the best, should abstract better.
    if (isNaN(c.y)) {
        var eventInfo = {event:event, element:element};
        position = getRelativeCoordinates(eventInfo);
    }    
    
    return position;
}

function getAbsolutePosition(element) {
  var r = { x: element.offsetLeft, y: element.offsetTop };
  if (element.offsetParent) {
    var tmp = getAbsolutePosition(element.offsetParent);
    r.x += tmp.x;
    r.y += tmp.y;
  }
  return r;
};


function getRelativeCoordinates(eventInfo, opt_reference) {
    var x, y;
    var event = eventInfo.event;
    var element = eventInfo.element;
    var reference = opt_reference || eventInfo.element;
    if (!window.opera && typeof event.offsetX != 'undefined') {
      // Use offset coordinates and find common offsetParent
      var pos = { x: event.offsetX, y: event.offsetY };
      // Send the coordinates upwards through the offsetParent chain.
      var e = element;
      while (e) {
        e.mouseX = pos.x;
        e.mouseY = pos.y;
        pos.x += e.offsetLeft;
        pos.y += e.offsetTop;
        e = e.offsetParent;
      }
      // Look for the coordinates starting from the reference element.
      var e = reference;
      var offset = { x: 0, y: 0 }
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
      var pos = getAbsolutePosition(reference);
      x = event.pageX - pos.x;
      y = event.pageY - pos.y;
    }
    // Subtract distance to middle
    return { x: x, y: y };
  };




  function addSlider(name) {
    var controls = document.getElementById("controls");

    var divName = name + "Slider";


    var sliderText = '<div style="width:500px; height:20px;"> <input id="' + divName + '" '
     + 'type="range" min="0" max="1" step="0.01" value="0" style="height: 20px; width: 450px;"> <div id="'
     + name
     + '-value" style="position:relative; left:480px; top:-18px;">'
     + name
     + '</div> </div> <br>  ';

    controls.innerHTML = controls.innerHTML + sliderText;
  }

  function configureSlider(name, value, min, max, handler) {
      // var controls = document.getElementById("controls");
      // 

      var divName = name + "Slider";

      var slider = document.getElementById(divName);

      slider.min = min;
      slider.max = max;
      slider.value = value;
      slider.oninput = function() { handler(0, this); };
      // Run the handler once so any additional text is displayed.
      handler(0, {value: value});
  }

  function addSliderOld(name) {
    var controls = document.getElementById("controls");

    var divName = name + "Slider";

    var sliderText = '<div id="' 
     + divName
     + '" style="width:500px;"> <div id="'
     + name
     + '-value" style="position:relative; left:30em;">'
     + name
     + '</div> </div> <br>  ';

    controls.innerHTML = controls.innerHTML + sliderText;
  }

  function configureSliderOld(name, value, min, max, handler) {
   var controls = document.getElementById("controls");

   var divName = name + "Slider";

   // var slider = document.getElementById(divName);
   var slider = $("#" + divName);
   // var slider = document.getElementById("#" + divName);
   slider.slider({ min: min } );
   slider.slider('option', 'max', max);
   slider.slider('option', 'step', 0.001);
   slider.slider('value', value);

   slider.bind('slide', handler);
  }
