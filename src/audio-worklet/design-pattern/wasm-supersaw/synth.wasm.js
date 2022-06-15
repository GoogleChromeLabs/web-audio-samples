

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
var Module = typeof Module != 'undefined' ? Module : {};

// See https://caniuse.com/mdn-javascript_builtins_object_assign

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = true;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
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
  let toLog = e;
  if (e && typeof e == 'object' && e.stack) {
    toLog = [e, e.stack];
  }
  err('exiting due to exception: ' + toLog);
}

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      const data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    let data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = function readAsync(f, onload, onerror) {
    setTimeout(() => onload(readBinary(f)), 0);
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      logExceptionOnExit(toThrow);
      quit(status);
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
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
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

if (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';
function alignMemory() { abort('`alignMemory` is now a library function and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line'); }

assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add 'web' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add 'worker' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-sENVIRONMENT` to enable.");




var STACK_ALIGN = 16;
var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': case 'u8': return 1;
    case 'i16': case 'u16': return 2;
    case 'i32': case 'u32': return 4;
    case 'i64': case 'u64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length - 1] === '*') {
        return POINTER_SIZE;
      } else if (type[0] === 'i') {
        const bits = Number(type.substr(1));
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


// This gives correct answers for everything less than 2^{14} = 16384
// I hope nobody is contemplating functions with 16384 arguments...
function uleb128Encode(n) {
  assert(n < 16384);
  if (n < 128) {
    return [n];
  }
  return [(n % 128) | 128, n >> 7];
}

// Converts a signature like 'vii' into a description of the wasm types, like
// { parameters: ['i32', 'i32'], results: [] }.
function sigToWasmTypes(sig) {
  var typeNames = {
    'i': 'i32',
    'j': 'i64',
    'f': 'f32',
    'd': 'f64',
    'p': 'i32',
  };
  var type = {
    parameters: [],
    results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
  };
  for (var i = 1; i < sig.length; ++i) {
    assert(sig[i] in typeNames, 'invalid signature char: ' + sig[i]);
    type.parameters.push(typeNames[sig[i]]);
  }
  return type;
}

// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function == "function") {
    return new WebAssembly.Function(sigToWasmTypes(sig), func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'p': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection = typeSection.concat(uleb128Encode(sigParam.length));
  for (var i = 0; i < sigParam.length; ++i) {
    assert(sigParam[i] in typeCodes, 'invalid signature char: ' + sigParam[i]);
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the section code and overall length of the type section into the
  // section header
  typeSection = [0x01 /* Type section code */].concat(
    uleb128Encode(typeSection.length),
    typeSection
  );

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

function updateTableMap(offset, count) {
  for (var i = offset; i < offset + count; i++) {
    var item = getWasmTableEntry(i);
    // Ignore null values.
    if (item) {
      functionsInTableMap.set(item, i);
    }
  }
}

/**
 * Add a function to the table.
 * 'sig' parameter is required if the function being added is a JS function.
 * @param {string=} sig
 */
function addFunction(func, sig) {
  assert(typeof func != 'undefined');

  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    updateTableMap(0, wasmTable.length);
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
    assert(typeof sig != 'undefined', 'Missing signature argument to addFunction: ' + func);
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

// end include: runtime_functions.js
// include: runtime_debug.js


function legacyModuleProp(prop, newName) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get: function() {
        abort('Module.' + prop + ' has been replaced with plain ' + newName + ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort('`Module.' + prop + '` was supplied but `' + prop + '` not included in INCOMING_MODULE_JS_API');
  }
}

function unexportedMessage(sym, isFSSybol) {
  var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
  if (isFSSybol) {
    msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
  }
  return msg;
}

function unexportedRuntimeSymbol(sym, isFSSybol) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get: function() {
        abort(unexportedMessage(sym, isFSSybol));
      }
    });
  }
}

function unexportedRuntimeFunction(sym, isFSSybol) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Module[sym] = () => abort(unexportedMessage(sym, isFSSybol));
  }
}

// end include: runtime_debug.js
var tempRet0 = 0;
var setTempRet0 = (value) => { tempRet0 = value; };
var getTempRet0 = () => tempRet0;



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');
var noExitRuntime = Module['noExitRuntime'] || true;legacyModuleProp('noExitRuntime', 'noExitRuntime');

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

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
    abort('Assertion failed' + (text ? ': ' + text : ''));
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
    if (returnType === 'string') {
      
      return UTF8ToString(ret);
    }
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

// include: runtime_legacy.js


var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call

/**
 * allocate(): This function is no longer used by emscripten but is kept around to avoid
 *             breaking external users.
 *             You should normally not use allocate(), and instead allocate
 *             memory using _malloc()/stackAlloc(), initialize it with
 *             setValue(), and so forth.
 * @param {(Uint8Array|Array<number>)} slab: An array of data.
 * @param {number=} allocator : How to allocate memory, see ALLOC_*
 */
function allocate(slab, allocator) {
  var ret;
  assert(typeof allocator == 'number', 'allocate no longer takes a type argument')
  assert(typeof slab != 'number', 'allocate no longer takes a number as arg0')

  if (allocator == ALLOC_STACK) {
    ret = stackAlloc(slab.length);
  } else {
    ret = _malloc(slab.length);
  }

  if (!slab.subarray && !slab.slice) {
    slab = new Uint8Array(slab);
  }
  HEAPU8.set(slab, ret);
  return ret;
}

// end include: runtime_legacy.js
// include: runtime_strings.js


// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.
/**
 * heapOrArray is either a regular array, or a JavaScript typed array view.
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heapOrArray[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
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

var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;

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
    assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
    HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
}

// end include: runtime_strings_extra.js
// Memory management

var HEAP,
/** @type {!ArrayBuffer} */
  buffer,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
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

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;legacyModuleProp('INITIAL_MEMORY', 'INITIAL_MEMORY');

assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it.
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(INITIAL_MEMORY == 16777216, 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

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
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAP32[((max)>>2)] = 0x2135467;
  HEAP32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' 0x' + cookie1.toString(16));
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
}

// end include: runtime_stack_check.js
// include: runtime_assertions.js


// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;

function keepRuntimeAlive() {
  return noExitRuntime;
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
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
  callRuntimeCallbacks(__ATINIT__);
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
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
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
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // defintion for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
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
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
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
/** @param {boolean=} fixedasm */
function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB7IGAgAAkYAF/AX9gAX8AYAABf2ACf38Bf2ACf38AYAN/f38Bf2ADf39/AGAAAGAEf39/fwBgBX9/f39/AGAGf39/f39/AGACf30AYAF9AX1gAXwBfGADf319AX1gAn99AX1gAX8BfGAEf39/fwF/YAN/fX0AYAF/AX1gDX9/f39/f39/f39/f38AYAh/f39/f39/fwBgAAF8YAN/f30AYAR/fX9/AGAFf39/fX0AYAJ9fQF8YAJ/fAF8YAJ8fAF8YAF+AX9gA3x+fgF8YAJ9fQF9YAJ8fwF9YAN/fn8BfmAFf39/fn4AYAd/f39/f39/AAKOhICAABIDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAFANlbnYYX19jeGFfYWxsb2NhdGVfZXhjZXB0aW9uAAADZW52C19fY3hhX3Rocm93AAYDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IACgNlbnYNX19hc3NlcnRfZmFpbAAIA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uABUDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAAEA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wACQNlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAAkDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQABgNlbnYbX2VtYmluZF9yZWdpc3Rlcl9zdGRfc3RyaW5nAAQDZW52HF9lbWJpbmRfcmVnaXN0ZXJfc3RkX3dzdHJpbmcABgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9lbXZhbAAEA2VudhxfZW1iaW5kX3JlZ2lzdGVyX21lbW9yeV92aWV3AAYDZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAGA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52BWFib3J0AAcDZW52F19lbWJpbmRfcmVnaXN0ZXJfYmlnaW50ACMD7IKAgADqAgcHBwACAgECAgICAgICAAEEBAQHAAICAQICAgIAAQYEAAAFBQUAAAsBBAEGAwMDBQQEAwUDAAAADQQAAwQEAAUDAwAABAAACQQAAAAAAAADAAQEFgsABQYAAxEEAAAGAAEDBQADAAEIBAQBAQAG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ACAAowsQACABmiABIAAbEJoCIAGiCxUBAX8jAEEQayIBIAA5AwggASsDCAsQACAARAAAAAAAAABwEJkCCxAAIABEAAAAAAAAABAQmQILBQAgAJkLmQkDBn8Dfgl8IwBBEGsiAiQAIAG9IghCNIinIgNB/w9xIgRBwndqIQUCQAJAAkAgAL0iCUI0iKciBkGBcGpBgnBJDQBBACEHIAVB/35LDQELAkAgCEIBhiIKQn98Qv////////9vVA0ARAAAAAAAAPA/IQsgCUKAgICAgICA+D9RDQIgClANAgJAAkAgCUIBhiIJQoCAgICAgIBwVg0AIApCgYCAgICAgHBUDQELIAAgAaAhCwwDCyAJQoCAgICAgIDw/wBRDQJEAAAAAAAAAAAgASABoiAJQv/////////v/wBWIAhCf1VzGyELDAILAkAgCUIBhkJ/fEL/////////b1QNACAAIACiIQsCQCAJQn9VDQAgC5ogCyAIEJ8CQQFGGyELCyAIQn9VDQIgAkQAAAAAAADwPyALozkDCCACKwMIIQsMAgtBACEHAkAgCUJ/VQ0AAkAgCBCfAiIHDQAgABCYAiELDAMLIAZB/w9xIQYgCUL///////////8AgyEJIAdBAUZBEnQhBwsCQCAFQf9+Sw0ARAAAAAAAAPA/IQsgCUKAgICAgICA+D9RDQICQCAEQb0HSw0AIAEgAZogCUKAgICAgICA+D9WG0QAAAAAAADwP6AhCwwDCwJAIANBgBBJIAlCgYCAgICAgPg/VEYNAEEAEJsCIQsMAwtBABCcAiELDAILIAYNACAARAAAAAAAADBDor1C////////////AINCgICAgICAgOB8fCEJCwJAIAhCgICAQIO/IgwgCSAJQoCAgICw1dqMQHwiCEKAgICAgICAeIN9IglCgICAgAh8QoCAgIBwg78iCyAIQi2Ip0H/AHFBBXQiBUHQLWorAwAiDaJEAAAAAAAA8L+gIgAgAEEAKwOYLSIOoiIPoiIQIAhCNIentyIRQQArA4gtoiAFQeAtaisDAKAiEiAAIA0gCb8gC6GiIhOgIgCgIgugIg0gECALIA2hoCATIA8gDiAAoiIOoKIgEUEAKwOQLaIgBUHoLWorAwCgIAAgEiALoaCgoKAgACAAIA6iIguiIAsgCyAAQQArA8gtokEAKwPALaCiIABBACsD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AQsgAigCCCEACyACIAE2AgggACABNgIMIAEgAjYCDCABIAA2AggPC0EfIQICQCAAQf///wdLDQAgAEEIdiICIAJBgP4/akEQdkEIcSICdCIEIARBgOAfakEQdkEEcSIEdCIGIAZBgIAPakEQdkECcSIGdEEPdiACIARyIAZyayICQQF0IAAgAkEVanZBAXFyQRxqIQILIAEgAjYCHCABQgA3AhAgAkECdEHE3QBqIQQCQAJAAkACQEEAKAKYWyIGQQEgAnQiA3ENAEEAIAYgA3I2AphbIAQgATYCACABIAQ2AhgMAQsgAEEAQRkgAkEBdmsgAkEfRht0IQIgBCgCACEGA0AgBiIEKAIEQXhxIABGDQIgAkEddiEGIAJBAXQhAiAEIAZBBHFqQRBqIgMoAgAiBg0ACyADIAE2AgAgASAENgIYCyABIAE2AgwgASABNgIIDAELIAQoAggiACABNgIMIAQgATYCCCABQQA2AhggASAENgIMIAEgADYCCAtBAEEAKAK0W0F/aiIBQX8gARs2ArRbCwsHAD8AQRB0C1IBAn9BACgCgFsiASAAQQNqQXxxIgJqIQACQAJAIAJFDQAgACABTQ0BCwJAIAAQsQJNDQAgABAPRQ0BC0EAIAA2AoBbIAEPCxCuAkEwNgIAQX8LMwEBfyAAQQEgABshAQJAA0AgARCvAiIADQECQBC+AiIARQ0AIAARBwAMAQsLEBAACyAACwcAIAAQswILBwAgABCwAgsHACAAELUCCxAAIABByNgAQQhqNgIAIAALPAECfyABEK0CIgJBDWoQswIiA0EANgIIIAMgAjYCBCADIAI2AgAgACADELkCIAEgAkEBahCVAjYCACAACwcAIABBDGoLIAAgABC3AiIAQbjZAEEIajYCACAAQQRqIAEQuAIaIAALBABBAQsFABAQAAsHACAAKAIACwkAQYTfABC9AgsLAEGkD0EAELwCAAtZAQJ/IAEtAAAhAgJAIAAtAAAiA0UNACADIAJB/wFxRw0AA0AgAS0AASECIAAtAAEiA0UNASABQQFqIQEgAEEBaiEAIAMgAkH/AXFGDQALCyADIAJB/wFxawsHACAAEOwCCwIACwIACwoAIAAQwQIQtQILCgAgABDBAhC1AgsKACAAEMECELUCCwoAIAAQwQIQtQILCwAgACABQQAQyQILMAACQCAC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JAsgAUEBOgA2CwsgAAJAIAEoAgQgAkcNACABKAIcQQFGDQAgASADNgIcCwuCAgACQCAAIAEoAgggBBDJAkUNACABIAEgAiADENUCDwsCQAJAIAAgASgCACAEEMkCRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQIgAUEBNgIgDwsgASADNgIgAkAgASgCLEEERg0AIAFBADsBNCAAKAIIIgAgASACIAJBASAEIAAoAgAoAhQRCgACQCABLQA1RQ0AIAFBAzYCLCABLQA0RQ0BDAMLIAFBBDYCLAsgASACNgIUIAEgASgCKEEBajYCKCABKAIkQQFHDQEgASgCGEECRw0BIAFBAToANg8LIAAoAggiACABIAIgAyAEIAAoAgAoAhgRCQALC5sBAAJAIAAgASgCCCAEEMkCRQ0AIAEgASACIAMQ1QIPCwJAIAAgASgCACAEEMkCRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQEgAUEBNgIgDwsgASACNgIUIAEgAzYCICABIAEoAihBAWo2AigCQCABKAIkQQFHDQAgASgCGEECRw0AIAFBAToANgsgAUEENgIsCws+AAJAIAAgASgCCCAFEMkCRQ0AIAEgASACIAMgBBDUAg8LIAAoAggiACABIAIgAyAEIAUgACgCACgCFBEKAAshAAJAIAAgASgCCCAFEMkCRQ0AIAEgASACIAMgBBDUAgsLHgACQCAADQBBAA8LIABB5NIAQfTTAEEAEMwCQQBHCwQAIAALDQAgABDbAhogABC1AgsFAEHTCAsVACAAELcCIgBBoNgAQQhqNgIAIAALDQAgABDbAhogABC1AgsFAEGmCgsVACAAEN4CIgBBtNgAQQhqNgIAIAALDQAgABDbAhogABC1AgsFAEH+CAscACAAQbjZAEEIajYCACAAQQRqEOUCGiAAENsCCysBAX8CQCAAELsCRQ0AIAAoAgAQ5gIiAUEIahDnAkF/Sg0AIAEQtQILIAALBwAgAEF0agsVAQF/IAAgACgCAEF/aiIBNgIAIAELDQAgABDkAhogABC1AgsKACAAQQRqEOoCCwcAIAAoAgALDQAgABDkAhogABC1AgsEACAACwQAIwALBgAgACQACxIBAn8jACAAa0FwcSIBJAAgAQsVAEGg38ACJAJBlN8AQQ9qQXBxJAELBwAjACMBawsEACMCCwQAIwELAgALAgALDQBBiN8AEPQCQYzfAAsJAEGI3wAQ9QILBABBAQsCAAu5AgEDfwJAIAANAEEAIQECQEEAKAKQX0UNAEEAKAKQXxD6AiEBCwJAQQAoApBfRQ0AQQAoApBfEPoCIAFyIQELAkAQ9gIoAgAiAEUNAANAQQAhAgJAIAAoAkxBAEgNACAAEPgCIQILAkAgACgCFCAAKAIcRg0AIAAQ+gIgAXIhAQsCQCACRQ0AIAAQ+QILIAAoAjgiAA0ACwsQ9wIgAQ8LQQAhAgJAIAAoAkxBAEgNACAAEPgCIQILAkACQAJAIAAoAhQgACgCHEYNACAAQQBBACAAKAIkEQUAGiAAKAIUDQBBfyEBIAINAQwCCwJAIAAoAgQiASAAKAIIIgNGDQAgACABIANrrEEBIAAoAigRIQAaC0EAIQEgAEEANgIcIABCADcDECAAQgA3AgQgAkUNAQsgABD5AgsgAQscACAAIAEgAiADpyADQiCIpyAEpyAEQiCIpxARCwuP04CAAAIAQYAIC7RSdW5zaWduZWQgc2hvcnQAdW5zaWduZWQgaW50AGZsb2F0AHVpbnQ2NF90AHZlY3RvcgBTeW50aGVzaXplcgByZW5kZXIAdW5zaWduZWQgY2hhcgBzdGQ6OmV4Y2VwdGlvbgBub3RlT24AYm9vbABlbXNjcmlwdGVuOjp2YWwAYmFkX2FycmF5X25ld19sZW5ndGgALi9zeW50aF9zcmMvVW5pdEdlbmVyYXRvci5oAHVuc2lnbmVkIGxvbmcAc3RkOjp3c3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAG5vdGVPZmYAc2V0U2FtcGxlUmF0ZQBTeW50aGVzaXplckJhc2UAZG91YmxlAHZvaWQAc3RkOjpiYWRfYWxsb2MAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBzYW1wbGVSYXRlID4gMABQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQAxMVN5bnRoZXNpemVyAIgrAADCBwAAUDExU3ludGhlc2l6ZXIAAAwsAADYBwAAAAAAANAHAABQSzExU3ludGhlc2l6ZXIADCwAAPgHAAABAAAA0AcAAGlpAHYAdmkA6AcAACQrAABpaWkAAAAAANAHAAASAAAAEwAAAAAAAACQCAAAFAAAABUAAAAWAAAAMTFTaW1wbGVWb2ljZQA5Vm9pY2VCYXNlADEzVW5pdEdlbmVyYXRvcgAAAACIKwAAaQgAALArAABeCAAAfAgAALArAABQCAAAhAgAAAAAAACECAAAFwAAABgAAAAZAAAAAAAAAHwIAAAaAAAAGwAAAAAAAADgCAAAHAAAAB0AAAAxMkJpcXVhZEZpbHRlcgAAsCsAANAIAAB8CAAAAAAAAAwJAAAeAAAAHwAAADEyRW52ZWxvcGVBRFNSAACwKwAA/AgAAHwIAAAAAAAAaAkAACAAAAAhAAAAIgAAADIxU2F3dG9vdGhPc2NpbGxhdG9yRFBXADE4U2F3dG9vdGhPc2NpbGxhdG9yAAAAALArAABECQAAfAgAALArAAAsCQAAXAkAAAAAAABcCQAAIwAAACQAAAAlAAAAAAAAALQJAAAmAAAAJwAAADIyRGlmZmVyZW50aWF0ZWRQYXJhYm9sYQAAAACIKwAAmAkAAMQqAADoBwAA9CoAAHZpaWkAMThTeW50aGVzaXplcldyYXBwZXIAAACwKwAAzQkAANAHAABQMThTeW50aGVzaXplcldyYXBwZXIAAAAMLAAA8AkAAAAAAADkCQAAUEsxOFN5bnRoZXNpemVyV3JhcHBlcgAADCwAABgKAAABAAAA5AkAAAgKAAAkKwAAAAAAAOQJAAAoAAAAKQAAAAAAAAAAAAAAxCoAAAgKAABIKwAAJCsAAHZpaWlpAAAAAAAAALQKAAArAAAALAAAAC0AAAAxNVBvd2VyT2ZUd29UYWJsZQAxMUxvb2t1cFRhYmxlAIgrAACeCgAAsCsAAIwKAACsCgAAAAAAAKwKAAAuAAAALwAAABkAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQAAiCsAANQKAABOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAiCsAABwLAABOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQAAiCsAAGQLAABOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAAIgrAACsCwAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAACIKwAA+AsAAE4xMGVtc2NyaXB0ZW4zdmFsRQAAiCsAAEQMAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ljRUUAAIgrAABgDAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAACIKwAAiAwAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQAAiCsAALAMAABOMTBlbXNjcmlwdGVuMTFt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';
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
    if (typeof fetch == 'function'
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
  // Also pthreads and wasm workers initialize the wasm instance through this path.
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
        if (typeof func == 'number') {
          if (callback.arg === undefined) {
            // Run the wasm function ptr with signature 'v'. If no function
            // with such signature was exported, this call does not need
            // to be emitted (and would confuse Closure)
            getWasmTableEntry(func)();
          } else {
            // If any function with signature 'vi' was exported, run
            // the callback with that signature.
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
      warnOnce('warning: build with -sDEMANGLE_SUPPORT to link in libcxxabi demangling');
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

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
      if (type.endsWith('*')) type = 'i32';
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
        // IE10+ special cases: It does have callstack info, but it is only
        // populated if an Error object is thrown, so try that as a special-case.
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

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
      if (type.endsWith('*')) type = 'i32';
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

  function setWasmTableEntry(idx, func) {
      wasmTable.set(idx, func);
      // With ABORT_ON_WASM_EXCEPTIONS wasmTable.get is overriden to return wrapped
      // functions so we need to call it here to retrieve the potential wrapper correctly
      // instead of just storing 'func' directly into wasmTableMirror
      wasmTableMirror[idx] = wasmTable.get(idx);
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
      return _malloc(size + 24) + 24;
    }

  /** @constructor */
  function ExceptionInfo(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 24;
  
      this.set_type = function(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      };
  
      this.get_type = function() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      };
  
      this.set_destructor = function(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      };
  
      this.get_destructor = function() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
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
        this.set_adjusted_ptr(0);
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
  
      this.set_adjusted_ptr = function(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      };
  
      this.get_adjusted_ptr = function() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      };
  
      // Get pointer which is expected to be received by catch clause in C++ code. It may be adjusted
      // when the pointer is casted to some of the exception object base classes (e.g. when virtual
      // inheritance is used). When a pointer is thrown this method should return the thrown pointer
      // itself.
      this.get_exception_ptr = function() {
        // Work around a fastcomp bug, this code is still included for some reason in a build without
        // exceptions support.
        var isPointer = ___cxa_is_pointer_type(this.get_type());
        if (isPointer) {
          return HEAPU32[((this.excPtr)>>2)];
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.excPtr;
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
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.";
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
      }
      return name;
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
      dependentTypes.forEach((dt, i) => {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(() => {
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
  function registerType(rawType, registeredInstance, options = {}) {
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
        callbacks.forEach((cb) => cb());
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
  
  var finalizationRegistry = false;
  
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
  
  var registeredPointers = {};
  
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
  
  var deletionQueue = [];
  function flushPendingDeletes() {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
      }
    }
  
  var delayFunction = undefined;
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
  function attachFinalizer(handle) {
      if ('undefined' === typeof FinalizationRegistry) {
          attachFinalizer = (handle) => handle;
          return handle;
      }
      // If the running environment has a FinalizationRegistry (see
      // https://github.com/tc39/proposal-weakrefs), then attach finalizers
      // for class handles.  We check for the presence of FinalizationRegistry
      // at run-time, not build-time.
      finalizationRegistry = new FinalizationRegistry((info) => {
          console.warn(info.leakWarning.stack.replace(/^Error: /, ''));
          releaseClassHandle(info.$$);
      });
      attachFinalizer = (handle) => {
        var $$ = handle.$$;
        var hasSmartPtr = !!$$.smartPtr;
        if (hasSmartPtr) {
          // We should not call the destructor on raw pointers in case other code expects the pointee to live
          var info = { $$: $$ };
          // Create a warning as an Error instance in advance so that we can store
          // the current stacktrace and point to it when / if a leak is detected.
          // This is more useful than the empty stacktrace of `FinalizationRegistry`
          // callback.
          var cls = $$.ptrType.registeredClass;
          info.leakWarning = new Error("Embind found a leaked C++ instance " + cls.name + " <0x" + $$.ptr.toString(16) + ">.\n" +
          "We'll free it automatically in this case, but this functionality is not reliable across various environments.\n" +
          "Make sure to invoke .delete() manually once you're done with the instance instead.\n" +
          "Originally allocated"); // `.stack` will add "at ..." after this sentence
          if ('captureStackTrace' in Error) {
              Error.captureStackTrace(info.leakWarning, RegisteredPointer_fromWireType);
          }
          finalizationRegistry.register(handle, info, handle);
        }
        return handle;
      };
      detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
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
  function RegisteredClass(name,
                               constructor,
                               instancePrototype,
                               rawDestructor,
                               baseClass,
                               getActualType,
                               upcast,
                               downcast) {
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
  /** @param {Object=} args */
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
        argCache.length = 0;
        Object.assign(argCache, arguments);
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
      if (typeof fp != "function") {
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
  function __embind_register_class(rawType,
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
                                     rawDestructor) {
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
  
          var registeredClass = new RegisteredClass(name,
                                                    constructor,
                                                    instancePrototype,
                                                    rawDestructor,
                                                    baseClass,
                                                    getActualType,
                                                    upcast,
                                                    downcast);
  
          var referenceConverter = new RegisteredPointer(name,
                                                         registeredClass,
                                                         true,
                                                         false,
                                                         false);
  
          var pointerConverter = new RegisteredPointer(name + '*',
                                                       registeredClass,
                                                       false,
                                                       false,
                                                       false);
  
          var constPointerConverter = new RegisteredPointer(name + ' const*',
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
        classType.registeredClass.constructor_body[argCount - 1] = () => {
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
       *   function dummy() {};
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even
       * though at creation, the 'dummy' has the correct constructor name.  Thus,
       * objects created with IMVU.new would show up in the debugger as 'dummy',
       * which isn't very helpful.  Using IMVU.createNamedFunction addresses the
       * issue.  Doublely-unfortunately, there's no way to write a test for this
       * behavior.  -NRD 2013.02.22
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
        invokerFnBody += "var destructors = [];\n";
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
  function __embind_register_class_function(rawClassType,
                                              methodName,
                                              argCount,
                                              rawArgTypesAddr, // [ReturnType, ThisType, Args...]
                                              invokerSignature,
                                              rawInvoker,
                                              context,
                                              isPureVirtual) {
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
          // This is the first overload to be registered, OR we are replacing a
          // function in the base class with a function in the derived class.
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          // There was an existing function with the same name registered. Set up
          // a function overload routing table.
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
  var Emval = {toValue:(handle) => {
        if (!handle) {
            throwBindingError('Cannot use deleted val. handle = ' + handle);
        }
        return emval_handle_array[handle].value;
      },toHandle:(value) => {
        switch (value) {
          case undefined: return 1;
          case null: return 2;
          case true: return 3;
          case false: return 4;
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
              if (typeof value != "number" && typeof value != "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              // The VM will perform JS to Wasm value conversion, according to the spec:
              // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
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
  
      var fromWireType = (value) => value;
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = (value) => (value << bitshift) >>> bitshift;
      }
  
      var isUnsignedType = (name.includes('unsigned'));
      var checkAssertions = (value, toTypeName) => {
          if (typeof value != "number" && typeof value != "boolean") {
              throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + toTypeName);
          }
          if (value < minRange || value > maxRange) {
              throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
          }
      }
      var toWireType;
      if (isUnsignedType) {
          toWireType = function(destructors, value) {
              checkAssertions(value, this.name);
              return value >>> 0;
          }
      } else {
          toWireType = function(destructors, value) {
              checkAssertions(value, this.name);
              // The VM will perform JS to Wasm value conversion, according to the spec:
              // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
              return value;
          }
      }
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': toWireType,
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
              var valueIsOfTypeString = (typeof value == 'string');
  
              if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                  throwBindingError('Cannot pass non-string to std::string');
              }
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = () => lengthBytesUTF8(value);
              } else {
                  getLength = () => value.length;
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
        getHeap = () => HEAPU16;
        shift = 1;
      } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        getHeap = () => HEAPU32;
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
          if (!(typeof value == 'string')) {
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

  function getHeapMax() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ' + HEAP8.length + ', (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0');
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
init_embind();;
init_RegisteredPointer();
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
var decodeBase64 = typeof atob == 'function' ? atob : function (input) {
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


function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var asmLibraryArg = {
  "__assert_fail": ___assert_fail,
  "__cxa_allocate_exception": ___cxa_allocate_exception,
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
var _free = Module["_free"] = createExportWrapper("free", asm);

/** @type {function(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = asm["emscripten_stack_init"]

/** @type {function(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = asm["emscripten_stack_get_free"]

/** @type {function(...*):?} */
var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = asm["emscripten_stack_get_base"]

/** @type {function(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = asm["emscripten_stack_get_end"]

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave", asm);

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore", asm);

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc", asm);

/** @type {function(...*):?} */
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = createExportWrapper("__cxa_is_pointer_type", asm);





// === Auto-generated postamble setup entry stuff ===

unexportedRuntimeFunction('ccall', false);
unexportedRuntimeFunction('cwrap', false);
unexportedRuntimeFunction('allocate', false);
unexportedRuntimeFunction('UTF8ArrayToString', false);
unexportedRuntimeFunction('UTF8ToString', false);
unexportedRuntimeFunction('stringToUTF8Array', false);
unexportedRuntimeFunction('stringToUTF8', false);
unexportedRuntimeFunction('lengthBytesUTF8', false);
unexportedRuntimeFunction('addOnPreRun', false);
unexportedRuntimeFunction('addOnInit', false);
unexportedRuntimeFunction('addOnPreMain', false);
unexportedRuntimeFunction('addOnExit', false);
unexportedRuntimeFunction('addOnPostRun', false);
unexportedRuntimeFunction('addRunDependency', true);
unexportedRuntimeFunction('removeRunDependency', true);
unexportedRuntimeFunction('FS_createFolder', false);
unexportedRuntimeFunction('FS_createPath', true);
unexportedRuntimeFunction('FS_createDataFile', true);
unexportedRuntimeFunction('FS_createPreloadedFile', true);
unexportedRuntimeFunction('FS_createLazyFile', true);
unexportedRuntimeFunction('FS_createLink', false);
unexportedRuntimeFunction('FS_createDevice', true);
unexportedRuntimeFunction('FS_unlink', true);
unexportedRuntimeFunction('getLEB', false);
unexportedRuntimeFunction('getFunctionTables', false);
unexportedRuntimeFunction('alignFunctionTables', false);
unexportedRuntimeFunction('registerFunctions', false);
unexportedRuntimeFunction('addFunction', false);
unexportedRuntimeFunction('removeFunction', false);
unexportedRuntimeFunction('prettyPrint', false);
unexportedRuntimeFunction('getCompilerSetting', false);
unexportedRuntimeFunction('print', false);
unexportedRuntimeFunction('printErr', false);
unexportedRuntimeFunction('getTempRet0', false);
unexportedRuntimeFunction('setTempRet0', false);
unexportedRuntimeFunction('callMain', false);
unexportedRuntimeFunction('abort', false);
unexportedRuntimeFunction('keepRuntimeAlive', false);
unexportedRuntimeFunction('wasmMemory', false);
unexportedRuntimeFunction('warnOnce', false);
unexportedRuntimeFunction('stackSave', false);
unexportedRuntimeFunction('stackRestore', false);
unexportedRuntimeFunction('stackAlloc', false);
unexportedRuntimeFunction('AsciiToString', false);
unexportedRuntimeFunction('stringToAscii', false);
unexportedRuntimeFunction('UTF16ToString', false);
unexportedRuntimeFunction('stringToUTF16', false);
unexportedRuntimeFunction('lengthBytesUTF16', false);
unexportedRuntimeFunction('UTF32ToString', false);
unexportedRuntimeFunction('stringToUTF32', false);
unexportedRuntimeFunction('lengthBytesUTF32', false);
unexportedRuntimeFunction('allocateUTF8', false);
unexportedRuntimeFunction('allocateUTF8OnStack', false);
unexportedRuntimeFunction('ExitStatus', false);
unexportedRuntimeFunction('intArrayFromString', false);
unexportedRuntimeFunction('intArrayToString', false);
unexportedRuntimeFunction('writeStringToMemory', false);
unexportedRuntimeFunction('writeArrayToMemory', false);
unexportedRuntimeFunction('writeAsciiToMemory', false);
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
unexportedRuntimeFunction('intArrayFromBase64', false);
unexportedRuntimeFunction('tryParseAsDataURI', false);
unexportedRuntimeFunction('ptrToString', false);
unexportedRuntimeFunction('zeroMemory', false);
unexportedRuntimeFunction('stringToNewUTF8', false);
unexportedRuntimeFunction('getHeapMax', false);
unexportedRuntimeFunction('abortOnCannotGrowMemory', false);
unexportedRuntimeFunction('emscripten_realloc_buffer', false);
unexportedRuntimeFunction('ENV', false);
unexportedRuntimeFunction('ERRNO_CODES', false);
unexportedRuntimeFunction('ERRNO_MESSAGES', false);
unexportedRuntimeFunction('setErrNo', false);
unexportedRuntimeFunction('inetPton4', false);
unexportedRuntimeFunction('inetNtop4', false);
unexportedRuntimeFunction('inetPton6', false);
unexportedRuntimeFunction('inetNtop6', false);
unexportedRuntimeFunction('readSockaddr', false);
unexportedRuntimeFunction('writeSockaddr', false);
unexportedRuntimeFunction('DNS', false);
unexportedRuntimeFunction('getHostByName', false);
unexportedRuntimeFunction('Protocols', false);
unexportedRuntimeFunction('Sockets', false);
unexportedRuntimeFunction('getRandomDevice', false);
unexportedRuntimeFunction('traverseStack', false);
unexportedRuntimeFunction('UNWIND_CACHE', false);
unexportedRuntimeFunction('convertPCtoSourceLocation', false);
unexportedRuntimeFunction('readAsmConstArgsArray', false);
unexportedRuntimeFunction('readAsmConstArgs', false);
unexportedRuntimeFunction('mainThreadEM_ASM', false);
unexportedRuntimeFunction('jstoi_q', false);
unexportedRuntimeFunction('jstoi_s', false);
unexportedRuntimeFunction('getExecutableName', false);
unexportedRuntimeFunction('listenOnce', false);
unexportedRuntimeFunction('autoResumeAudioContext', false);
unexportedRuntimeFunction('dynCallLegacy', false);
unexportedRuntimeFunction('getDynCaller', false);
unexportedRuntimeFunction('dynCall', false);
unexportedRuntimeFunction('handleException', false);
unexportedRuntimeFunction('runtimeKeepalivePush', false);
unexportedRuntimeFunction('runtimeKeepalivePop', false);
unexportedRuntimeFunction('callUserCallback', false);
unexportedRuntimeFunction('maybeExit', false);
unexportedRuntimeFunction('safeSetTimeout', false);
unexportedRuntimeFunction('asmjsMangle', false);
unexportedRuntimeFunction('asyncLoad', false);
unexportedRuntimeFunction('alignMemory', false);
unexportedRuntimeFunction('mmapAlloc', false);
unexportedRuntimeFunction('writeI53ToI64', false);
unexportedRuntimeFunction('writeI53ToI64Clamped', false);
unexportedRuntimeFunction('writeI53ToI64Signaling', false);
unexportedRuntimeFunction('writeI53ToU64Clamped', false);
unexportedRuntimeFunction('writeI53ToU64Signaling', false);
unexportedRuntimeFunction('readI53FromI64', false);
unexportedRuntimeFunction('readI53FromU64', false);
unexportedRuntimeFunction('convertI32PairToI53', false);
unexportedRuntimeFunction('convertI32PairToI53Checked', false);
unexportedRuntimeFunction('convertU32PairToI53', false);
unexportedRuntimeFunction('reallyNegative', false);
unexportedRuntimeFunction('unSign', false);
unexportedRuntimeFunction('strLen', false);
unexportedRuntimeFunction('reSign', false);
unexportedRuntimeFunction('formatString', false);
unexportedRuntimeFunction('setValue', false);
unexportedRuntimeFunction('getValue', false);
unexportedRuntimeFunction('PATH', false);
unexportedRuntimeFunction('PATH_FS', false);
unexportedRuntimeFunction('SYSCALLS', false);
unexportedRuntimeFunction('getSocketFromFD', false);
unexportedRuntimeFunction('getSocketAddress', false);
unexportedRuntimeFunction('JSEvents', false);
unexportedRuntimeFunction('registerKeyEventCallback', false);
unexportedRuntimeFunction('specialHTMLTargets', false);
unexportedRuntimeFunction('maybeCStringToJsString', false);
unexportedRuntimeFunction('findEventTarget', false);
unexportedRuntimeFunction('findCanvasEventTarget', false);
unexportedRuntimeFunction('getBoundingClientRect', false);
unexportedRuntimeFunction('fillMouseEventData', false);
unexportedRuntimeFunction('registerMouseEventCallback', false);
unexportedRuntimeFunction('registerWheelEventCallback', false);
unexportedRuntimeFunction('registerUiEventCallback', false);
unexportedRuntimeFunction('registerFocusEventCallback', false);
unexportedRuntimeFunction('fillDeviceOrientationEventData', false);
unexportedRuntimeFunction('registerDeviceOrientationEventCallback', false);
unexportedRuntimeFunction('fillDeviceMotionEventData', false);
unexportedRuntimeFunction('registerDeviceMotionEventCallback', false);
unexportedRuntimeFunction('screenOrientation', false);
unexportedRuntimeFunction('fillOrientationChangeEventData', false);
unexportedRuntimeFunction('registerOrientationChangeEventCallback', false);
unexportedRuntimeFunction('fillFullscreenChangeEventData', false);
unexportedRuntimeFunction('registerFullscreenChangeEventCallback', false);
unexportedRuntimeFunction('JSEvents_requestFullscreen', false);
unexportedRuntimeFunction('JSEvents_resizeCanvasForFullscreen', false);
unexportedRuntimeFunction('registerRestoreOldStyle', false);
unexportedRuntimeFunction('hideEverythingExceptGivenElement', false);
unexportedRuntimeFunction('restoreHiddenElements', false);
unexportedRuntimeFunction('setLetterbox', false);
unexportedRuntimeFunction('currentFullscreenStrategy', false);
unexportedRuntimeFunction('restoreOldWindowedStyle', false);
unexportedRuntimeFunction('softFullscreenResizeWebGLRenderTarget', false);
unexportedRuntimeFunction('doRequestFullscreen', false);
unexportedRuntimeFunction('fillPointerlockChangeEventData', false);
unexportedRuntimeFunction('registerPointerlockChangeEventCallback', false);
unexportedRuntimeFunction('registerPointerlockErrorEventCallback', false);
unexportedRuntimeFunction('requestPointerLock', false);
unexportedRuntimeFunction('fillVisibilityChangeEventData', false);
unexportedRuntimeFunction('registerVisibilityChangeEventCallback', false);
unexportedRuntimeFunction('registerTouchEventCallback', false);
unexportedRuntimeFunction('fillGamepadEventData', false);
unexportedRuntimeFunction('registerGamepadEventCallback', false);
unexportedRuntimeFunction('registerBeforeUnloadEventCallback', false);
unexportedRuntimeFunction('fillBatteryEventData', false);
unexportedRuntimeFunction('battery', false);
unexportedRuntimeFunction('registerBatteryEventCallback', false);
unexportedRuntimeFunction('setCanvasElementSize', false);
unexportedRuntimeFunction('getCanvasElementSize', false);
unexportedRuntimeFunction('demangle', false);
unexportedRuntimeFunction('demangleAll', false);
unexportedRuntimeFunction('jsStackTrace', false);
unexportedRuntimeFunction('stackTrace', false);
unexportedRuntimeFunction('getEnvStrings', false);
unexportedRuntimeFunction('checkWasiClock', false);
unexportedRuntimeFunction('flush_NO_FILESYSTEM', false);
unexportedRuntimeFunction('dlopenMissingError', false);
unexportedRuntimeFunction('setImmediateWrapped', false);
unexportedRuntimeFunction('clearImmediateWrapped', false);
unexportedRuntimeFunction('polyfillSetImmediate', false);
unexportedRuntimeFunction('uncaughtExceptionCount', false);
unexportedRuntimeFunction('exceptionLast', false);
unexportedRuntimeFunction('exceptionCaught', false);
unexportedRuntimeFunction('ExceptionInfo', false);
unexportedRuntimeFunction('exception_addRef', false);
unexportedRuntimeFunction('exception_decRef', false);
unexportedRuntimeFunction('Browser', false);
unexportedRuntimeFunction('setMainLoop', false);
unexportedRuntimeFunction('wget', false);
unexportedRuntimeFunction('FS', false);
unexportedRuntimeFunction('MEMFS', false);
unexportedRuntimeFunction('TTY', false);
unexportedRuntimeFunction('PIPEFS', false);
unexportedRuntimeFunction('SOCKFS', false);
unexportedRuntimeFunction('_setNetworkCallback', false);
unexportedRuntimeFunction('tempFixedLengthArray', false);
unexportedRuntimeFunction('miniTempWebGLFloatBuffers', false);
unexportedRuntimeFunction('heapObjectForWebGLType', false);
unexportedRuntimeFunction('heapAccessShiftForWebGLHeap', false);
unexportedRuntimeFunction('GL', false);
unexportedRuntimeFunction('emscriptenWebGLGet', false);
unexportedRuntimeFunction('computeUnpackAlignedImageSize', false);
unexportedRuntimeFunction('emscriptenWebGLGetTexPixelData', false);
unexportedRuntimeFunction('emscriptenWebGLGetUniform', false);
unexportedRuntimeFunction('webglGetUniformLocation', false);
unexportedRuntimeFunction('webglPrepareUniformLocationsBeforeFirstUse', false);
unexportedRuntimeFunction('webglGetLeftBracePos', false);
unexportedRuntimeFunction('emscriptenWebGLGetVertexAttrib', false);
unexportedRuntimeFunction('writeGLArray', false);
unexportedRuntimeFunction('AL', false);
unexportedRuntimeFunction('SDL_unicode', false);
unexportedRuntimeFunction('SDL_ttfContext', false);
unexportedRuntimeFunction('SDL_audio', false);
unexportedRuntimeFunction('SDL', false);
unexportedRuntimeFunction('SDL_gfx', false);
unexportedRuntimeFunction('GLUT', false);
unexportedRuntimeFunction('EGL', false);
unexportedRuntimeFunction('GLFW_Window', false);
unexportedRuntimeFunction('GLFW', false);
unexportedRuntimeFunction('GLEW', false);
unexportedRuntimeFunction('IDBStore', false);
unexportedRuntimeFunction('runAndAbortIfError', false);
unexportedRuntimeFunction('InternalError', false);
unexportedRuntimeFunction('BindingError', false);
unexportedRuntimeFunction('UnboundTypeError', false);
unexportedRuntimeFunction('PureVirtualError', false);
unexportedRuntimeFunction('init_embind', false);
unexportedRuntimeFunction('throwInternalError', false);
unexportedRuntimeFunction('throwBindingError', false);
unexportedRuntimeFunction('throwUnboundTypeError', false);
unexportedRuntimeFunction('ensureOverloadTable', false);
unexportedRuntimeFunction('exposePublicSymbol', false);
unexportedRuntimeFunction('replacePublicSymbol', false);
unexportedRuntimeFunction('extendError', false);
unexportedRuntimeFunction('createNamedFunction', false);
unexportedRuntimeFunction('registeredInstances', false);
unexportedRuntimeFunction('getBasestPointer', false);
unexportedRuntimeFunction('registerInheritedInstance', false);
unexportedRuntimeFunction('unregisterInheritedInstance', false);
unexportedRuntimeFunction('getInheritedInstance', false);
unexportedRuntimeFunction('getInheritedInstanceCount', false);
unexportedRuntimeFunction('getLiveInheritedInstances', false);
unexportedRuntimeFunction('registeredTypes', false);
unexportedRuntimeFunction('awaitingDependencies', false);
unexportedRuntimeFunction('typeDependencies', false);
unexportedRuntimeFunction('registeredPointers', false);
unexportedRuntimeFunction('registerType', false);
unexportedRuntimeFunction('whenDependentTypesAreResolved', false);
unexportedRuntimeFunction('embind_charCodes', false);
unexportedRuntimeFunction('embind_init_charCodes', false);
unexportedRuntimeFunction('readLatin1String', false);
unexportedRuntimeFunction('getTypeName', false);
unexportedRuntimeFunction('heap32VectorToArray', false);
unexportedRuntimeFunction('requireRegisteredType', false);
unexportedRuntimeFunction('getShiftFromSize', false);
unexportedRuntimeFunction('integerReadValueFromPointer', false);
unexportedRuntimeFunction('enumReadValueFromPointer', false);
unexportedRuntimeFunction('floatReadValueFromPointer', false);
unexportedRuntimeFunction('simpleReadValueFromPointer', false);
unexportedRuntimeFunction('runDestructors', false);
unexportedRuntimeFunction('new_', false);
unexportedRuntimeFunction('craftInvokerFunction', false);
unexportedRuntimeFunction('embind__requireFunction', false);
unexportedRuntimeFunction('tupleRegistrations', false);
unexportedRuntimeFunction('structRegistrations', false);
unexportedRuntimeFunction('genericPointerToWireType', false);
unexportedRuntimeFunction('constNoSmartPtrRawPointerToWireType', false);
unexportedRuntimeFunction('nonConstNoSmartPtrRawPointerToWireType', false);
unexportedRuntimeFunction('init_RegisteredPointer', false);
unexportedRuntimeFunction('RegisteredPointer', false);
unexportedRuntimeFunction('RegisteredPointer_getPointee', false);
unexportedRuntimeFunction('RegisteredPointer_destructor', false);
unexportedRuntimeFunction('RegisteredPointer_deleteObject', false);
unexportedRuntimeFunction('RegisteredPointer_fromWireType', false);
unexportedRuntimeFunction('runDestructor', false);
unexportedRuntimeFunction('releaseClassHandle', false);
unexportedRuntimeFunction('finalizationRegistry', false);
unexportedRuntimeFunction('detachFinalizer_deps', false);
unexportedRuntimeFunction('detachFinalizer', false);
unexportedRuntimeFunction('attachFinalizer', false);
unexportedRuntimeFunction('makeClassHandle', false);
unexportedRuntimeFunction('init_ClassHandle', false);
unexportedRuntimeFunction('ClassHandle', false);
unexportedRuntimeFunction('ClassHandle_isAliasOf', false);
unexportedRuntimeFunction('throwInstanceAlreadyDeleted', false);
unexportedRuntimeFunction('ClassHandle_clone', false);
unexportedRuntimeFunction('ClassHandle_delete', false);
unexportedRuntimeFunction('deletionQueue', false);
unexportedRuntimeFunction('ClassHandle_isDeleted', false);
unexportedRuntimeFunction('ClassHandle_deleteLater', false);
unexportedRuntimeFunction('flushPendingDeletes', false);
unexportedRuntimeFunction('delayFunction', false);
unexportedRuntimeFunction('setDelayFunction', false);
unexportedRuntimeFunction('RegisteredClass', false);
unexportedRuntimeFunction('shallowCopyInternalPointer', false);
unexportedRuntimeFunction('downcastPointer', false);
unexportedRuntimeFunction('upcastPointer', false);
unexportedRuntimeFunction('validateThis', false);
unexportedRuntimeFunction('char_0', false);
unexportedRuntimeFunction('char_9', false);
unexportedRuntimeFunction('makeLegalFunctionName', false);
unexportedRuntimeFunction('emval_handle_array', false);
unexportedRuntimeFunction('emval_free_list', false);
unexportedRuntimeFunction('emval_symbols', false);
unexportedRuntimeFunction('init_emval', false);
unexportedRuntimeFunction('count_emval_handles', false);
unexportedRuntimeFunction('get_first_emval', false);
unexportedRuntimeFunction('getStringOrSymbol', false);
unexportedRuntimeFunction('Emval', false);
unexportedRuntimeFunction('emval_newers', false);
unexportedRuntimeFunction('craftEmvalAllocator', false);
unexportedRuntimeFunction('emval_get_global', false);
unexportedRuntimeFunction('emval_methodCallers', false);
unexportedRuntimeFunction('emval_registeredMethods', false);
unexportedRuntimeSymbol('ALLOC_NORMAL', false);
unexportedRuntimeSymbol('ALLOC_STACK', false);

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
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
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
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

/** @param {boolean|number=} implicit */
function exit(status, implicit) {
  EXITSTATUS = status;

  checkUnflushedContent();

  // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
  if (keepRuntimeAlive() && !implicit) {
    var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
    err(msg);
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
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// EXPORT_ES6 option does not work as described at
// https://github.com/kripken/emscripten/issues/6284, so we have to
// manually add this by '--post-js' setting when the Emscripten compilation.
export default Module;
