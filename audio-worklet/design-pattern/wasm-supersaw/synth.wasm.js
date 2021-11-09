

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = true;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

// Normally we don't log exceptions but instead let them bubble out the top
// level where the embedding environment (e.g. the browser) can handle
// them.
// However under v8 and node we sometimes exit the process direcly in which case
// its up to use us to log the exception before exiting.
// If we fix https://github.com/emscripten-core/emscripten/issues/15080
// this may no longer be needed under node.
function logExceptionOnExit(e) {
  if (e instanceof ExitStatus) return;
  var toLog = e;
  if (e && typeof e === 'object' && e.stack) {
    toLog = [e, e.stack];
  }
  err('exiting due to exception: ' + toLog);
}

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process === 'object' && typeof require === 'function') || typeof window === 'object' || typeof importScripts === 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  readAsync = function readAsync(f, onload, onerror) {
    setTimeout(function() { onload(readBinary(f)); }, 0);
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status, toThrow) {
      logExceptionOnExit(toThrow);
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];
if (!Object.getOwnPropertyDescriptor(Module, 'arguments')) {
  Object.defineProperty(Module, 'arguments', {
    configurable: true,
    get: function() {
      abort('Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram')) {
  Object.defineProperty(Module, 'thisProgram', {
    configurable: true,
    get: function() {
      abort('Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (Module['quit']) quit_ = Module['quit'];
if (!Object.getOwnPropertyDescriptor(Module, 'quit')) {
  Object.defineProperty(Module, 'quit', {
    configurable: true,
    get: function() {
      abort('Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');

if (!Object.getOwnPropertyDescriptor(Module, 'read')) {
  Object.defineProperty(Module, 'read', {
    configurable: true,
    get: function() {
      abort('Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'readAsync')) {
  Object.defineProperty(Module, 'readAsync', {
    configurable: true,
    get: function() {
      abort('Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'readBinary')) {
  Object.defineProperty(Module, 'readBinary', {
    configurable: true,
    get: function() {
      abort('Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle')) {
  Object.defineProperty(Module, 'setWindowTitle', {
    configurable: true,
    get: function() {
      abort('Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';
function alignMemory() { abort('`alignMemory` is now a library function and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line'); }

assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add 'web' to `-s ENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add 'worker' to `-s ENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-s ENVIRONMENT` to enable.");




var STACK_ALIGN = 16;

function getPointerSize() {
  return 4;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return getPointerSize();
      } else if (type[0] === 'i') {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

// include: runtime_functions.js


// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

function getEmptyTableSlot() {
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  }
  // Grow the table
  try {
    wasmTable.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
  }
  return wasmTable.length - 1;
}

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    for (var i = 0; i < wasmTable.length; i++) {
      var item = getWasmTableEntry(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.

  var ret = getEmptyTableSlot();

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    setWasmTableEntry(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction: ' + func);
    var wrapped = convertJsFunctionToWasm(func, sig);
    setWasmTableEntry(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunction(index) {
  functionsInTableMap.delete(getWasmTableEntry(index));
  freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {
  assert(typeof func !== 'undefined');

  return addFunctionWasm(func, sig);
}

// end include: runtime_functions.js
// include: runtime_debug.js


// end include: runtime_debug.js
var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary')) {
  Object.defineProperty(Module, 'wasmBinary', {
    configurable: true,
    get: function() {
      abort('Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}
var noExitRuntime = Module['noExitRuntime'] || true;
if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime')) {
  Object.defineProperty(Module, 'noExitRuntime', {
    configurable: true,
    get: function() {
      abort('Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (typeof WebAssembly !== 'object') {
  abort('no native wasm support detected');
}

// include: runtime_safe_heap.js


// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32';
    switch (type) {
      case 'i1': HEAP8[((ptr)>>0)] = value; break;
      case 'i8': HEAP8[((ptr)>>0)] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32';
    switch (type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return Number(HEAPF64[((ptr)>>3)]);
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}

// end include: runtime_safe_heap.js
// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  function onDone(ret) {
    if (stack !== 0) stackRestore(stack);
    return convertReturnValue(ret);
  }

  ret = onDone(ret);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((Uint8Array|Array<number>), number)} */
function allocate(slab, allocator) {
  var ret;
  assert(typeof allocator === 'number', 'allocate no longer takes a type argument')
  assert(typeof slab !== 'number', 'allocate no longer takes a number as arg0')

  if (allocator == ALLOC_STACK) {
    ret = stackAlloc(slab.length);
  } else {
    ret = _malloc(slab.length);
  }

  if (slab.subarray || slab.slice) {
    HEAPU8.set(/** @type {!Uint8Array} */(slab), ret);
  } else {
    HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
}

// include: runtime_strings.js


// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  ;
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 0x10FFFF) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}

// end include: runtime_strings.js
// include: runtime_strings_extra.js


// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var str = '';

    // If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
    // will always evaluate to true. The loop is then terminated on the first null char.
    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) break;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }

    return str;
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)] = codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)] = 0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)] = 0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
}

// end include: runtime_strings_extra.js
// Memory management

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime')

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;
if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY')) {
  Object.defineProperty(Module, 'INITIAL_MEMORY', {
    configurable: true,
    get: function() {
      abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it.
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -s IMPORTED_MEMORY to define wasmMemory externally');
assert(INITIAL_MEMORY == 16777216, 'Detected runtime INITIAL_MEMORY setting.  Use -s IMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // The stack grows downwards
  HEAPU32[(max >> 2)+1] = 0x2135467;
  HEAPU32[(max >> 2)+2] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAP32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  var cookie1 = HEAPU32[(max >> 2)+1];
  var cookie2 = HEAPU32[(max >> 2)+2];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
  }
  // Also test the global address 0 for integrity.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
}

// end include: runtime_stack_check.js
// include: runtime_assertions.js


// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -s SUPPORT_BIG_ENDIAN=1 to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;
var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  checkStackCookie();
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  
  callRuntimeCallbacks(__ATINIT__);
}

function exitRuntime() {
  checkStackCookie();
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
  {
    if (Module['onAbort']) {
      Module['onAbort'](what);
    }
  }

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// {{MEM_INITIALIZER}}

// include: memoryprofiler.js


// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
var FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

// include: URIUtils.js


// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  return filename.startsWith(dataURIPrefix);
}

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return filename.startsWith('file://');
}

// end include: URIUtils.js
function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    assert(!runtimeExited, 'native function `' + displayName + '` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB2oGAgAAhYAABf2ABfwF/YAF/AGACf38Bf2ACf38AYAN/f38Bf2AEf39/fwBgAABgA39/fwBgBX9/f39/AGAGf39/f39/AGAAAX5gAn99AGADf319AX1gAX0BfWABfAF8YAR/f39/AX9gA399fQBgAn99AX1gDX9/f39/f39/f39/f38AYAh/f39/f39/fwBgAAF8YAN/f30AYAR/fX9/AGAFf39/fX0AYAJ9fQF8YAJ8fAF8YAJ9fQF9YAJ9fwF9YAJ8fwF8YAN/fn8BfmAFf39/fn4AYAd/f39/f39/AAKhhICAABMDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAEwNlbnYYX19jeGFfYWxsb2NhdGVfZXhjZXB0aW9uAAEDZW52C19fY3hhX3Rocm93AAgDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IACgNlbnYNX19hc3NlcnRfZmFpbAAGA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uABQDZW52DF9fY3hhX2F0ZXhpdAAFA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQABANlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAkDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwAEA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAgDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwABANlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAAkDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQACANlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAIA2VudgVhYm9ydAAHA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAEDZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAFA2VudhdfZW1iaW5kX3JlZ2lzdGVyX2JpZ2ludAAgA/iDgIAA9gMHBwEHAQAAAgAAAAAAAAABAgQEBAcBAAACAAAAAAECCAQBAQUFBQEBDAIEAggDAwMFBAQDBQMBAQEBDwQBAwQEAQUDAQEEAQEJBAEBAQEBAQMBBAQVDAEFAQgBAxAEAQEIAQMFAQMBAgYEBAIC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ASAAKAIoER4AGgsgAEEANgIcIABCADcDECAAQgA3AgRBAAscACAAIAEgAiADpyADQiCIpyAEpyAEQiCIpxASCwvGnoCAAAIAQYAIC+wddW5zaWduZWQgc2hvcnQAdW5zaWduZWQgaW50AGZsb2F0AHVpbnQ2NF90AHZlY3RvcgBTeW50aGVzaXplcgByZW5kZXIAdW5zaWduZWQgY2hhcgBzdGQ6OmV4Y2VwdGlvbgBub3RlT24AYm9vbABlbXNjcmlwdGVuOjp2YWwALi9zeW50aF9zcmMvVW5pdEdlbmVyYXRvci5oAHVuc2lnbmVkIGxvbmcAc3RkOjp3c3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAG5vdGVPZmYAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQBzZXRTYW1wbGVSYXRlAFN5bnRoZXNpemVyQmFzZQBkb3VibGUAdm9pZABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AHNhbXBsZVJhdGUgPiAwAFB1cmUgdmlydHVhbCBmdW5jdGlvbiBjYWxsZWQhADExU3ludGhlc2l6ZXIA+BEAAOIHAABQMTFTeW50aGVzaXplcgAA2BIAAPgHAAAAAAAA8AcAAFBLMTFTeW50aGVzaXplcgDYEgAAGAgAAAEAAADwBwAAaWkAdgB2aQAICAAAlBEAAGlpaQAAAAAA8AcAABIAAAATAAAAAAAAALAIAAAUAAAAFQAAABYAAAAxMVNpbXBsZVZvaWNlADlWb2ljZUJhc2UAMTNVbml0R2VuZXJhdG9yAAAAAPgRAACJCAAAIBIAAH4IAACcCAAAIBIAAHAIAACkCAAAAAAAAKQIAAAXAAAAGAAAABkAAAAAAAAAnAgAABoAAAAbAAAAAAAAAAAJAAAcAAAAHQAAADEyQmlxdWFkRmlsdGVyAAAgEgAA8AgAAJwIAAAAAAAALAkAAB4AAAAfAAAAMTJFbnZlbG9wZUFEU1IAACASAAAcCQAAnAgAAAAAAACICQAAIAAAACEAAAAiAAAAMjFTYXd0b290aE9zY2lsbGF0b3JEUFcAMThTYXd0b290aE9zY2lsbGF0b3IAAAAAIBIAAGQJAACcCAAAIBIAAEwJAAB8CQAAAAAAAHwJAAAjAAAAJAAAACUAAAAAAAAA1AkAACYAAAAnAAAAMjJEaWZmZXJlbnRpYXRlZFBhcmFib2xhAAAAAPgRAAC4CQAANBEAAAgIAABkEQAAdmlpaQAxOFN5bnRoZXNpemVyV3JhcHBlcgAAACASAADtCQAA8AcAAFAxOFN5bnRoZXNpemVyV3JhcHBlcgAAANgSAAAQCgAAAAAAAAQKAABQSzE4U3ludGhlc2l6ZXJXcmFwcGVyAADYEgAAOAoAAAEAAAAECgAAKAoAAJQRAAAAAAAABAoAACgAAAApAAAAAAAAAAAAAAA0EQAAKAoAALgRAACUEQAAdmlpaWkAAAAAAAAA1AoAACsAAAAsAAAALQAAADE1UG93ZXJPZlR3b1RhYmxlADExTG9va3VwVGFibGUA+BEAAL4KAAAgEgAArAoAAMwKAAAAAAAAzAoAAC4AAAAvAAAAGQAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUAAAAA+BEAADMLAAB8EgAA9AoAAAAAAAABAAAAXAsAAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAfBIAAHwLAAAAAAAAAQAAAFwLAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAHwSAADUCwAAAAAAAAEAAABcCwAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAfBIAACwMAAAAAAAAAQAAAFwLAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAAB8EgAAiAwAAAAAAAABAAAAXAsAAAAAAABOMTBlbXNjcmlwdGVuM3ZhbEUAAPgRAADkDAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAAD4EQAAAA0AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAA+BEAACgNAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAAPgRAABQDQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAAD4EQAAeA0AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXRFRQAA+BEAAKANAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUAAPgRAADIDQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAAD4EQAA8A0AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWxFRQAA+BEAABgOAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUAAPgRAABADgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAAD4EQAAaA4AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWRFRQAA+BEAAJAOAAAAAAAAAAAAAAAAAAAAAPA/AAAAAAAA+D8AAAAAAAAAAAbQz0Pr/Uw+AAAAAAAAAAAAAABAA7jiPwAAgD8AAMA/AAAAANzP0TUAAAAAAMAVPwAAAAAsDwAAMQAAADIAAAAzAAAAU3Q5ZXhjZXB0aW9uAAAAAPgRAAAcDwAAAAAAAFgPAAARAAAANAAAADUAAABTdDExbG9naWNfZXJyb3IAIBIAAEgPAAAsDwAAAAAAAIwPAAARAAAANgAAADUAAABTdDEybGVuZ3RoX2Vycm9yAAAAACASAAB4DwAAWA8AAFN0OXR5cGVfaW5mbwAAAAD4EQAAmA8AAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAAAAACASAACwDwAAqA8AAE4xMF9fY3h4YWJpdjExN19fY2xhc3NfdHlwZV9pbmZvRQAAACASAADgDwAA1A8AAE4xMF9fY3h4YWJpdjExN19fcGJhc2VfdHlwZV9pbmZvRQAAACASAAAQEAAA1A8AAE4xMF9fY3h4YWJpdjExOV9fcG9pbnRlcl90eXBlX2luZm9FACASAABAEAAANBAAAE4xMF9fY3h4YWJpdjEyMF9fZnVuY3Rpb25fdHlwZV9pbmZvRQAAAAAgEgAAcBAAANQPAABOMTBfX2N4eGFiaXYxMjlfX3BvaW50ZXJfdG9fbWVtYmVyX3R5cGVfaW5mb0UAAAAgEgAApBAAADQQAAAAAAAAJBEAADcAAAA4AAAAOQAAADoAAAA7AAAATjEwX19jeHhhYml2MTIzX19mdW5kYW1lbnRhbF90eXBlX2luZm9FACASAAD8EAAA1A8AAHYAAADoEAAAMBEAAERuAADoEAAAPBEAAGIAAADoEAAASBEAAGMAAADoEAAAVBEAAGgAAADoEAAAYBEAAGEAAADoEAAAbBEAAHMAAADoEAAAeBEAAHQAAADoEAAAhBEAAGkAAADoEAAAkBEAAGoAAADoEAAAnBEAAGwAAADoEAAAqBEAAG0AAADoEAAAtBEAAHgAAADoEAAAwBEAAHkAAADoEAAAzBEAAGYAAADoEAAA2BEAAGQAAADoEAAA5BEAAAAAAAAEEAAANwAAADwAAAA5AAAAOgAAAD0AAAA+AAAAPwAAAEAAAAAAAAAAaBIAADcAAABBAAAAOQAAADoAAAA9AAAAQgAAAEMAAABEAAAATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAAAAACASAABAEgAABBAAAAAAAADEEgAANwAAAEUAAAA5AAAAOgAAAD0AAABGAAAARwAAAEgAAABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9FAAAAIBIAAJwSAAAEEAAAAAAAAGQQAAA3AAAASQAAADkAAAA6AAAASgAAAABB8CULTJYq9AUAAAAAeAtkP+AtcD9fKXs/AACAP3icgj83Gog/HcmNP1OWoT0Zc9c9U5YhPm6joT5TliE+GXPXPUuroT2AuwAAPsOuN2AVUAA=';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(file);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, try to to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch === 'function'
    ) {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
          return getBinary(wasmBinaryFile);
      });
    }
  }

  // Otherwise, getBinary should be able to get it synchronously
  return Promise.resolve().then(function() { return getBinary(wasmBinaryFile); });
}

function instantiateSync(file, info) {
  var instance;
  var module;
  var binary;
  try {
    binary = getBinary(file);
    module = new WebAssembly.Module(binary);
    instance = new WebAssembly.Instance(module, info);
  } catch (e) {
    var str = e.toString();
    err('failed to compile wasm module: ' + str);
    if (str.includes('imported Memory') ||
        str.includes('memory import')) {
      err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
    }
    throw e;
  }
  return [instance, module];
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;

    Module['asm'] = exports;

    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateGlobalBufferAndViews(wasmMemory.buffer);

    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  var result = instantiateSync(wasmBinaryFile, info);
  // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
  // the above line no longer optimizes out down to the following line.
  // When the regression is fixed, we can remove this if/else.
  receiveInstance(result[0]);
  return Module['asm']; // exports were assigned here
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};






  function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
          callback(Module); // Pass the module as the first argument.
          continue;
        }
        var func = callback.func;
        if (typeof func === 'number') {
          if (callback.arg === undefined) {
            getWasmTableEntry(func)();
          } else {
            getWasmTableEntry(func)(callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }

  function withStackSave(f) {
      var stack = stackSave();
      var ret = f();
      stackRestore(stack);
      return ret;
    }
  function demangle(func) {
      warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  var wasmTableMirror = [];
  function getWasmTableEntry(funcPtr) {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
      return func;
    }

  function handleException(e) {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      quit_(1, e);
    }

  function jsStackTrace() {
      var error = new Error();
      if (!error.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          error = e;
        }
        if (!error.stack) {
          return '(no stack trace available)';
        }
      }
      return error.stack.toString();
    }

  function setWasmTableEntry(idx, func) {
      wasmTable.set(idx, func);
      wasmTableMirror[idx] = func;
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function ___assert_fail(condition, filename, line, func) {
      abort('Assertion failed: ' + UTF8ToString(condition) + ', at: ' + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
    }

  function ___cxa_allocate_exception(size) {
      // Thrown object is prepended by exception metadata block
      return _malloc(size + 16) + 16;
    }

  function _atexit(func, arg) {
    }
  function ___cxa_atexit(a0,a1
  ) {
  return _atexit(a0,a1);
  }

  function ExceptionInfo(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 16;
  
      this.set_type = function(type) {
        HEAP32[(((this.ptr)+(4))>>2)] = type;
      };
  
      this.get_type = function() {
        return HEAP32[(((this.ptr)+(4))>>2)];
      };
  
      this.set_destructor = function(destructor) {
        HEAP32[(((this.ptr)+(8))>>2)] = destructor;
      };
  
      this.get_destructor = function() {
        return HEAP32[(((this.ptr)+(8))>>2)];
      };
  
      this.set_refcount = function(refcount) {
        HEAP32[((this.ptr)>>2)] = refcount;
      };
  
      this.set_caught = function (caught) {
        caught = caught ? 1 : 0;
        HEAP8[(((this.ptr)+(12))>>0)] = caught;
      };
  
      this.get_caught = function () {
        return HEAP8[(((this.ptr)+(12))>>0)] != 0;
      };
  
      this.set_rethrown = function (rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(((this.ptr)+(13))>>0)] = rethrown;
      };
  
      this.get_rethrown = function () {
        return HEAP8[(((this.ptr)+(13))>>0)] != 0;
      };
  
      // Initialize native structure fields. Should be called once after allocated.
      this.init = function(type, destructor) {
        this.set_type(type);
        this.set_destructor(destructor);
        this.set_refcount(0);
        this.set_caught(false);
        this.set_rethrown(false);
      }
  
      this.add_ref = function() {
        var value = HEAP32[((this.ptr)>>2)];
        HEAP32[((this.ptr)>>2)] = value + 1;
      };
  
      // Returns true if last reference released.
      this.release_ref = function() {
        var prev = HEAP32[((this.ptr)>>2)];
        HEAP32[((this.ptr)>>2)] = prev - 1;
        assert(prev > 0);
        return prev === 1;
      };
    }
  
  var exceptionLast = 0;
  
  var uncaughtExceptionCount = 0;
  function ___cxa_throw(ptr, type, destructor) {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s NO_DISABLE_EXCEPTION_CATCHING or -s EXCEPTION_CATCHING_ALLOWED=[..] to catch.";
    }

  function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {}

  function getShiftFromSize(size) {
      
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }
  var embind_charCodes = undefined;
  function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  var awaitingDependencies = {};
  
  var registeredTypes = {};
  
  var typeDependencies = {};
  
  var char_0 = 48;
  
  var char_9 = 57;
  function makeLegalFunctionName(name) {
      if (undefined === name) {
          return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
          return '_' + name;
      } else {
          return name;
      }
    }
  function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }
  function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }
  var BindingError = undefined;
  function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  var InternalError = undefined;
  function throwInternalError(message) {
      throw new InternalError(message);
    }
  function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
                  typeConverters[i] = registeredTypes[dt];
                  ++registered;
                  if (registered === unregisteredTypes.length) {
                      onComplete(typeConverters);
                  }
              });
          }
      });
      if (0 === unregisteredTypes.length) {
          onComplete(typeConverters);
      }
    }
  /** @param {Object=} options */
  function registerType(rawType, registeredInstance, options) {
      options = options || {};
  
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
          var callbacks = awaitingDependencies[rawType];
          delete awaitingDependencies[rawType];
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }
  function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
          return false;
      }
      if (!(other instanceof ClassHandle)) {
          return false;
      }
  
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
  
      while (leftClass.baseClass) {
          left = leftClass.upcast(left);
          leftClass = leftClass.baseClass;
      }
  
      while (rightClass.baseClass) {
          right = rightClass.upcast(right);
          rightClass = rightClass.baseClass;
      }
  
      return leftClass === rightClass && left === right;
    }
  
  function shallowCopyInternalPointer(o) {
      return {
          count: o.count,
          deleteScheduled: o.deleteScheduled,
          preservePointerOnDelete: o.preservePointerOnDelete,
          ptr: o.ptr,
          ptrType: o.ptrType,
          smartPtr: o.smartPtr,
          smartPtrType: o.smartPtrType,
      };
    }
  
  function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    }
  
  var finalizationGroup = false;
  
  function detachFinalizer(handle) {}
  
  function runDestructor($$) {
      if ($$.smartPtr) {
          $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
          $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }
  function releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
          runDestructor($$);
      }
    }
  function attachFinalizer(handle) {
      if ('undefined' === typeof FinalizationGroup) {
          attachFinalizer = function (handle) { return handle; };
          return handle;
      }
      // If the running environment has a FinalizationGroup (see
      // https://github.com/tc39/proposal-weakrefs), then attach finalizers
      // for class handles.  We check for the presence of FinalizationGroup
      // at run-time, not build-time.
      finalizationGroup = new FinalizationGroup(function (iter) {
          for (var result = iter.next(); !result.done; result = iter.next()) {
              var $$ = result.value;
              if (!$$.ptr) {
                  console.warn('object already deleted: ' + $$.ptr);
              } else {
                  releaseClassHandle($$);
              }
          }
      });
      attachFinalizer = function(handle) {
          finalizationGroup.register(handle, handle.$$, handle.$$);
          return handle;
      };
      detachFinalizer = function(handle) {
          finalizationGroup.unregister(handle.$$);
      };
      return attachFinalizer(handle);
    }
  function ClassHandle_clone() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.preservePointerOnDelete) {
          this.$$.count.value += 1;
          return this;
      } else {
          var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
              $$: {
                  value: shallowCopyInternalPointer(this.$$),
              }
          }));
  
          clone.$$.count.value += 1;
          clone.$$.deleteScheduled = false;
          return clone;
      }
    }
  
  function ClassHandle_delete() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
          throwBindingError('Object already scheduled for deletion');
      }
  
      detachFinalizer(this);
      releaseClassHandle(this.$$);
  
      if (!this.$$.preservePointerOnDelete) {
          this.$$.smartPtr = undefined;
          this.$$.ptr = undefined;
      }
    }
  
  function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }
  
  var delayFunction = undefined;
  
  var deletionQueue = [];
  
  function flushPendingDeletes() {
      while (deletionQueue.length) {
          var obj = deletionQueue.pop();
          obj.$$.deleteScheduled = false;
          obj['delete']();
      }
    }
  function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
          throwBindingError('Object already scheduled for deletion');
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
          delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }
  function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }
  function ClassHandle() {
    }
  
  var registeredPointers = {};
  
  function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
          var prevFunc = proto[methodName];
          // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
          proto[methodName] = function() {
              // TODO This check can be removed in -O3 level "unsafe" optimizations.
              if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                  throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
              }
              return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
          };
          // Move the previous function into the overload table.
          proto[methodName].overloadTable = [];
          proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }
  /** @param {number=} numArguments */
  function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
          if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
              throwBindingError("Cannot register public name '" + name + "' twice");
          }
  
          // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
          // that routes between the two.
          ensureOverloadTable(Module, name, name);
          if (Module.hasOwnProperty(numArguments)) {
              throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
          }
          // Add the new function into the overload table.
          Module[name].overloadTable[numArguments] = value;
      }
      else {
          Module[name] = value;
          if (undefined !== numArguments) {
              Module[name].numArguments = numArguments;
          }
      }
    }
  
  /** @constructor */
  function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast
    ) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
  
  function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
          if (!ptrClass.upcast) {
              throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
          }
          ptr = ptrClass.upcast(ptr);
          ptrClass = ptrClass.baseClass;
      }
      return ptr;
    }
  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
          return 0;
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
  
          if (this.isSmartPointer) {
              ptr = this.rawConstructor();
              if (destructors !== null) {
                  destructors.push(this.rawDestructor, ptr);
              }
              return ptr;
          } else {
              return 0;
          }
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  
      if (this.isSmartPointer) {
          // TODO: this is not strictly true
          // We could support BY_EMVAL conversions from raw pointers to smart pointers
          // because the smart pointer can hold a reference to the handle
          if (undefined === handle.$$.smartPtr) {
              throwBindingError('Passing raw pointer to smart pointer is illegal');
          }
  
          switch (this.sharingPolicy) {
              case 0: // NONE
                  // no upcasting
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                  }
                  break;
  
              case 1: // INTRUSIVE
                  ptr = handle.$$.smartPtr;
                  break;
  
              case 2: // BY_EMVAL
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      var clonedHandle = handle['clone']();
                      ptr = this.rawShare(
                          ptr,
                          Emval.toHandle(function() {
                              clonedHandle['delete']();
                          })
                      );
                      if (destructors !== null) {
                          destructors.push(this.rawDestructor, ptr);
                      }
                  }
                  break;
  
              default:
                  throwBindingError('Unsupporting sharing policy');
          }
      }
      return ptr;
    }
  
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
          if (this.isReference) {
              throwBindingError('null is not a valid ' + this.name);
          }
          return 0;
      }
  
      if (!handle.$$) {
          throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
          throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }
  
  function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
          ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }
  
  function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
          this.rawDestructor(ptr);
      }
    }
  
  function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
          handle['delete']();
      }
    }
  
  function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
          return ptr;
      }
      if (undefined === desiredClass.baseClass) {
          return null; // no conversion
      }
  
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
          return null;
      }
      return desiredClass.downcast(rv);
    }
  
  function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }
  
  function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
          if (registeredInstances.hasOwnProperty(k)) {
              rv.push(registeredInstances[k]);
          }
      }
      return rv;
    }
  
  function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
          delayFunction(flushPendingDeletes);
      }
    }
  function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }
  var registeredInstances = {};
  
  function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    }
  function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }
  
  function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
          throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
          throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, {
          $$: {
              value: record,
          },
      }));
    }
  function RegisteredPointer_fromWireType(ptr) {
      // ptr is a raw pointer (or a raw smartpointer)
  
      // rawPointer is a maybe-null raw pointer
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
          this.destructor(ptr);
          return null;
      }
  
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
          // JS object has been neutered, time to repopulate it
          if (0 === registeredInstance.$$.count.value) {
              registeredInstance.$$.ptr = rawPointer;
              registeredInstance.$$.smartPtr = ptr;
              return registeredInstance['clone']();
          } else {
              // else, just increment reference count on existing object
              // it already has a reference to the smart pointer
              var rv = registeredInstance['clone']();
              this.destructor(ptr);
              return rv;
          }
      }
  
      function makeDefaultHandle() {
          if (this.isSmartPointer) {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this.pointeeType,
                  ptr: rawPointer,
                  smartPtrType: this,
                  smartPtr: ptr,
              });
          } else {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this,
                  ptr: ptr,
              });
          }
      }
  
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
          return makeDefaultHandle.call(this);
      }
  
      var toType;
      if (this.isConst) {
          toType = registeredPointerRecord.constPointerType;
      } else {
          toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
          rawPointer,
          this.registeredClass,
          toType.registeredClass);
      if (dp === null) {
          return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
              smartPtrType: this,
              smartPtr: ptr,
          });
      } else {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
          });
      }
    }
  function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }
  /** @constructor
      @param {*=} pointeeType,
      @param {*=} sharingPolicy,
      @param {*=} rawGetPointee,
      @param {*=} rawConstructor,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
  function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
  
      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
  
      // smart pointer properties
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
  
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
          if (isConst) {
              this['toWireType'] = constNoSmartPtrRawPointerToWireType;
              this.destructorFunction = null;
          } else {
              this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
              this.destructorFunction = null;
          }
      } else {
          this['toWireType'] = genericPointerToWireType;
          // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
          // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
          // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
          //       craftInvokerFunction altogether.
      }
    }
  
  /** @param {number=} numArguments */
  function replacePublicSymbol(name, value, numArguments) {
      if (!Module.hasOwnProperty(name)) {
          throwInternalError('Replacing nonexistant public symbol');
      }
      // If there's an overload table for this symbol, replace the symbol in the overload table instead.
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
          Module[name].overloadTable[numArguments] = value;
      }
      else {
          Module[name] = value;
          Module[name].argCount = numArguments;
      }
    }
  
  function dynCallLegacy(sig, ptr, args) {
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      if (args && args.length) {
        // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
      } else {
        assert(sig.length == 1);
      }
      var f = Module["dynCall_" + sig];
      return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
    }
  function dynCall(sig, ptr, args) {
      // Without WASM_BIGINT support we cannot directly call function with i64 as
      // part of thier signature, so we rely the dynCall functions generated by
      // wasm-emscripten-finalize
      if (sig.includes('j')) {
        return dynCallLegacy(sig, ptr, args);
      }
      assert(getWasmTableEntry(ptr), 'missing table entry in dynCall: ' + ptr);
      return getWasmTableEntry(ptr).apply(null, args)
    }
  function getDynCaller(sig, ptr) {
      assert(sig.includes('j'), 'getDynCaller should only be called with i64 sigs')
      var argCache = [];
      return function() {
        argCache.length = arguments.length;
        for (var i = 0; i < arguments.length; i++) {
          argCache[i] = arguments[i];
        }
        return dynCall(sig, ptr, argCache);
      };
    }
  function embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
  
      function makeDynCaller() {
        if (signature.includes('j')) {
          return getDynCaller(signature, rawFunction);
        }
        return getWasmTableEntry(rawFunction);
      }
  
      var fp = makeDynCaller();
      if (typeof fp !== "function") {
          throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }
  
  var UnboundTypeError = undefined;
  
  function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }
  function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
          if (seen[type]) {
              return;
          }
          if (registeredTypes[type]) {
              return;
          }
          if (typeDependencies[type]) {
              typeDependencies[type].forEach(visit);
              return;
          }
          unboundTypes.push(type);
          seen[type] = true;
      }
      types.forEach(visit);
  
      throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    }
  function __embind_register_class(
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor
    ) {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
          upcast = embind__requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
          downcast = embind__requireFunction(downcastSignature, downcast);
      }
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
  
      exposePublicSymbol(legalFunctionName, function() {
          // this code cannot run if baseClassRawType is zero
          throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
      });
  
      whenDependentTypesAreResolved(
          [rawType, rawPointerType, rawConstPointerType],
          baseClassRawType ? [baseClassRawType] : [],
          function(base) {
              base = base[0];
  
              var baseClass;
              var basePrototype;
              if (baseClassRawType) {
                  baseClass = base.registeredClass;
                  basePrototype = baseClass.instancePrototype;
              } else {
                  basePrototype = ClassHandle.prototype;
              }
  
              var constructor = createNamedFunction(legalFunctionName, function() {
                  if (Object.getPrototypeOf(this) !== instancePrototype) {
                      throw new BindingError("Use 'new' to construct " + name);
                  }
                  if (undefined === registeredClass.constructor_body) {
                      throw new BindingError(name + " has no accessible constructor");
                  }
                  var body = registeredClass.constructor_body[arguments.length];
                  if (undefined === body) {
                      throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                  }
                  return body.apply(this, arguments);
              });
  
              var instancePrototype = Object.create(basePrototype, {
                  constructor: { value: constructor },
              });
  
              constructor.prototype = instancePrototype;
  
              var registeredClass = new RegisteredClass(
                  name,
                  constructor,
                  instancePrototype,
                  rawDestructor,
                  baseClass,
                  getActualType,
                  upcast,
                  downcast);
  
              var referenceConverter = new RegisteredPointer(
                  name,
                  registeredClass,
                  true,
                  false,
                  false);
  
              var pointerConverter = new RegisteredPointer(
                  name + '*',
                  registeredClass,
                  false,
                  false,
                  false);
  
              var constPointerConverter = new RegisteredPointer(
                  name + ' const*',
                  registeredClass,
                  false,
                  true,
                  false);
  
              registeredPointers[rawType] = {
                  pointerType: pointerConverter,
                  constPointerType: constPointerConverter
              };
  
              replacePublicSymbol(legalFunctionName, constructor);
  
              return [referenceConverter, pointerConverter, constPointerConverter];
          }
      );
    }

  function heap32VectorToArray(count, firstElement) {
      
      var array = [];
      for (var i = 0; i < count; i++) {
          array.push(HEAP32[(firstElement >> 2) + i]);
      }
      return array;
    }
  
  function runDestructors(destructors) {
      while (destructors.length) {
          var ptr = destructors.pop();
          var del = destructors.pop();
          del(ptr);
      }
    }
  function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = 'constructor ' + classType.name;
  
          if (undefined === classType.registeredClass.constructor_body) {
              classType.registeredClass.constructor_body = [];
          }
          if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
              throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
          }
          classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
              throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
          };
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
              // Insert empty slot for context type (argTypes[1]).
              argTypes.splice(1, 0, null);
              classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
              return [];
          });
          return [];
      });
    }

  function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
          throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
      }
  
      /*
       * Previously, the following line was just:
  
       function dummy() {};
  
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
       * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
       * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
       * to write a test for this behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructor.prototype;
      var obj = new dummy;
  
      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    }
  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      var argCount = argTypes.length;
  
      if (argCount < 2) {
          throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  
      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = false;
  
      for (var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
          if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
              needsDestructorStack = true;
              break;
          }
      }
  
      var returns = (argTypes[0].name !== "void");
  
      var argsList = "";
      var argsListWired = "";
      for (var i = 0; i < argCount - 2; ++i) {
          argsList += (i!==0?", ":"")+"arg"+i;
          argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
      }
  
      var invokerFnBody =
          "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
          "if (arguments.length !== "+(argCount - 2)+") {\n" +
              "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
          "}\n";
  
      if (needsDestructorStack) {
          invokerFnBody +=
              "var destructors = [];\n";
      }
  
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  
      if (isClassMethodFunc) {
          invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
      }
  
      for (var i = 0; i < argCount - 2; ++i) {
          invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
          args1.push("argType"+i);
          args2.push(argTypes[i+2]);
      }
  
      if (isClassMethodFunc) {
          argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
      if (needsDestructorStack) {
          invokerFnBody += "runDestructors(destructors);\n";
      } else {
          for (var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
              var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
              if (argTypes[i].destructorFunction !== null) {
                  invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                  args1.push(paramName+"_dtor");
                  args2.push(argTypes[i].destructorFunction);
              }
          }
      }
  
      if (returns) {
          invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                           "return ret;\n";
      } else {
      }
  
      invokerFnBody += "}\n";
  
      args1.push(invokerFnBody);
  
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }
  function __embind_register_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + methodName;
  
          if (methodName.startsWith("@@")) {
              methodName = Symbol[methodName.substring(2)];
          }
  
          if (isPureVirtual) {
              classType.registeredClass.pureVirtualFunctions.push(methodName);
          }
  
          function unboundTypesHandler() {
              throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
          }
  
          var proto = classType.registeredClass.instancePrototype;
          var method = proto[methodName];
          if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
              // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
              unboundTypesHandler.argCount = argCount - 2;
              unboundTypesHandler.className = classType.name;
              proto[methodName] = unboundTypesHandler;
          } else {
              // There was an existing function with the same name registered. Set up a function overload routing table.
              ensureOverloadTable(proto, methodName, humanName);
              proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
          }
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
  
              var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
  
              // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
              // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
              if (undefined === proto[methodName].overloadTable) {
                  // Set argCount in case an overload is registered later
                  memberFunction.argCount = argCount - 2;
                  proto[methodName] = memberFunction;
              } else {
                  proto[methodName].overloadTable[argCount - 2] = memberFunction;
              }
  
              return [];
          });
          return [];
      });
    }

  var emval_free_list = [];
  
  var emval_handle_array = [{},{value:undefined},{value:null},{value:true},{value:false}];
  function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
          emval_handle_array[handle] = undefined;
          emval_free_list.push(handle);
      }
    }
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              ++count;
          }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              return emval_handle_array[i];
          }
      }
      return null;
    }
  function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }
  var Emval = {toValue:function(handle) {
        if (!handle) {
            throwBindingError('Cannot use deleted val. handle = ' + handle);
        }
        return emval_handle_array[handle].value;
      },toHandle:function(value) {
        switch (value) {
          case undefined :{ return 1; }
          case null :{ return 2; }
          case true :{ return 3; }
          case false :{ return 4; }
          default:{
            var handle = emval_free_list.length ?
                emval_free_list.pop() :
                emval_handle_array.length;
    
            emval_handle_array[handle] = {refcount: 1, value: value};
            return handle;
            }
          }
      }};
  function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = Emval.toValue(handle);
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return Emval.toHandle(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }
  function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }
  function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
  
      var fromWireType = function(value) {
          return value;
      };
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.includes('unsigned'));
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
          handle = handle >> 2;
          var heap = HEAPU32;
          var size = heap[handle]; // in elements
          var data = heap[handle + 1]; // byte offset into emscripten heap
          return new TA(buffer, data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': decodeMemoryView,
          'argPackAdvance': 8,
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }

  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
  
              var str;
              if (stdStringIsUTF8) {
                  var decodeStartPtr = value + 4;
                  // Looping here to support possible embedded '0' bytes
                  for (var i = 0; i <= length; ++i) {
                      var currentBytePtr = value + 4 + i;
                      if (i == length || HEAPU8[currentBytePtr] == 0) {
                          var maxRead = currentBytePtr - decodeStartPtr;
                          var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                          if (str === undefined) {
                              str = stringSegment;
                          } else {
                              str += String.fromCharCode(0);
                              str += stringSegment;
                          }
                          decodeStartPtr = currentBytePtr + 1;
                      }
                  }
              } else {
                  var a = new Array(length);
                  for (var i = 0; i < length; ++i) {
                      a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                  }
                  str = a.join('');
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              var getLength;
              var valueIsOfTypeString = (typeof value === 'string');
  
              if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                  throwBindingError('Cannot pass non-string to std::string');
              }
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = function() {return lengthBytesUTF8(value);};
              } else {
                  getLength = function() {return value.length;};
              }
  
              // assumes 4-byte alignment
              var length = getLength();
              var ptr = _malloc(4 + length + 1);
              HEAPU32[ptr >> 2] = length;
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  stringToUTF8(value, ptr + 4, length + 1);
              } else {
                  if (valueIsOfTypeString) {
                      for (var i = 0; i < length; ++i) {
                          var charCode = value.charCodeAt(i);
                          if (charCode > 255) {
                              _free(ptr);
                              throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                          }
                          HEAPU8[ptr + 4 + i] = charCode;
                      }
                  } else {
                      for (var i = 0; i < length; ++i) {
                          HEAPU8[ptr + 4 + i] = value[i];
                      }
                  }
              }
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
          decodeString = UTF16ToString;
          encodeString = stringToUTF16;
          lengthBytesUTF = lengthBytesUTF16;
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          decodeString = UTF32ToString;
          encodeString = stringToUTF32;
          lengthBytesUTF = lengthBytesUTF32;
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              // Code mostly taken from _embind_register_std_string fromWireType
              var length = HEAPU32[value >> 2];
              var HEAP = getHeap();
              var str;
  
              var decodeStartPtr = value + 4;
              // Looping here to support possible embedded '0' bytes
              for (var i = 0; i <= length; ++i) {
                  var currentBytePtr = value + 4 + i * charSize;
                  if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                      var maxReadBytes = currentBytePtr - decodeStartPtr;
                      var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                      if (str === undefined) {
                          str = stringSegment;
                      } else {
                          str += String.fromCharCode(0);
                          str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + charSize;
                  }
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (!(typeof value === 'string')) {
                  throwBindingError('Cannot pass non-string to C++ string type ' + name);
              }
  
              // assumes 4-byte alignment
              var length = lengthBytesUTF(value);
              var ptr = _malloc(4 + length + charSize);
              HEAPU32[ptr >> 2] = length >> shift;
  
              encodeString(value, ptr + 4, length + charSize);
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  function _abort() {
      abort('native code called abort()');
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
    }
  function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_ClassHandle();
init_RegisteredPointer();
init_embind();;
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;
var ASSERTIONS = true;



/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


var asmLibraryArg = {
  "__assert_fail": ___assert_fail,
  "__cxa_allocate_exception": ___cxa_allocate_exception,
  "__cxa_atexit": ___cxa_atexit,
  "__cxa_throw": ___cxa_throw,
  "_embind_register_bigint": __embind_register_bigint,
  "_embind_register_bool": __embind_register_bool,
  "_embind_register_class": __embind_register_class,
  "_embind_register_class_constructor": __embind_register_class_constructor,
  "_embind_register_class_function": __embind_register_class_function,
  "_embind_register_emval": __embind_register_emval,
  "_embind_register_float": __embind_register_float,
  "_embind_register_integer": __embind_register_integer,
  "_embind_register_memory_view": __embind_register_memory_view,
  "_embind_register_std_string": __embind_register_std_string,
  "_embind_register_std_wstring": __embind_register_std_wstring,
  "_embind_register_void": __embind_register_void,
  "abort": _abort,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors", asm);

/** @type {function(...*):?} */
var ___getTypeName = Module["___getTypeName"] = createExportWrapper("__getTypeName", asm);

/** @type {function(...*):?} */
var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = createExportWrapper("__embind_register_native_and_builtin_types", asm);

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location", asm);

/** @type {function(...*):?} */
var _fflush = Module["_fflush"] = createExportWrapper("fflush", asm);

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc", asm);

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave", asm);

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore", asm);

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc", asm);

/** @type {function(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = asm["emscripten_stack_init"]

/** @type {function(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = asm["emscripten_stack_get_free"]

/** @type {function(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = asm["emscripten_stack_get_end"]

/** @type {function(...*):?} */
var _free = Module["_free"] = createExportWrapper("free", asm);





// === Auto-generated postamble setup entry stuff ===

if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "cwrap")) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() { abort("'print' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() { abort("'callMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() { abort("'abort' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "keepRuntimeAlive")) Module["keepRuntimeAlive"] = function() { abort("'keepRuntimeAlive' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "zeroMemory")) Module["zeroMemory"] = function() { abort("'zeroMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = function() { abort("'stringToNewUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setFileTime")) Module["setFileTime"] = function() { abort("'setFileTime' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "abortOnCannotGrowMemory")) Module["abortOnCannotGrowMemory"] = function() { abort("'abortOnCannotGrowMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = function() { abort("'emscripten_realloc_buffer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "withStackSave")) Module["withStackSave"] = function() { abort("'withStackSave' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = function() { abort("'ERRNO_CODES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = function() { abort("'ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = function() { abort("'setErrNo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "inetPton4")) Module["inetPton4"] = function() { abort("'inetPton4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "inetNtop4")) Module["inetNtop4"] = function() { abort("'inetNtop4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "inetPton6")) Module["inetPton6"] = function() { abort("'inetPton6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "inetNtop6")) Module["inetNtop6"] = function() { abort("'inetNtop6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readSockaddr")) Module["readSockaddr"] = function() { abort("'readSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeSockaddr")) Module["writeSockaddr"] = function() { abort("'writeSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = function() { abort("'DNS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getHostByName")) Module["getHostByName"] = function() { abort("'getHostByName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES")) Module["GAI_ERRNO_MESSAGES"] = function() { abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = function() { abort("'Protocols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = function() { abort("'Sockets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice")) Module["getRandomDevice"] = function() { abort("'getRandomDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "traverseStack")) Module["traverseStack"] = function() { abort("'traverseStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = function() { abort("'UNWIND_CACHE' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray")) Module["readAsmConstArgsArray"] = function() { abort("'readAsmConstArgsArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = function() { abort("'readAsmConstArgs' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM")) Module["mainThreadEM_ASM"] = function() { abort("'mainThreadEM_ASM' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = function() { abort("'jstoi_q' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = function() { abort("'jstoi_s' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName")) Module["getExecutableName"] = function() { abort("'getExecutableName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = function() { abort("'listenOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = function() { abort("'autoResumeAudioContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy")) Module["dynCallLegacy"] = function() { abort("'dynCallLegacy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller")) Module["getDynCaller"] = function() { abort("'getDynCaller' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks")) Module["callRuntimeCallbacks"] = function() { abort("'callRuntimeCallbacks' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "wasmTableMirror")) Module["wasmTableMirror"] = function() { abort("'wasmTableMirror' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setWasmTableEntry")) Module["setWasmTableEntry"] = function() { abort("'setWasmTableEntry' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getWasmTableEntry")) Module["getWasmTableEntry"] = function() { abort("'getWasmTableEntry' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "handleException")) Module["handleException"] = function() { abort("'handleException' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePush")) Module["runtimeKeepalivePush"] = function() { abort("'runtimeKeepalivePush' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePop")) Module["runtimeKeepalivePop"] = function() { abort("'runtimeKeepalivePop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "callUserCallback")) Module["callUserCallback"] = function() { abort("'callUserCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "maybeExit")) Module["maybeExit"] = function() { abort("'maybeExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "safeSetTimeout")) Module["safeSetTimeout"] = function() { abort("'safeSetTimeout' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "asmjsMangle")) Module["asmjsMangle"] = function() { abort("'asmjsMangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "asyncLoad")) Module["asyncLoad"] = function() { abort("'asyncLoad' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "alignMemory")) Module["alignMemory"] = function() { abort("'alignMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc")) Module["mmapAlloc"] = function() { abort("'mmapAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = function() { abort("'reallyNegative' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "unSign")) Module["unSign"] = function() { abort("'unSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "reSign")) Module["reSign"] = function() { abort("'reSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = function() { abort("'formatString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = function() { abort("'PATH' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = function() { abort("'PATH_FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = function() { abort("'SYSCALLS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2")) Module["syscallMmap2"] = function() { abort("'syscallMmap2' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap")) Module["syscallMunmap"] = function() { abort("'syscallMunmap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getSocketFromFD")) Module["getSocketFromFD"] = function() { abort("'getSocketFromFD' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getSocketAddress")) Module["getSocketAddress"] = function() { abort("'getSocketAddress' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = function() { abort("'JSEvents' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerKeyEventCallback")) Module["registerKeyEventCallback"] = function() { abort("'registerKeyEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = function() { abort("'specialHTMLTargets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString")) Module["maybeCStringToJsString"] = function() { abort("'maybeCStringToJsString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget")) Module["findEventTarget"] = function() { abort("'findEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget")) Module["findCanvasEventTarget"] = function() { abort("'findCanvasEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getBoundingClientRect")) Module["getBoundingClientRect"] = function() { abort("'getBoundingClientRect' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillMouseEventData")) Module["fillMouseEventData"] = function() { abort("'fillMouseEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerMouseEventCallback")) Module["registerMouseEventCallback"] = function() { abort("'registerMouseEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerWheelEventCallback")) Module["registerWheelEventCallback"] = function() { abort("'registerWheelEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerUiEventCallback")) Module["registerUiEventCallback"] = function() { abort("'registerUiEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerFocusEventCallback")) Module["registerFocusEventCallback"] = function() { abort("'registerFocusEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceOrientationEventData")) Module["fillDeviceOrientationEventData"] = function() { abort("'fillDeviceOrientationEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceOrientationEventCallback")) Module["registerDeviceOrientationEventCallback"] = function() { abort("'registerDeviceOrientationEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceMotionEventData")) Module["fillDeviceMotionEventData"] = function() { abort("'fillDeviceMotionEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceMotionEventCallback")) Module["registerDeviceMotionEventCallback"] = function() { abort("'registerDeviceMotionEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "screenOrientation")) Module["screenOrientation"] = function() { abort("'screenOrientation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillOrientationChangeEventData")) Module["fillOrientationChangeEventData"] = function() { abort("'fillOrientationChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerOrientationChangeEventCallback")) Module["registerOrientationChangeEventCallback"] = function() { abort("'registerOrientationChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillFullscreenChangeEventData")) Module["fillFullscreenChangeEventData"] = function() { abort("'fillFullscreenChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerFullscreenChangeEventCallback")) Module["registerFullscreenChangeEventCallback"] = function() { abort("'registerFullscreenChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerRestoreOldStyle")) Module["registerRestoreOldStyle"] = function() { abort("'registerRestoreOldStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "hideEverythingExceptGivenElement")) Module["hideEverythingExceptGivenElement"] = function() { abort("'hideEverythingExceptGivenElement' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "restoreHiddenElements")) Module["restoreHiddenElements"] = function() { abort("'restoreHiddenElements' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setLetterbox")) Module["setLetterbox"] = function() { abort("'setLetterbox' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "currentFullscreenStrategy")) Module["currentFullscreenStrategy"] = function() { abort("'currentFullscreenStrategy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "restoreOldWindowedStyle")) Module["restoreOldWindowedStyle"] = function() { abort("'restoreOldWindowedStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "softFullscreenResizeWebGLRenderTarget")) Module["softFullscreenResizeWebGLRenderTarget"] = function() { abort("'softFullscreenResizeWebGLRenderTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "doRequestFullscreen")) Module["doRequestFullscreen"] = function() { abort("'doRequestFullscreen' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillPointerlockChangeEventData")) Module["fillPointerlockChangeEventData"] = function() { abort("'fillPointerlockChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockChangeEventCallback")) Module["registerPointerlockChangeEventCallback"] = function() { abort("'registerPointerlockChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockErrorEventCallback")) Module["registerPointerlockErrorEventCallback"] = function() { abort("'registerPointerlockErrorEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "requestPointerLock")) Module["requestPointerLock"] = function() { abort("'requestPointerLock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillVisibilityChangeEventData")) Module["fillVisibilityChangeEventData"] = function() { abort("'fillVisibilityChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerVisibilityChangeEventCallback")) Module["registerVisibilityChangeEventCallback"] = function() { abort("'registerVisibilityChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerTouchEventCallback")) Module["registerTouchEventCallback"] = function() { abort("'registerTouchEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillGamepadEventData")) Module["fillGamepadEventData"] = function() { abort("'fillGamepadEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerGamepadEventCallback")) Module["registerGamepadEventCallback"] = function() { abort("'registerGamepadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerBeforeUnloadEventCallback")) Module["registerBeforeUnloadEventCallback"] = function() { abort("'registerBeforeUnloadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "fillBatteryEventData")) Module["fillBatteryEventData"] = function() { abort("'fillBatteryEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "battery")) Module["battery"] = function() { abort("'battery' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerBatteryEventCallback")) Module["registerBatteryEventCallback"] = function() { abort("'registerBatteryEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setCanvasElementSize")) Module["setCanvasElementSize"] = function() { abort("'setCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getCanvasElementSize")) Module["getCanvasElementSize"] = function() { abort("'getCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = function() { abort("'demangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = function() { abort("'demangleAll' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = function() { abort("'jsStackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = function() { abort("'getEnvStrings' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = function() { abort("'checkWasiClock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "flush_NO_FILESYSTEM")) Module["flush_NO_FILESYSTEM"] = function() { abort("'flush_NO_FILESYSTEM' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = function() { abort("'writeI53ToI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = function() { abort("'writeI53ToI64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = function() { abort("'writeI53ToI64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = function() { abort("'writeI53ToU64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = function() { abort("'writeI53ToU64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = function() { abort("'readI53FromI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = function() { abort("'readI53FromU64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = function() { abort("'convertI32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = function() { abort("'convertU32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setImmediateWrapped")) Module["setImmediateWrapped"] = function() { abort("'setImmediateWrapped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "clearImmediateWrapped")) Module["clearImmediateWrapped"] = function() { abort("'clearImmediateWrapped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate")) Module["polyfillSetImmediate"] = function() { abort("'polyfillSetImmediate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount")) Module["uncaughtExceptionCount"] = function() { abort("'uncaughtExceptionCount' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast")) Module["exceptionLast"] = function() { abort("'exceptionLast' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught")) Module["exceptionCaught"] = function() { abort("'exceptionCaught' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo")) Module["ExceptionInfo"] = function() { abort("'ExceptionInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo")) Module["CatchInfo"] = function() { abort("'CatchInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef")) Module["exception_addRef"] = function() { abort("'exception_addRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef")) Module["exception_decRef"] = function() { abort("'exception_decRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = function() { abort("'Browser' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers")) Module["funcWrappers"] = function() { abort("'funcWrappers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop")) Module["setMainLoop"] = function() { abort("'setMainLoop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "wget")) Module["wget"] = function() { abort("'wget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "FS")) Module["FS"] = function() { abort("'FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "MEMFS")) Module["MEMFS"] = function() { abort("'MEMFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "TTY")) Module["TTY"] = function() { abort("'TTY' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS")) Module["PIPEFS"] = function() { abort("'PIPEFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS")) Module["SOCKFS"] = function() { abort("'SOCKFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "_setNetworkCallback")) Module["_setNetworkCallback"] = function() { abort("'_setNetworkCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "tempFixedLengthArray")) Module["tempFixedLengthArray"] = function() { abort("'tempFixedLengthArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "miniTempWebGLFloatBuffers")) Module["miniTempWebGLFloatBuffers"] = function() { abort("'miniTempWebGLFloatBuffers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "heapObjectForWebGLType")) Module["heapObjectForWebGLType"] = function() { abort("'heapObjectForWebGLType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "heapAccessShiftForWebGLHeap")) Module["heapAccessShiftForWebGLHeap"] = function() { abort("'heapAccessShiftForWebGLHeap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function() { abort("'GL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet")) Module["emscriptenWebGLGet"] = function() { abort("'emscriptenWebGLGet' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "computeUnpackAlignedImageSize")) Module["computeUnpackAlignedImageSize"] = function() { abort("'computeUnpackAlignedImageSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData")) Module["emscriptenWebGLGetTexPixelData"] = function() { abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform")) Module["emscriptenWebGLGetUniform"] = function() { abort("'emscriptenWebGLGetUniform' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "webglGetUniformLocation")) Module["webglGetUniformLocation"] = function() { abort("'webglGetUniformLocation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "webglPrepareUniformLocationsBeforeFirstUse")) Module["webglPrepareUniformLocationsBeforeFirstUse"] = function() { abort("'webglPrepareUniformLocationsBeforeFirstUse' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "webglGetLeftBracePos")) Module["webglGetLeftBracePos"] = function() { abort("'webglGetLeftBracePos' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib")) Module["emscriptenWebGLGetVertexAttrib"] = function() { abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray")) Module["writeGLArray"] = function() { abort("'writeGLArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "AL")) Module["AL"] = function() { abort("'AL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = function() { abort("'SDL_unicode' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = function() { abort("'SDL_ttfContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = function() { abort("'SDL_audio' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = function() { abort("'SDL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = function() { abort("'SDL_gfx' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLUT")) Module["GLUT"] = function() { abort("'GLUT' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "EGL")) Module["EGL"] = function() { abort("'EGL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window")) Module["GLFW_Window"] = function() { abort("'GLFW_Window' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLFW")) Module["GLFW"] = function() { abort("'GLFW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLEW")) Module["GLEW"] = function() { abort("'GLEW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "IDBStore")) Module["IDBStore"] = function() { abort("'IDBStore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError")) Module["runAndAbortIfError"] = function() { abort("'runAndAbortIfError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emval_handle_array")) Module["emval_handle_array"] = function() { abort("'emval_handle_array' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emval_free_list")) Module["emval_free_list"] = function() { abort("'emval_free_list' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emval_symbols")) Module["emval_symbols"] = function() { abort("'emval_symbols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "init_emval")) Module["init_emval"] = function() { abort("'init_emval' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "count_emval_handles")) Module["count_emval_handles"] = function() { abort("'count_emval_handles' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "get_first_emval")) Module["get_first_emval"] = function() { abort("'get_first_emval' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getStringOrSymbol")) Module["getStringOrSymbol"] = function() { abort("'getStringOrSymbol' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Emval")) Module["Emval"] = function() { abort("'Emval' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emval_newers")) Module["emval_newers"] = function() { abort("'emval_newers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "craftEmvalAllocator")) Module["craftEmvalAllocator"] = function() { abort("'craftEmvalAllocator' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emval_get_global")) Module["emval_get_global"] = function() { abort("'emval_get_global' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emval_methodCallers")) Module["emval_methodCallers"] = function() { abort("'emval_methodCallers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "InternalError")) Module["InternalError"] = function() { abort("'InternalError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "BindingError")) Module["BindingError"] = function() { abort("'BindingError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UnboundTypeError")) Module["UnboundTypeError"] = function() { abort("'UnboundTypeError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "PureVirtualError")) Module["PureVirtualError"] = function() { abort("'PureVirtualError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "init_embind")) Module["init_embind"] = function() { abort("'init_embind' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "throwInternalError")) Module["throwInternalError"] = function() { abort("'throwInternalError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "throwBindingError")) Module["throwBindingError"] = function() { abort("'throwBindingError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "throwUnboundTypeError")) Module["throwUnboundTypeError"] = function() { abort("'throwUnboundTypeError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ensureOverloadTable")) Module["ensureOverloadTable"] = function() { abort("'ensureOverloadTable' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "exposePublicSymbol")) Module["exposePublicSymbol"] = function() { abort("'exposePublicSymbol' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "replacePublicSymbol")) Module["replacePublicSymbol"] = function() { abort("'replacePublicSymbol' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "extendError")) Module["extendError"] = function() { abort("'extendError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "createNamedFunction")) Module["createNamedFunction"] = function() { abort("'createNamedFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registeredInstances")) Module["registeredInstances"] = function() { abort("'registeredInstances' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getBasestPointer")) Module["getBasestPointer"] = function() { abort("'getBasestPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerInheritedInstance")) Module["registerInheritedInstance"] = function() { abort("'registerInheritedInstance' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "unregisterInheritedInstance")) Module["unregisterInheritedInstance"] = function() { abort("'unregisterInheritedInstance' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getInheritedInstance")) Module["getInheritedInstance"] = function() { abort("'getInheritedInstance' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getInheritedInstanceCount")) Module["getInheritedInstanceCount"] = function() { abort("'getInheritedInstanceCount' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getLiveInheritedInstances")) Module["getLiveInheritedInstances"] = function() { abort("'getLiveInheritedInstances' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registeredTypes")) Module["registeredTypes"] = function() { abort("'registeredTypes' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "awaitingDependencies")) Module["awaitingDependencies"] = function() { abort("'awaitingDependencies' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "typeDependencies")) Module["typeDependencies"] = function() { abort("'typeDependencies' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registeredPointers")) Module["registeredPointers"] = function() { abort("'registeredPointers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerType")) Module["registerType"] = function() { abort("'registerType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "whenDependentTypesAreResolved")) Module["whenDependentTypesAreResolved"] = function() { abort("'whenDependentTypesAreResolved' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "embind_charCodes")) Module["embind_charCodes"] = function() { abort("'embind_charCodes' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "embind_init_charCodes")) Module["embind_init_charCodes"] = function() { abort("'embind_init_charCodes' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readLatin1String")) Module["readLatin1String"] = function() { abort("'readLatin1String' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getTypeName")) Module["getTypeName"] = function() { abort("'getTypeName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "heap32VectorToArray")) Module["heap32VectorToArray"] = function() { abort("'heap32VectorToArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "requireRegisteredType")) Module["requireRegisteredType"] = function() { abort("'requireRegisteredType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getShiftFromSize")) Module["getShiftFromSize"] = function() { abort("'getShiftFromSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "integerReadValueFromPointer")) Module["integerReadValueFromPointer"] = function() { abort("'integerReadValueFromPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "enumReadValueFromPointer")) Module["enumReadValueFromPointer"] = function() { abort("'enumReadValueFromPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "floatReadValueFromPointer")) Module["floatReadValueFromPointer"] = function() { abort("'floatReadValueFromPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "simpleReadValueFromPointer")) Module["simpleReadValueFromPointer"] = function() { abort("'simpleReadValueFromPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "runDestructors")) Module["runDestructors"] = function() { abort("'runDestructors' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "new_")) Module["new_"] = function() { abort("'new_' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "craftInvokerFunction")) Module["craftInvokerFunction"] = function() { abort("'craftInvokerFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "embind__requireFunction")) Module["embind__requireFunction"] = function() { abort("'embind__requireFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "tupleRegistrations")) Module["tupleRegistrations"] = function() { abort("'tupleRegistrations' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "structRegistrations")) Module["structRegistrations"] = function() { abort("'structRegistrations' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "genericPointerToWireType")) Module["genericPointerToWireType"] = function() { abort("'genericPointerToWireType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "constNoSmartPtrRawPointerToWireType")) Module["constNoSmartPtrRawPointerToWireType"] = function() { abort("'constNoSmartPtrRawPointerToWireType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "nonConstNoSmartPtrRawPointerToWireType")) Module["nonConstNoSmartPtrRawPointerToWireType"] = function() { abort("'nonConstNoSmartPtrRawPointerToWireType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "init_RegisteredPointer")) Module["init_RegisteredPointer"] = function() { abort("'init_RegisteredPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer")) Module["RegisteredPointer"] = function() { abort("'RegisteredPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_getPointee")) Module["RegisteredPointer_getPointee"] = function() { abort("'RegisteredPointer_getPointee' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_destructor")) Module["RegisteredPointer_destructor"] = function() { abort("'RegisteredPointer_destructor' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_deleteObject")) Module["RegisteredPointer_deleteObject"] = function() { abort("'RegisteredPointer_deleteObject' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_fromWireType")) Module["RegisteredPointer_fromWireType"] = function() { abort("'RegisteredPointer_fromWireType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "runDestructor")) Module["runDestructor"] = function() { abort("'runDestructor' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "releaseClassHandle")) Module["releaseClassHandle"] = function() { abort("'releaseClassHandle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "finalizationGroup")) Module["finalizationGroup"] = function() { abort("'finalizationGroup' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "detachFinalizer_deps")) Module["detachFinalizer_deps"] = function() { abort("'detachFinalizer_deps' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "detachFinalizer")) Module["detachFinalizer"] = function() { abort("'detachFinalizer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "attachFinalizer")) Module["attachFinalizer"] = function() { abort("'attachFinalizer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "makeClassHandle")) Module["makeClassHandle"] = function() { abort("'makeClassHandle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "init_ClassHandle")) Module["init_ClassHandle"] = function() { abort("'init_ClassHandle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle")) Module["ClassHandle"] = function() { abort("'ClassHandle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_isAliasOf")) Module["ClassHandle_isAliasOf"] = function() { abort("'ClassHandle_isAliasOf' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "throwInstanceAlreadyDeleted")) Module["throwInstanceAlreadyDeleted"] = function() { abort("'throwInstanceAlreadyDeleted' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_clone")) Module["ClassHandle_clone"] = function() { abort("'ClassHandle_clone' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_delete")) Module["ClassHandle_delete"] = function() { abort("'ClassHandle_delete' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "deletionQueue")) Module["deletionQueue"] = function() { abort("'deletionQueue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_isDeleted")) Module["ClassHandle_isDeleted"] = function() { abort("'ClassHandle_isDeleted' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_deleteLater")) Module["ClassHandle_deleteLater"] = function() { abort("'ClassHandle_deleteLater' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "flushPendingDeletes")) Module["flushPendingDeletes"] = function() { abort("'flushPendingDeletes' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "delayFunction")) Module["delayFunction"] = function() { abort("'delayFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setDelayFunction")) Module["setDelayFunction"] = function() { abort("'setDelayFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "RegisteredClass")) Module["RegisteredClass"] = function() { abort("'RegisteredClass' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "shallowCopyInternalPointer")) Module["shallowCopyInternalPointer"] = function() { abort("'shallowCopyInternalPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "downcastPointer")) Module["downcastPointer"] = function() { abort("'downcastPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "upcastPointer")) Module["upcastPointer"] = function() { abort("'upcastPointer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "validateThis")) Module["validateThis"] = function() { abort("'validateThis' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "char_0")) Module["char_0"] = function() { abort("'char_0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "char_9")) Module["char_9"] = function() { abort("'char_9' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "makeLegalFunctionName")) Module["makeLegalFunctionName"] = function() { abort("'makeLegalFunctionName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function() { abort("'allocateUTF8OnStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64")) Module["intArrayFromBase64"] = function() { abort("'intArrayFromBase64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI")) Module["tryParseAsDataURI"] = function() { abort("'tryParseAsDataURI' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", { configurable: true, get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", { configurable: true, get: function() { abort("'ALLOC_STACK' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") } });

var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  _emscripten_stack_init();
  writeStackCookie();
}

/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = function(x) {
    has = true;
  }
  try { // it doesn't matter if it fails
    var flush = null;
    if (flush) flush();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)');
  }
}

/** @param {boolean|number=} implicit */
function exit(status, implicit) {
  EXITSTATUS = status;

  checkUnflushedContent();

  if (keepRuntimeAlive()) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
      err(msg);
    }
  } else {
    exitRuntime();
  }

  procExit(status);
}

function procExit(code) {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module['onExit']) Module['onExit'](code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();





/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// EXPORT_ES6 option does not work as described at
// https://github.com/kripken/emscripten/issues/6284, so we have to
// manually add this by '--post-js' setting when the Emscripten compilation.
export default Module;
