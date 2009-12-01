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

    var sliderText = '<div id="' 
     + divName
     + '" style="width:500px;"> <div id="'
     + name
     + '-value" style="position:relative; left:30em;">'
     + name
     + '</div> </div> <br>  ';

    controls.innerHTML = controls.innerHTML + sliderText;
  }

  function configureSlider(name, value, min, max, handler) {
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

  // var hilightedElement = 0;
  // 
  // function highlightElement(object) {
  //   if (hilightedElement) hilightedElement.style.backgroundColor = "white";
  //   hilightedElement = object;
  // 
  //   object.style.backgroundColor = "green";
  // }

