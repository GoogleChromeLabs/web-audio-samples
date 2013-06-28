// Copyright 2011, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var currentView = 0; // FIXME: global...

var UNITS = {
    "hertz": 0,
    "cents": 1,
    "decibels": 2,
    "seconds": 3,
    "indexed": 4,
    "percent": 5,
    "bpm": 6,
    "generic": 7,
};

function KnobView(name, value, minValue, maxValue, units, precision, useLogScale, onchange) {
    this.name = name;
    this.value = value;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.units = units;
    this.useLogScale = useLogScale;
    this.precision = precision;
    
    this.preValue = this.valueToPre(value);
    
    this.onchange = onchange;
    
    this.backgroundColor = "rgb(60,40,40)";
    this.knobColor = "rgb(200,150,150)";
    this.knobOutlineColor = "rgb(255,255,255)";
    this.valueIndicatorColor = "rgb(80,100,100)";
    this.textColor = "rgb(255,255,255)";
}

KnobView.prototype.attach = function() {
    // Create the canvas
    var canvas = document.getElementById(this.name);
    this.canvas = canvas;

    var ctx = canvas.getContext('2d');
    this.ctx = ctx;
    
    this.width = canvas.width;
    this.height = canvas.height;

    var view = this;
    canvas.addEventListener("mousedown", 
        function(event) {
            // var eventInfo = {event: event, element:view.canvas};
            // var position = getRelativeCoordinates(eventInfo);

            var position = getElementCoordinates(view, event);

            currentView = view;
            view.isDragging = true;
            view.startPosition = position;
            view.startPreValue = view.valueToPre(view.value);
            
            view.mouseDown(position);
            
            event.stopPropagation();
        },
        true
    );
    
    // Note: document handles mouseup and mousemove events.
    document.addEventListener("mousemove", 
        function(event) {
            if (currentView && currentView == view) {
                var position = getElementCoordinates(currentView.canvas, event);

                // var c = getAbsolutePosition(currentView.canvas);
                // c.x = event.x - c.x;
                // c.y = event.y - c.y;
                // 
                // var position = c;
                // 
                // // This isn't the best, should abstract better.
                // if (isNaN(c.y)) {
                //     var eventInfo = {event: event, element:currentView.canvas};
                //     position = getRelativeCoordinates(eventInfo);
                // }

                currentView.mouseMove(position);
            }
            
            event.stopPropagation();
        },
        true
    );

    document.addEventListener("mouseup",
        function(event) {
            if (currentView && currentView == view) {
                view.isDragging = false;
                // var eventInfo = {event: event, element:currentView.canvas};
                // var position = getRelativeCoordinates(eventInfo);

                var position = getElementCoordinates(currentView.canvas, event);

                currentView.mouseUp(position);
                currentView = 0;
            }
            
            event.stopPropagation();
        },
        true
    );

    this.draw();    
}

KnobView.prototype.preToValue = function(preValue) {
    if (this.useLogScale) {
        // Interpolate in log space.
        var v1 = Math.log(this.minValue);
        var v2 = Math.log(this.maxValue);
        var v = v1 + preValue * (v2 - v1);
        return Math.exp(v);
    } else {
        return this.minValue + preValue * (this.maxValue - this.minValue);
    }
}

KnobView.prototype.valueToPre = function(value) {
    if (this.useLogScale) {
        var v1 = Math.log(this.minValue);
        var v2 = Math.log(this.maxValue);
        var v = Math.log(value);
        return (v - v1) / (v2 - v1);
    } else {
        return (value - this.minValue) / (this.maxValue - this.minValue);
    }
}


KnobView.prototype.draw = function() {
    var ctx = this.ctx;
    var width = this.width;
    var height = this.height;

    // Draw background.
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0,0, width, height);
    
    // Draw body of knob.
    ctx.fillStyle = this.knobColor;
    ctx.beginPath();
    var knobRadius = 0.7 * height / 2;
    var knobOffset = 10;
    ctx.arc(knobRadius + knobOffset , height / 2 , knobRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw body of knob.
    ctx.strokeStyle = this.knobOutlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(knobRadius + knobOffset , height / 2 , knobRadius, 0, Math.PI * 2, true);
    ctx.stroke();

    // Draw value indicator.
    ctx.strokeStyle = this.valueIndicatorColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    
    var startAngle = (2 - 0.25)*Math.PI;
    var endAngle = 0.25*Math.PI;
    var angle = -0.5*Math.PI + startAngle * (1 - this.preValue) + endAngle * this.preValue;
        
    var knobx = 0.8 * knobRadius * Math.cos(angle);
    var knoby = 0.8 * knobRadius * Math.sin(angle);
    ctx.moveTo(knobRadius + knobOffset, height / 2);
    ctx.lineTo(knobx + knobRadius + knobOffset, -knoby + height / 2);
    ctx.stroke();

    // Draw name.
    ctx.textAlign = "left";
    ctx.fillStyle = this.textColor;
    ctx.lineWidth = 1;
    ctx.font = "12pt Helvetica";
    var textVerticalPosition = height - 6;
    // canvasContext.strokeText(this.value.toFixed(0) + " dBFS", 25, y - 5);
    var textPosition = 2*knobRadius + knobOffset + 12;
    ctx.fillText(this.name, textPosition, textVerticalPosition);

    // Draw value.
    var valuePosition = width - 30; //2*knobRadius + knobOffset + 300;
    var s = this.value.toFixed(this.precision);
    
    switch (this.units) {
        case UNITS.hertz:
        s += " Hz"; break;
        case UNITS.cents:
        s += " cents"; break;
        case UNITS.decibels:
        s += " dB"; break;
        case UNITS.seconds:
        s += " sec"; break;
        case UNITS.percent:
        s += "%"; break;
        case UNITS.bpm:
        s += " bpm"; break;
        case UNITS.generic:
    }
    
    ctx.textAlign = "right";
    ctx.fillText(s, valuePosition, textVerticalPosition);
    
}

KnobView.prototype.mouseDown = function(position) {
}

KnobView.prototype.mouseMove = function(position) {
    if (this.isDragging) {
        this.mouseDrag(position);
    }
}

KnobView.prototype.mouseDrag = function(position) {
    var deltay = position.y - this.startPosition.y;
    var range = 200;

    // Offset from original value
    var k = this.startPreValue + -deltay / range;
    if (k < 0) k = 0;
    if (k > 1) k = 1;
    
    this.preValue = k;
    this.value = this.preToValue(k);
    
    if (this.units == UNITS.indexed)
        this.value = Math.floor(this.value);

    this.onchange(this.value);
    this.draw();
}

KnobView.prototype.setNormalizedValue = function(k) {
    this.preValue = k;
    this.value = this.preToValue(k);
    this.onchange(this.value);
}

KnobView.prototype.mouseUp = function(position) {
}

function installViews(views, parentDiv) {
    var ss = "";
    for (var i = 0; i < views.length; ++i) {
        var view = views[i];
        
        var s = "<canvas id=\"";
        s += view.name; // FIXME: namespace...
        s += "\" width=\"260\" height=\"24\" style=\"-webkit-user-select: none;\"> </canvas>";

        ss += s;
    }
    
    // alert("ss = " + ss);
    
    parentDiv.innerHTML = ss;

    for (var i = 0; i < views.length; ++i) {
        var view = views[i];
        view.attach();
    }
}
