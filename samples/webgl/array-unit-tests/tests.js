/*
 * Copyright (c) 2009 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var currentlyRunning = '';
var allPassed = true;
function running(str) {
  currentlyRunning = str;
}

function output(str) {
  var out = document.getElementById('output');
  if (out != null) {
    out.innerHTML += '<br>' + str;
  }
}

function pass() {
  output('<span style="color:green">Passed</span>: ' + currentlyRunning);
}

function fail(str) {
  var exc = '<span style="color:red">FAILED</span>: ' + currentlyRunning + ': ' + str;
  output(exc);
  allPassed = false;
}

function assertEq(prefix, expected, val) {
  if (expected != val) {
    fail(prefix + ': expected ' + expected + ', got ' + val);
  }
}

function printSummary() {
  if (allPassed) {
    output('<br><span style="color:green">Test passed.</span>');
  } else {
    output('<br><span style="color:red">TEST FAILED</span>');
  }
}

//
// Tests for unsigned array variants
//

function testSetAndGet10To1(type, name) {
  running('test ' + name + ' SetAndGet10To1');
  try {
    var array = new type(10);
    for (var i = 0; i < 10; i++) {
      array[i] = 10 - i;
    }
    for (var i = 0; i < 10; i++) {
      assertEq('Element ' + i, 10 - i, array[i]);
    }
    pass();
  } catch (e) {
    fail(e);
  }
}

function testConstructWithArrayOfUnsignedValues(type, name) {
  running('test ' + name + ' ConstructWithArrayOfUnsignedValues');
  try {
    var array = new type([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    assertEq('Array length', 10, array.length);
    for (var i = 0; i < 10; i++) {
      assertEq('Element ' + i, 10 - i, array[i]);
    }
    pass();
  } catch (e) {
    fail(e);
  }
}

//
// Tests for signed array variants
//

function testSetAndGetPos10ToNeg10(type, name) {
  running('test ' + name + ' SetAndGetPos10ToNeg10');
  try {
    var array = new type(21);
    for (var i = 0; i < 21; i++) {
      array[i] = 10 - i;
    }
    for (var i = 0; i < 21; i++) {
      assertEq('Element ' + i, 10 - i, array[i]);
    }
    pass();
  } catch (e) {
    fail(e);
  }
}

function testConstructWithArrayOfSignedValues(type, name) {
  running('test ' + name + ' ConstructWithArrayOfSignedValues');
  try {
    var array = new type([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10]);
    assertEq('Array length', 21, array.length);
    for (var i = 0; i < 21; i++) {
      assertEq('Element ' + i, 10 - i, array[i]);
    }
    pass();
  } catch (e) {
    fail(e);
  }
}

//
// Test cases for both signed and unsigned types
//

function testBoundaryConditions(type, name, lowValue, expectedLowValue, highValue, expectedHighValue) {
  running('test ' + name + ' BoundaryConditions(' +
          lowValue + ', ' + expectedLowValue + ', ' +
          highValue + ', ' + expectedHighValue + ')');
  try {
    var array = new type(1);
    assertEq('Array length', 1, array.length);
    array[0] = lowValue;
    assertEq('Element 0', expectedLowValue, array[0]);
    array[0] = highValue;
    assertEq('Element 0', expectedHighValue, array[0]);
    pass();
  } catch (e) {
    fail(e);
  }
}

//
// Test driver
//

function runTests() {
  allPassed = true;

  // The "name" attribute is a concession to browsers which don't
  // implement the "name" property on function objects
  var testCases =
    [ {name: "CanvasByteArray",
       unsigned: false,
       low: -128,
       expectedLow: -128,
       high: 127,
       expectedHigh: 127},
      {name: "CanvasFloatArray",
       unsigned: false,
       low: -500,
       expectedLow: -500,
       high: 500,
       expectedHigh: 500},
      {name: "CanvasIntArray",
       unsigned: false,
       low: -2147483648,
       expectedLow: -2147483648,
       high: 2147483647,
       expectedHigh: 2147483647},
      {name: "CanvasShortArray",
       unsigned: false,
       low: -32768,
       expectedLow: -32768,
       high: 32767,
       expectedHigh: 32767},
      {name: "CanvasUnsignedByteArray",
       unsigned: true,
       low: 0,
       expectedLow: 0,
       high: 255,
       expectedHigh: 255},
      {name: "CanvasUnsignedIntArray",
       unsigned: true,
       low: 0,
       expectedLow: 0,
       high: 4294967295,
       expectedHigh: 4294967295},
      {name: "CanvasUnsignedShortArray",
       unsigned: true,
       low: 0,
       expectedLow: 0,
       high: 65535,
       expectedHigh: 65535} ];

  for (var i = 0; i < testCases.length; i++) {
    var testCase = testCases[i];
    running(testCase.name);
    if (!(testCase.name in window)) {
        fail("does not exist");
        continue;
    }
    var type = window[testCase.name];
    var name = testCase.name;
    if (testCase.unsigned) {
      testSetAndGet10To1(type, name);
      testConstructWithArrayOfUnsignedValues(type, name);
    } else {
      testSetAndGetPos10ToNeg10(type, name);
      testConstructWithArrayOfSignedValues(type, name);
    }
    testBoundaryConditions(type,
                           name,
                           testCase.low,
                           testCase.expectedLow,
                           testCase.high,
                           testCase.expectedHigh);
  }

  printSummary();
}
