// include: shell.js
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
    readBinary;

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = read;
  }

  readBinary = (f) => {
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    let data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = (f, onload, onerror) => {
    setTimeout(() => onload(readBinary(f)));
  };

  if (typeof clearTimeout == 'undefined') {
    globalThis.clearTimeout = (id) => {};
  }

  if (typeof setTimeout == 'undefined') {
    // spidermonkey lacks setTimeout but we use it above in readAsync.
    globalThis.setTimeout = (f) => (typeof f == 'function') ? f() : abort();
  }

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      // Unlike node which has process.exitCode, d8 has no such mechanism. So we
      // have no way to set the exit code and then let the program exit with
      // that code when it naturally stops running (say, when all setTimeouts
      // have completed). For that reason, we must call `quit` - the only way to
      // set the exit code - but quit also halts immediately.  To increase
      // consistency with node (and the web) we schedule the actual quit call
      // using a setTimeout to give the current stack and any exception handlers
      // a chance to run.  This enables features such as addOnPostRun (which
      // expected to be able to run code after main returns).
      setTimeout(() => {
        if (!(toThrow instanceof ExitStatus)) {
          let toLog = toThrow;
          if (toThrow && typeof toThrow == 'object' && toThrow.stack) {
            toLog = [toThrow, toThrow.stack];
          }
          err(`exiting due to exception: ${toLog}`);
        }
        quit(status);
      });
      throw toThrow;
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
var err = Module['printErr'] || console.error.bind(console);

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
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('asm', 'wasmExports');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add 'web' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add 'worker' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-sENVIRONMENT` to enable.");


// end include: shell.js
// include: preamble.js
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

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

// include: base64Utils.js
// include: polyfill/atob.js
// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

if (typeof atob == 'undefined') {
  if (typeof global != 'undefined' && typeof globalThis == 'undefined') {
    globalThis = global;
  }

  /**
   * Decodes a base64 string.
   * @param {string} input The string to decode.
   */
  globalThis.atob = function(input) {
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
}
// end include: polyfill/atob.js
// Converts a string of base64 into a byte array (Uint8Array).
function intArrayFromBase64(s) {

  var decoded = atob(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0 ; i < decoded.length ; ++i) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
// end include: base64Utils.js
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

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// Memory management

var HEAP,
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

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
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
      runDependencyWatcher = setInterval(() => {
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
          err(`dependency: ${dep}`);
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
  if (Module['onAbort']) {
    Module['onAbort'](what);
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

// include: memoryprofiler.js
// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
var FS = {
  error() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init() { FS.error() },
  createDataFile() { FS.error() },
  createPreloadedFile() { FS.error() },
  createLazyFile() { FS.error() },
  open() { FS.error() },
  mkdev() { FS.error() },
  registerDevice() { FS.error() },
  analyzePath() { FS.error() },

  ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');
// end include: URIUtils.js
function createExportWrapper(name) {
  return function() {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    return f.apply(null, arguments);
  };
}

// include: runtime_exceptions.js
// end include: runtime_exceptions.js
var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB1gIzYAF/AX9gAX8AYAJ/fwF/YAABf2ADf39/AX9gAn9/AGADf39/AGAAAGAEf39/fwBgBX9/f39/AGAGf39/f39/AGACf30AYAR/f39/AX9gAX0BfWABfAF8YAN/fX0BfWADf35/AX5gAn99AX1gAX8BfGAFf39/f38Bf2ADf319AGABfgF/YAF/AX1gBH9+fn8AYAZ/fH9/f38Bf2ACfn8Bf2ANf39/f39/f39/f39/fwBgCX9/f39/f39/fwBgA39/fQBgBH99f38AYAV/f399fQBgAn19AXxgAAF8YAJ/fAF8YAJ8fAF8YAF8AX9gAn5/AXxgA3x8fwF8YAN8fn4BfGABfABgAn19AX1gAnx/AX1gAnx/AXxgAn5+AXxgB39/f39/f38Bf2ADfn9/AX9gAXwBfmAEf39+fwF+YAV/f39+fgBgB39/f39/f38AYAR/fn9/AX8C0wQUA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzABoDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IACgNlbnYNX19hc3NlcnRfZmFpbAAIA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uABsDZW52C19fY3hhX3Rocm93AAYDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAAFA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wACANlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAAkDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQABgNlbnYbX2VtYmluZF9yZWdpc3Rlcl9zdGRfc3RyaW5nAAUDZW52HF9lbWJpbmRfcmVnaXN0ZXJfc3RkX3dzdHJpbmcABgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9lbXZhbAAFA2VudhxfZW1iaW5kX3JlZ2lzdGVyX21lbW9yeV92aWV3AAYDZW52FGVtc2NyaXB0ZW5fbWVtY3B5X2pzAAYDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAANlbnYFYWJvcnQABxZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX2Nsb3NlAAAWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF93cml0ZQAMA2VudhdfZW1iaW5k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AQF/IABBACABEIsDIgIgAGsgASACGwsEAEEqCwUAEI0DCwYAQcTeBAsXAEEAQazeBDYCpN8EQQAQjgM2AtzeBAujAgEBf0EBIQMCQAJAIABFDQAgAUH/AE0NAQJAAkAQjwMoAmAoAgANACABQYB/cUGAvwNGDQMQ5AJBGTYCAAwBCwJAIAFB/w9LDQAgACABQT9xQYABcjoAASAAIAFBBnZBwAFyOgAAQQIPCwJAAkAgAUGAsANJDQAgAUGAQHFBgMADRw0BCyAAIAFBP3FBgAFyOgACIAAgAUEMdkHgAXI6AAAgACABQQZ2QT9xQYABcjoAAUEDDwsCQCABQYCAfGpB//8/Sw0AIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEOQCQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABCRAwuPAQIBfgF/AkAgAL0iAkI0iKdB/w9xIgNB/w9GDQACQCADDQACQAJAIABEAAAAAAAAAABiDQBBACEDDAELIABEAAAAAAAA8EOiIAEQkwMhACABKAIAQUBqIQMLIAEgAzYCACAADwsgASADQYJ4ajYCACACQv////////+HgH+DQoCAgICAgIDwP4S/IQALIAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgLUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgL5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAg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CyAAQSAgFSAOIBNBgMAAcxCfAyAVIA4gFSAOShshDgwJCyAXIBZBAEhxDQpBPSEYIAAgBysDQCAVIBYgEyAOIAURGAAiDkEATg0IDAsLIAcgBykDQDwAN0EBIRYgCiEPIAshGyAZIRMMBQsgDi0AASEQIA5BAWohDgwACwALIA0hGCAADQggDEUNA0EBIQ4CQANAIAQgDkECdGooAgAiEEUNASADIA5BA3RqIBAgAiAGEJsDQQEhGCAOQQFqIg5BCkcNAAwKCwALQQEhGCAOQQpPDQgDQCAEIA5BAnRqKAIADQFBASEYIA5BAWoiDkEKRg0JDAALAAtBHCEYDAYLIAshGwsgFiAbIA9rIgEgFiABShsiFCASQf////8Hc0oNA0E9IRggFSASIBRqIhEgFSARShsiDiAQSg0EIABBICAOIBEgExCfAyAAIBogEhCZAyAAQTAgDiARIBNBgIAEcxCfAyAAQTAgFCABQQAQnwMgACAPIAEQmQMgAEEgIA4gESATQYDAAHMQnwMgBygCTCEBDAELCwtBACEYDAILQT0hGAsQ5AIgGDYCAEF/IRgLIAdB0ABqJAAgGAsZAAJAIAAtAABBIHENACABIAIgABCIAxoLC3QBA39BACEBAkAgACgCACwAABCKAw0AQQAPCwNAIAAoAgAhAkF/IQMCQCABQcyZs+YASw0AQX8gAiwAAEFQaiIDIAFBCmwiAWogAyABQf////8Hc0obIQMLIAAgAkEBajYCACADIQEgAiwAARCKAw0ACyADC7YEAAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAFBd2oOEgABAgUDBAYHCAkKCwwNDg8QERILIAIgAigCACIBQQRqNgIAIAAgASgCADYCAA8LIAIgAigCACIBQQRqNgIAIAAgATQCADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATUCADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATQCADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATUCADcDAA8LIAIgAigCAEEHakF4cSIBQQhqNgIAIAAgASkDADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATIBADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATMBADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATAAADcD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IQILIAILnwEAIAFBAToANQJAIAEoAgQgA0cNACABQQE6ADQCQAJAIAEoAhAiAw0AIAFBATYCJCABIAQ2AhggASACNgIQIARBAUcNAiABKAIwQQFGDQEMAgsCQCADIAJHDQACQCABKAIYIgNBAkcNACABIAQ2AhggBCEDCyABKAIwQQFHDQIgA0EBRg0BDAILIAEgASgCJEEBajYCJAsgAUEBOgA2CwsgAAJAIAEoAgQgAkcNACABKAIcQQFGDQAgASADNgIcCwuCAgACQCAAIAEoAgggBBC5A0UNACABIAEgAiADEMUDDwsCQAJAIAAgASgCACAEELkDRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQIgAUEBNgIgDwsgASADNgIgAkAgASgCLEEERg0AIAFBADsBNCAAKAIIIgAgASACIAJBASAEIAAoAgAoAhQRCgACQCABLQA1RQ0AIAFBAzYCLCABLQA0RQ0BDAMLIAFBBDYCLAsgASACNgIUIAEgASgCKEEBajYCKCABKAIkQQFHDQEgASgCGEECRw0BIAFBAToANg8LIAAoAggiACABIAIgAyAEIAAoAgAoAhgRCQALC5sBAAJAIAAgASgCCCAEELkDRQ0AIAEgASACIAMQxQMPCwJAIAAgASgCACAEELkDRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQEgAUEBNgIgDwsgASACNgIUIAEgAzYCICABIAEoAihBAWo2AigCQCABKAIkQQFHDQAgASgCGEECRw0AIAFBAToANgsgAUEENgIsCws+AAJAIAAgASgCCCAFELkDRQ0AIAEgASACIAMgBBDEAw8LIAAoAggiACABIAIgAyAEIAUgACgCACgCFBEKAAshAAJAIAAgASgCCCAFELkDRQ0AIAEgASACIAMgBBDEAwsLHgACQCAADQBBAA8LIABB5NAEQfTRBEEAELwDQQBHCwQAIAALDQAgABDLAxogABDvAgsGAEHwgAQLFQAgABD1AiIAQaDWBEEIajYCACAACw0AIAAQywMaIAAQ7wILBgBBy4IECxUAIAAQzgMiAEG01gRBCGo2AgAgAAsNACAAEMsDGiAAEO8CCwYAQZ+BBAscACAAQbjXBEEIajYCACAAQQRqENUDGiAAEMsDCysBAX8CQCAAEPkCRQ0AIAAoAgAQ1gMiAUEIahDXA0F/Sg0AIAEQ7wILIAALBwAgAEF0agsVAQF/IAAgACgCAEF/aiIBNgIAIAELDQAgABDUAxogABDvAgsKACAAQQRqENoDCwcAIAAoAgALDQAgABDUAxogABDvAgsEACAACwYAIAAkAQsEACMBCxIAQYCABCQDQQBBD2pBcHEkAgsHACMAIwJrCwQAIwMLBAAjAgvDAgEDfwJAIAANAEEAIQECQEEAKAKI3gRFDQBBACgCiN4EEOMDIQELAkBBACgC4NkERQ0AQQAoAuDZBBDjAyABciEBCwJAEIMDKAIAIgBFDQADQEEAIQICQCAAKAJMQQBIDQAgABCFAyECCwJAIAAoAhQgACgCHEYNACAAEOMDIAFyIQELAkAgAkUNACAAEIYDCyAAKAI4IgANAAsLEIQDIAEPCwJAAkAgACgCTEEATg0AQQEhAgwBCyAAEIUDRSECCwJAAkACQCAAKAIUIAAoAhxGDQAgAEEAQQAgACgCJBEEABogACgCFA0AQX8hASACRQ0BDAILAkAgACgCBCIBIAAoAggiA0YNACAAIAEgA2usQQEgACgCKBEQABoLQQAhASAAQQA2AhwgAEIANwMQIABCADcCBCACDQELIAAQhgMLIAELBAAjAAsGACAAJAALEgECfyMAIABrQXBxIgEkACABCwQAIwALDQAgASACIAMgABEQAAslAQF+IAAgASACrSADrUIghoQgBBDoAyEFIAVCIIinEN0DIAWnCxwAIAAgASACIAOnIANCIIinIASnIARCIIinEBILEwAgACABpyABQiCIpyACIAMQEwsL8VkCAEGAgAQLtFgtKyAgIDBYMHgALTBYKzBYIDBYLTB4KzB4IDB4AHVuc2lnbmVkIHNob3J0AHVuc2lnbmVkIGludABmbG9hdAB1aW50NjRfdAB2ZWN0b3IAU3ludGhlc2l6ZXIAcmVuZGVyAHVuc2lnbmVkIGNoYXIAc3RkOjpleGNlcHRpb24AbmFuAG5vdGVPbgBib29sAGVtc2NyaXB0ZW46OnZhbABiYWRfYXJyYXlfbmV3X2xlbmd0aAAuL3N5bnRoX3NyYy9Vbml0R2VuZXJhdG9yLmgAdW5zaWduZWQgbG9uZwBzdGQ6OndzdHJpbmcAc3RkOjpzdHJpbmcAc3RkOjp1MTZzdHJpbmcAc3RkOjp1MzJzdHJpbmcAaW5mAG5vdGVPZmYAc2V0U2FtcGxlUmF0ZQBTeW50aGVzaXplckJhc2UAZG91YmxlAHZvaWQAc3RkOjpiYWRfYWxsb2MATkFOAElORgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBzYW1wbGVSYXRlID4gMAAuAChudWxsKQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBsaWJjKythYmk6IAAxMVN5bnRoZXNpemVyAAAAAIgqAQBHBAEAUDExU3ludGhlc2l6ZXIAAAwrAQBgBAEAAAAAAFgEAQBQSzExU3ludGhlc2l6ZXIADCsBAIAEAQABAAAAWAQBAGlpAHYAdmkAcAQBACQqAQBpaWkAAAAAAFgEAQATAAAAFAAAAAAAAABQBQEAFQAAABYAAAAXAAAAeAtkP+AtcD9fKXs/AACAP3icgj83Gog/HcmNP1OWoT0Zc9c9U5YhPm6joT5TliE+GXPXPUuroT0xMVNpbXBsZVZvaWNlADlWb2ljZUJhc2UAMTNVbml0R2VuZXJhdG9yAAAAAIgqAQApBQEAsCoBAB4FAQA8BQEAsCoBABAFAQBEBQEAAAAAAEQFAQAYAAAAGQAAABoAAAAAAAAAPAUBABsAAAAcAAAAAAAAAKAFAQAdAAAAHgAAADEyQmlxdWFkRmlsdGVyAACwKgEAkAUBADwFAQAAAAAAzAUBAB8AAAAgAAAAMTJFbnZlbG9wZUFEU1IAALAqAQC8BQEAPAUBAAAAAAAoBgEAIQAAACIAAAAjAAAAMjFTYXd0b290aE9zY2lsbGF0b3JEUFcAMThTYXd0b290aE9zY2lsbGF0b3IAAAAAsCoBAAQGAQA8BQEAsCoBAOwFAQAcBgEAAAAAABwGAQAkAAAAJQAAACYAAAAAAAAAdAYBACcAAAAoAAAAMjJEaWZmZXJlbnRpYXRlZFBhcmFib2xhAAAAAIgqAQBYBgEAxCkBAHAEAQD0KQEAdmlpaQAxOFN5bnRoZXNpemVyV3JhcHBlcgAAALAqAQCNBgEAWAQBAFAxOFN5bnRoZXNpemVyV3JhcHBlcgAAAAwrAQCwBgEAAAAAAKQGAQBQSzE4U3ludGhlc2l6ZXJXcmFwcGVyAAAMKwEA2AYBAAEAAACkBgEAyAYBACQqAQAAAAAApAYBACkAAAAqAAAAAAAAAAAAAADEKQEAyAYBAEgqAQAkKgEAdmlpaWkAAAAAAAAAdAcBACwAAAAtAAAALgAAADE1UG93ZXJPZlR3b1RhYmxlADExTG9va3VwVGFibGUAiCoBAF4HAQCwKgEATAcBAGwHAQAAAAAAbAcBAC8AAAAwAAAAGgAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAACIKgEAlAcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAACIKgEA3AcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAACIKgEAJAgBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAiCoBAGwIAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRGlOU18xMWNoYXJfdHJhaXRzSURpRUVOU185YWxsb2NhdG9ySURpRUVFRQAAAIgqAQC4CAEATjEwZW1zY3JpcHRlbjN2YWxFAACIKgEABAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAAiCoBACAJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAIgqAQBICQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAACIKgEAcAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAAiCoBAJgJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAIgqAQDACQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAACIKgEA6AkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQAAiCoBABAKAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUAAIgqAQA4CgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbUVFAACIKgEAYAoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXhFRQAAiCoBAIgKAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l5RUUAAIgqAQCwCgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAACIKgEA2AoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWRFRQAAiCoBAAALAQD+gitlRxVnQAAAAAAAADhDAAD6/kIudr86O568mvcMvb39/////98/PFRVVVVVxT+RKxfPVVWlPxfQpGcREYE/AAAAAAAAyELvOfr+Qi7mPyTEgv+9v84/tfQM1whrrD/MUEbSq7KDP4Q6Tpvg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';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  var binary = tryParseAsDataURI(file);
  if (binary) {
    return binary;
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
}

function getBinaryPromise(binaryFile) {

  // Otherwise, getBinarySync should be able to get it synchronously
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateSync(file, info) {
  var module;
  var binary = getBinarySync(file);
  module = new WebAssembly.Module(binary);
  var instance = new WebAssembly.Instance(module, info);
  return [instance, module];
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateMemoryViews();

    wasmTable = wasmExports['__indirect_function_table'];
    
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {

    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
        return false;
    }
  }

  var result = instantiateSync(wasmBinaryFile, info);
  // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
  // the above line no longer optimizes out down to the following line.
  // When the regression is fixed, we can remove this if/else.
  return receiveInstance(result[0]);
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// include: runtime_debug.js
function legacyModuleProp(prop, newName, incomming=true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incomming ? ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)' : '';
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);

      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingGlobal(sym, msg) {
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        warnOnce('`' + sym + '` is not longer defined by emscripten. ' + msg);
        return undefined;
      }
    });
  }
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  if (typeof globalThis !== 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = '`' + sym + '` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line';
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
        var librarySymbol = sym;
        if (!librarySymbol.startsWith('_')) {
          librarySymbol = '$' + sym;
        }
        msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='" + librarySymbol + "')";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
  // Any symbol that is not included from the JS libary is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(text) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn.apply(console, arguments);
}
// end include: runtime_debug.js
// === Body ===

// end include: preamble.js

  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = Module['noExitRuntime'] || true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[((ptr)>>0)] = value; break;
      case 'i8': HEAP8[((ptr)>>0)] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var warnOnce = (text) => {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
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
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      assert(typeof ptr == 'number');
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  var ___assert_fail = (condition, filename, line, func) => {
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
    };

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
  
      this.set_caught = function(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(((this.ptr)+(12))>>0)] = caught;
      };
  
      this.get_caught = function() {
        return HEAP8[(((this.ptr)+(12))>>0)] != 0;
      };
  
      this.set_rethrown = function(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(((this.ptr)+(13))>>0)] = rethrown;
      };
  
      this.get_rethrown = function() {
        return HEAP8[(((this.ptr)+(13))>>0)] != 0;
      };
  
      // Initialize native structure fields. Should be called once after allocated.
      this.init = function(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
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
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };

  var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};

  var embind_init_charCodes = () => {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    };
  var embind_charCodes;
  var readLatin1String = (ptr) => {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    };
  
  var awaitingDependencies = {
  };
  
  var registeredTypes = {
  };
  
  var typeDependencies = {
  };
  
  var BindingError;
  var throwBindingError = (message) => { throw new BindingError(message); };
  
  
  
  
  var InternalError;
  var throwInternalError = (message) => { throw new InternalError(message); };
  var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
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
    };
  /** @param {Object=} options */
  function sharedRegisterType(rawType, registeredInstance, options = {}) {
      var name = registeredInstance.name;
      if (!rawType) {
        throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return;
        } else {
          throwBindingError(`Cannot register type '${name}' twice`);
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
  /** @param {Object=} options */
  function registerType(rawType, registeredInstance, options = {}) {
      if (!('argPackAdvance' in registeredInstance)) {
        throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
      return sharedRegisterType(rawType, registeredInstance, options);
    }
  
  var GenericWireTypeSize = 8;
  /** @suppress {globalThis} */
  var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
      name = readLatin1String(name);
      registerType(rawType, {
          name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': GenericWireTypeSize,
          'readValueFromPointer': function(pointer) {
              return this['fromWireType'](HEAPU8[pointer]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    };

  
  
  var shallowCopyInternalPointer = (o) => {
      return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType,
      };
    };
  
  var throwInstanceAlreadyDeleted = (obj) => {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    };
  
  var finalizationRegistry = false;
  
  var detachFinalizer = (handle) => {};
  
  var runDestructor = ($$) => {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    };
  var releaseClassHandle = ($$) => {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
        runDestructor($$);
      }
    };
  
  var downcastPointer = (ptr, ptrClass, desiredClass) => {
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
    };
  
  var registeredPointers = {
  };
  
  var getInheritedInstanceCount = () => Object.keys(registeredInstances).length;
  
  var getLiveInheritedInstances = () => {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    };
  
  var deletionQueue = [];
  var flushPendingDeletes = () => {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
      }
    };
  
  var delayFunction;
  
  
  var setDelayFunction = (fn) => {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    };
  var init_embind = () => {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    };
  var registeredInstances = {
  };
  
  var getBasestPointer = (class_, ptr) => {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    };
  var getInheritedInstance = (class_, ptr) => {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    };
  
  
  var makeClassHandle = (prototype, record) => {
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
    };
  /** @suppress {globalThis} */
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
            ptr,
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
  var attachFinalizer = (handle) => {
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
          info.leakWarning = new Error(`Embind found a leaked C++ instance ${cls.name} <${ptrToString($$.ptr)}>.\n` +
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
    };
  
  
  
  var init_ClassHandle = () => {
      Object.assign(ClassHandle.prototype, {
        "isAliasOf"(other) {
          if (!(this instanceof ClassHandle)) {
            return false;
          }
          if (!(other instanceof ClassHandle)) {
            return false;
          }
  
          var leftClass = this.$$.ptrType.registeredClass;
          var left = this.$$.ptr;
          other.$$ = /** @type {Object} */ (other.$$);
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
        },
  
        "clone"() {
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
        },
  
        "delete"() {
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
        },
  
        "isDeleted"() {
          return !this.$$.ptr;
        },
  
        "deleteLater"() {
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
        },
      });
    };
  /** @constructor */
  function ClassHandle() {
    }
  
  var createNamedFunction = (name, body) => Object.defineProperty(body, 'name', {
      value: name
    });
  
  
  var ensureOverloadTable = (proto, methodName, humanName) => {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
        proto[methodName] = function() {
          // TODO This check can be removed in -O3 level "unsafe" optimizations.
          if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
              throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${arguments.length}) - expects one of (${proto[methodName].overloadTable})!`);
          }
          return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        // Move the previous function into the overload table.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    };
  
  /** @param {number=} numArguments */
  var exposePublicSymbol = (name, value, numArguments) => {
      if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
          throwBindingError(`Cannot register public name '${name}' twice`);
        }
  
        // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
        // that routes between the two.
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
          throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
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
    };
  
  var char_0 = 48;
  
  var char_9 = 57;
  var makeLegalFunctionName = (name) => {
      if (undefined === name) {
        return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return `_${name}`;
      }
      return name;
    };
  
  
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
  
  
  var upcastPointer = (ptr, ptrClass, desiredClass) => {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    };
  /** @suppress {globalThis} */
  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
      }
  
      if (!handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
      }
      if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  /** @suppress {globalThis} */
  function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
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
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
      }
      if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError(`Cannot convert argument of type ${(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name)} to parameter type ${this.name}`);
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
              throwBindingError(`Cannot convert argument of type ${(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name)} to parameter type ${this.name}`);
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
                Emval.toHandle(() => clonedHandle['delete']())
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
  
  
  /** @suppress {globalThis} */
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
      }
  
      if (!handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
      }
      if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
      }
      if (handle.$$.ptrType.isConst) {
          throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  /** @suppress {globalThis} */
  function readPointer(pointer) {
      return this['fromWireType'](HEAPU32[((pointer)>>2)]);
    }
  
  
  var init_RegisteredPointer = () => {
      Object.assign(RegisteredPointer.prototype, {
        getPointee(ptr) {
          if (this.rawGetPointee) {
            ptr = this.rawGetPointee(ptr);
          }
          return ptr;
        },
        destructor(ptr) {
          if (this.rawDestructor) {
            this.rawDestructor(ptr);
          }
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': readPointer,
        'deleteObject'(handle) {
          if (handle !== null) {
            handle['delete']();
          }
        },
        'fromWireType': RegisteredPointer_fromWireType,
      });
    };
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
  var replacePublicSymbol = (name, value, numArguments) => {
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
    };
  
  
  
  var dynCallLegacy = (sig, ptr, args) => {
      assert(('dynCall_' + sig) in Module, `bad function pointer type - dynCall function not found for sig '${sig}'`);
      if (args && args.length) {
        // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
      } else {
        assert(sig.length == 1);
      }
      var f = Module['dynCall_' + sig];
      return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
    };
  
  var wasmTableMirror = [];
  
  var wasmTable;
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
      return func;
    };
  
  /** @param {Object=} args */
  var dynCall = (sig, ptr, args) => {
      // Without WASM_BIGINT support we cannot directly call function with i64 as
      // part of thier signature, so we rely the dynCall functions generated by
      // wasm-emscripten-finalize
      if (sig.includes('j')) {
        return dynCallLegacy(sig, ptr, args);
      }
      assert(getWasmTableEntry(ptr), `missing table entry in dynCall: ${ptr}`);
      var rtn = getWasmTableEntry(ptr).apply(null, args);
      return rtn;
    };
  var getDynCaller = (sig, ptr) => {
      assert(sig.includes('j') || sig.includes('p'), 'getDynCaller should only be called with i64 sigs')
      var argCache = [];
      return function() {
        argCache.length = 0;
        Object.assign(argCache, arguments);
        return dynCall(sig, ptr, argCache);
      };
    };
  
  
  var embind__requireFunction = (signature, rawFunction) => {
      signature = readLatin1String(signature);
  
      function makeDynCaller() {
        if (signature.includes('j')) {
          return getDynCaller(signature, rawFunction);
        }
        return getWasmTableEntry(rawFunction);
      }
  
      var fp = makeDynCaller();
      if (typeof fp != "function") {
          throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
      }
      return fp;
    };
  
  
  
  var extendError = (baseErrorType, errorName) => {
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
          return `${this.name}: ${this.message}`;
        }
      };
  
      return errorClass;
    };
  var UnboundTypeError;
  
  
  
  var getTypeName = (type) => {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    };
  var throwUnboundTypeError = (message, types) => {
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
  
      throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([', ']));
    };
  
  var __embind_register_class = (rawType,
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
                             rawDestructor) => {
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
        throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]);
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
  
          var constructor = createNamedFunction(name, function() {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name);
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " has no accessible constructor");
            }
            var body = registeredClass.constructor_body[arguments.length];
            if (undefined === body) {
              throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${arguments.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
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
  
          if (registeredClass.baseClass) {
            // Keep track of class hierarchy. Used to allow sub-classes to inherit class functions.
            if (registeredClass.baseClass.__derivedClasses === undefined) {
              registeredClass.baseClass.__derivedClasses = [];
            }
  
            registeredClass.baseClass.__derivedClasses.push(registeredClass);
          }
  
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
    };

  var heap32VectorToArray = (count, firstElement) => {
      var array = [];
      for (var i = 0; i < count; i++) {
          // TODO(https://github.com/emscripten-core/emscripten/issues/17310):
          // Find a way to hoist the `>> 2` or `>> 3` out of this loop.
          array.push(HEAPU32[(((firstElement)+(i * 4))>>2)]);
      }
      return array;
    };
  
  
  var runDestructors = (destructors) => {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    };
  
  
  
  
  
  
  
  function newFunc(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError(`new_ called with constructor type ${typeof(constructor)} which is not a function`);
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
  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, /** boolean= */ isAsync) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      // isAsync: Optional. If true, returns an async function. Async bindings are only supported with JSPI.
      var argCount = argTypes.length;
  
      if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
  
      assert(!isAsync, 'Async bindings are only supported with JSPI.');
  
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
  
      var invokerFnBody = `
        return function (${argsList}) {
        if (arguments.length !== ${argCount - 2}) {
          throwBindingError('function ${humanName} called with ' + arguments.length + ' arguments, expected ${argCount - 2}');
        }`;
  
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
          (returns || isAsync ? "var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
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
  
      var invokerFn = newFunc(Function, args1).apply(null, args2);
      return createNamedFunction(humanName, invokerFn);
    }
  var __embind_register_class_constructor = (
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) => {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = `constructor ${classType.name}`;
  
        if (undefined === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
          throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount-1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
        }
        classType.registeredClass.constructor_body[argCount - 1] = () => {
          throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes);
        };
  
        whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
          // Insert empty slot for context type (argTypes[1]).
          argTypes.splice(1, 0, null);
          classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
          return [];
        });
        return [];
      });
    };

  
  
  
  
  
  
  var getFunctionName = (signature) => {
      signature = signature.trim();
      const argsIndex = signature.indexOf("(");
      if (argsIndex !== -1) {
        assert(signature[signature.length - 1] == ")", "Parentheses for argument names should match.");
        return signature.substr(0, argsIndex);
      } else {
        return signature;
      }
    };
  var __embind_register_class_function = (rawClassType,
                                      methodName,
                                      argCount,
                                      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
                                      invokerSignature,
                                      rawInvoker,
                                      context,
                                      isPureVirtual,
                                      isAsync) => {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      methodName = getFunctionName(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = `${classType.name}.${methodName}`;
  
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)];
        }
  
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
  
        function unboundTypesHandler() {
          throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes);
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
          var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
  
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
    };

  function handleAllocatorInit() {
      Object.assign(HandleAllocator.prototype, /** @lends {HandleAllocator.prototype} */ {
        get(id) {
          assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
          return this.allocated[id];
        },
        has(id) {
          return this.allocated[id] !== undefined;
        },
        allocate(handle) {
          var id = this.freelist.pop() || this.allocated.length;
          this.allocated[id] = handle;
          return id;
        },
        free(id) {
          assert(this.allocated[id] !== undefined);
          // Set the slot to `undefined` rather than using `delete` here since
          // apparently arrays with holes in them can be less efficient.
          this.allocated[id] = undefined;
          this.freelist.push(id);
        }
      });
    }
  /** @constructor */
  function HandleAllocator() {
      // Reserve slot 0 so that 0 is always an invalid handle
      this.allocated = [undefined];
      this.freelist = [];
    }
  var emval_handles = new HandleAllocator();;
  var __emval_decref = (handle) => {
      if (handle >= emval_handles.reserved && 0 === --emval_handles.get(handle).refcount) {
        emval_handles.free(handle);
      }
    };
  
  
  
  var count_emval_handles = () => {
      var count = 0;
      for (var i = emval_handles.reserved; i < emval_handles.allocated.length; ++i) {
        if (emval_handles.allocated[i] !== undefined) {
          ++count;
        }
      }
      return count;
    };
  
  var init_emval = () => {
      // reserve some special values. These never get de-allocated.
      // The HandleAllocator takes care of reserving zero.
      emval_handles.allocated.push(
        {value: undefined},
        {value: null},
        {value: true},
        {value: false},
      );
      emval_handles.reserved = emval_handles.allocated.length
      Module['count_emval_handles'] = count_emval_handles;
    };
  var Emval = {
  toValue:(handle) => {
        if (!handle) {
            throwBindingError('Cannot use deleted val. handle = ' + handle);
        }
        return emval_handles.get(handle).value;
      },
  toHandle:(value) => {
        switch (value) {
          case undefined: return 1;
          case null: return 2;
          case true: return 3;
          case false: return 4;
          default:{
            return emval_handles.allocate({refcount: 1, value: value});
          }
        }
      },
  };
  
  
  
  /** @suppress {globalThis} */
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAP32[((pointer)>>2)]);
    }
  var __embind_register_emval = (rawType, name) => {
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        'fromWireType': (handle) => {
          var rv = Emval.toValue(handle);
          __emval_decref(handle);
          return rv;
        },
        'toWireType': (destructors, value) => Emval.toHandle(value),
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: null, // This type does not need a destructor
  
        // TODO: do we need a deleteObject here?  write a test where
        // emval is passed into JS via an interface
      });
    };

  var embindRepr = (v) => {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    };
  
  var floatReadValueFromPointer = (name, width) => {
      switch (width) {
          case 4: return function(pointer) {
              return this['fromWireType'](HEAPF32[((pointer)>>2)]);
          };
          case 8: return function(pointer) {
              return this['fromWireType'](HEAPF64[((pointer)>>3)]);
          };
          default:
              throw new TypeError(`invalid float width (${width}): ${name}`);
      }
    };
  
  
  var __embind_register_float = (rawType, name, size) => {
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        'fromWireType': (value) => value,
        'toWireType': (destructors, value) => {
          if (typeof value != "number" && typeof value != "boolean") {
            throw new TypeError(`Cannot convert ${embindRepr(value)} to ${this.name}`);
          }
          // The VM will perform JS to Wasm value conversion, according to the spec:
          // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
          return value;
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': floatReadValueFromPointer(name, size),
        destructorFunction: null, // This type does not need a destructor
      });
    };

  
  var integerReadValueFromPointer = (name, width, signed) => {
      // integers are quite common, so generate very specialized functions
      switch (width) {
          case 1: return signed ?
              (pointer) => HEAP8[((pointer)>>0)] :
              (pointer) => HEAPU8[((pointer)>>0)];
          case 2: return signed ?
              (pointer) => HEAP16[((pointer)>>1)] :
              (pointer) => HEAPU16[((pointer)>>1)]
          case 4: return signed ?
              (pointer) => HEAP32[((pointer)>>2)] :
              (pointer) => HEAPU32[((pointer)>>2)]
          default:
              throw new TypeError(`invalid integer width (${width}): ${name}`);
      }
    };
  
  
  /** @suppress {globalThis} */
  var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
      name = readLatin1String(name);
      // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come
      // out as 'i32 -1'. Always treat those as max u32.
      if (maxRange === -1) {
        maxRange = 4294967295;
      }
  
      var fromWireType = (value) => value;
  
      if (minRange === 0) {
        var bitshift = 32 - 8*size;
        fromWireType = (value) => (value << bitshift) >>> bitshift;
      }
  
      var isUnsignedType = (name.includes('unsigned'));
      var checkAssertions = (value, toTypeName) => {
        if (typeof value != "number" && typeof value != "boolean") {
          throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${toTypeName}`);
        }
        if (value < minRange || value > maxRange) {
          throw new TypeError(`Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`);
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
        name,
        'fromWireType': fromWireType,
        'toWireType': toWireType,
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': integerReadValueFromPointer(name, size, minRange !== 0),
        destructorFunction: null, // This type does not need a destructor
      });
    };

  
  var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
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
        var size = HEAPU32[((handle)>>2)];
        var data = HEAPU32[(((handle)+(4))>>2)];
        return new TA(HEAP8.buffer, data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        'fromWireType': decodeMemoryView,
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': decodeMemoryView,
      }, {
        ignoreDuplicateRegistrations: true,
      });
    };

  
  
  
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string');
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
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
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  
  
  
  var __embind_register_std_string = (rawType, name) => {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
        name,
        // For some method names we use string keys here since they are part of
        // the public/external API and/or used by the runtime-generated code.
        'fromWireType'(value) {
          var length = HEAPU32[((value)>>2)];
          var payload = value + 4;
  
          var str;
          if (stdStringIsUTF8) {
            var decodeStartPtr = payload;
            // Looping here to support possible embedded '0' bytes
            for (var i = 0; i <= length; ++i) {
              var currentBytePtr = payload + i;
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
              a[i] = String.fromCharCode(HEAPU8[payload + i]);
            }
            str = a.join('');
          }
  
          _free(value);
  
          return str;
        },
        'toWireType'(destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
          }
  
          var length;
          var valueIsOfTypeString = (typeof value == 'string');
  
          if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
            throwBindingError('Cannot pass non-string to std::string');
          }
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            length = lengthBytesUTF8(value);
          } else {
            length = value.length;
          }
  
          // assumes 4-byte alignment
          var base = _malloc(4 + length + 1);
          var ptr = base + 4;
          HEAPU32[((base)>>2)] = length;
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            stringToUTF8(value, ptr, length + 1);
          } else {
            if (valueIsOfTypeString) {
              for (var i = 0; i < length; ++i) {
                var charCode = value.charCodeAt(i);
                if (charCode > 255) {
                  _free(ptr);
                  throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                }
                HEAPU8[ptr + i] = charCode;
              }
            } else {
              for (var i = 0; i < length; ++i) {
                HEAPU8[ptr + i] = value[i];
              }
            }
          }
  
          if (destructors !== null) {
            destructors.push(_free, base);
          }
          return base;
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': readPointer,
        destructorFunction(ptr) {
          _free(ptr);
        },
      });
    };

  
  
  
  var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;;
  var UTF16ToString = (ptr, maxBytesToRead) => {
      assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
      var endPtr = ptr;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // Also, use the length info to avoid running tiny strings through
      // TextDecoder, since .subarray() allocates garbage.
      var idx = endPtr >> 1;
      var maxIdx = idx + maxBytesToRead / 2;
      // If maxBytesToRead is not passed explicitly, it will be undefined, and this
      // will always evaluate to true. This saves on code size.
      while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
      endPtr = idx << 1;
  
      if (endPtr - ptr > 32 && UTF16Decoder)
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  
      // Fallback: decode without UTF16Decoder
      var str = '';
  
      // If maxBytesToRead is not passed explicitly, it will be undefined, and the
      // for-loop's condition will always evaluate to true. The loop is then
      // terminated on the first null char.
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit == 0) break;
        // fromCharCode constructs a character from a UTF-16 code unit, so we can
        // pass the UTF16 string right through.
        str += String.fromCharCode(codeUnit);
      }
  
      return str;
    };
  
  var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
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
    };
  
  var lengthBytesUTF16 = (str) => {
      return str.length*2;
    };
  
  var UTF32ToString = (ptr, maxBytesToRead) => {
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
    };
  
  var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
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
    };
  
  var lengthBytesUTF32 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
        len += 4;
      }
  
      return len;
    };
  var __embind_register_std_wstring = (rawType, charSize, name) => {
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
        name,
        'fromWireType': (value) => {
          // Code mostly taken from _embind_register_std_string fromWireType
          var length = HEAPU32[((value)>>2)];
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
        'toWireType': (destructors, value) => {
          if (!(typeof value == 'string')) {
            throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
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
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction(ptr) {
          _free(ptr);
        }
      });
    };

  
  var __embind_register_void = (rawType, name) => {
      name = readLatin1String(name);
      registerType(rawType, {
        isVoid: true, // void return values can be optimized out sometimes
        name,
        'argPackAdvance': 0,
        'fromWireType': () => undefined,
        // TODO: assert if anything else is given?
        'toWireType': (destructors, o) => undefined,
      });
    };

  var _abort = () => {
      abort('native code called abort()');
    };

  var _emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

  var getHeapMax = () =>
      HEAPU8.length;
  
  var abortOnCannotGrowMemory = (requestedSize) => {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      abortOnCannotGrowMemory(requestedSize);
    };

  var SYSCALLS = {
  varargs:undefined,
  get() {
        assert(SYSCALLS.varargs != undefined);
        // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
        var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
        SYSCALLS.varargs += 4;
        return ret;
      },
  getp() { return SYSCALLS.get() },
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var _fd_close = (fd) => {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  
  var convertI32PairToI53Checked = (lo, hi) => {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);;
  
    
      return 70;
    ;
  }

  var printCharBuffers = [null,[],[]];
  
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    };
embind_init_charCodes();
BindingError = Module['BindingError'] = class BindingError extends Error { constructor(message) { super(message); this.name = 'BindingError'; }};
InternalError = Module['InternalError'] = class InternalError extends Error { constructor(message) { super(message); this.name = 'InternalError'; }};
init_ClassHandle();
init_embind();;
init_RegisteredPointer();
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
handleAllocatorInit();
init_emval();;
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  /** @export */
  __assert_fail: ___assert_fail,
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  _embind_register_bigint: __embind_register_bigint,
  /** @export */
  _embind_register_bool: __embind_register_bool,
  /** @export */
  _embind_register_class: __embind_register_class,
  /** @export */
  _embind_register_class_constructor: __embind_register_class_constructor,
  /** @export */
  _embind_register_class_function: __embind_register_class_function,
  /** @export */
  _embind_register_emval: __embind_register_emval,
  /** @export */
  _embind_register_float: __embind_register_float,
  /** @export */
  _embind_register_integer: __embind_register_integer,
  /** @export */
  _embind_register_memory_view: __embind_register_memory_view,
  /** @export */
  _embind_register_std_string: __embind_register_std_string,
  /** @export */
  _embind_register_std_wstring: __embind_register_std_wstring,
  /** @export */
  _embind_register_void: __embind_register_void,
  /** @export */
  abort: _abort,
  /** @export */
  emscripten_memcpy_js: _emscripten_memcpy_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};
var wasmExports = createWasm();
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors');
var ___getTypeName = createExportWrapper('__getTypeName');
var __embind_initialize_bindings = Module['__embind_initialize_bindings'] = createExportWrapper('_embind_initialize_bindings');
var ___errno_location = createExportWrapper('__errno_location');
var _fflush = Module['_fflush'] = createExportWrapper('fflush');
var _malloc = Module['_malloc'] = createExportWrapper('malloc');
var _free = createExportWrapper('free');
var _emscripten_stack_init = wasmExports["emscripten_stack_init"]
var _emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"]
var _emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"]
var _emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"]
var stackSave = createExportWrapper('stackSave');
var stackRestore = createExportWrapper('stackRestore');
var stackAlloc = createExportWrapper('stackAlloc');
var _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"]
var ___cxa_is_pointer_type = createExportWrapper('__cxa_is_pointer_type');
var dynCall_jiji = Module['dynCall_jiji'] = createExportWrapper('dynCall_jiji');


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'zeroMemory',
  'exitJS',
  'growMemory',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'setErrNo',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getHostByName',
  'initRandomFill',
  'randomFill',
  'getCallstack',
  'emscriptenLog',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'jstoi_q',
  'jstoi_s',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'getNativeTypeSize',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'demangle',
  'demangleAll',
  'jsStackTrace',
  'stackTrace',
  'getEnvStrings',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'createDyncallWrapper',
  'safeSetTimeout',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'findMatchingCatch',
  'setMainLoop',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar',
  'FS_createDataFile',
  'FS_unlink',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  '__glGenObject',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'getFunctionArgsName',
  'requireRegisteredType',
  'registerInheritedInstance',
  'unregisterInheritedInstance',
  'enumReadValueFromPointer',
  'validateThis',
  'getStringOrSymbol',
  'emval_get_global',
  'emval_returnValue',
  'emval_lookupTypes',
  'emval_addMethodCaller',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

var unexportedSymbols = [
  'run',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'FS_createFolder',
  'FS_createPath',
  'FS_createLazyFile',
  'FS_createLink',
  'FS_createDevice',
  'FS_readFile',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'stackAlloc',
  'stackSave',
  'stackRestore',
  'getTempRet0',
  'setTempRet0',
  'writeStackCookie',
  'checkStackCookie',
  'intArrayFromBase64',
  'tryParseAsDataURI',
  'convertI32PairToI53Checked',
  'ptrToString',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'UNWIND_CACHE',
  'readEmAsmArgsArray',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'handleAllocatorInit',
  'HandleAllocator',
  'wasmTable',
  'noExitRuntime',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'UTF16Decoder',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'JSEvents',
  'specialHTMLTargets',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'ExitStatus',
  'flush_NO_FILESYSTEM',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'Browser',
  'wget',
  'SYSCALLS',
  'preloadPlugins',
  'FS_stdin_getChar_buffer',
  'FS',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'emscripten_webgl_power_preferences',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'InternalError',
  'BindingError',
  'throwInternalError',
  'throwBindingError',
  'registeredTypes',
  'awaitingDependencies',
  'typeDependencies',
  'tupleRegistrations',
  'structRegistrations',
  'sharedRegisterType',
  'whenDependentTypesAreResolved',
  'embind_charCodes',
  'embind_init_charCodes',
  'readLatin1String',
  'getTypeName',
  'getFunctionName',
  'heap32VectorToArray',
  'UnboundTypeError',
  'PureVirtualError',
  'GenericWireTypeSize',
  'init_embind',
  'throwUnboundTypeError',
  'ensureOverloadTable',
  'exposePublicSymbol',
  'replacePublicSymbol',
  'extendError',
  'createNamedFunction',
  'embindRepr',
  'registeredInstances',
  'getBasestPointer',
  'getInheritedInstance',
  'getInheritedInstanceCount',
  'getLiveInheritedInstances',
  'registeredPointers',
  'registerType',
  'integerReadValueFromPointer',
  'floatReadValueFromPointer',
  'simpleReadValueFromPointer',
  'readPointer',
  'runDestructors',
  'newFunc',
  'craftInvokerFunction',
  'embind__requireFunction',
  'genericPointerToWireType',
  'constNoSmartPtrRawPointerToWireType',
  'nonConstNoSmartPtrRawPointerToWireType',
  'init_RegisteredPointer',
  'RegisteredPointer',
  'RegisteredPointer_fromWireType',
  'runDestructor',
  'releaseClassHandle',
  'finalizationRegistry',
  'detachFinalizer_deps',
  'detachFinalizer',
  'attachFinalizer',
  'makeClassHandle',
  'init_ClassHandle',
  'ClassHandle',
  'throwInstanceAlreadyDeleted',
  'deletionQueue',
  'flushPendingDeletes',
  'delayFunction',
  'setDelayFunction',
  'RegisteredClass',
  'shallowCopyInternalPointer',
  'downcastPointer',
  'upcastPointer',
  'char_0',
  'char_9',
  'makeLegalFunctionName',
  'emval_handles',
  'emval_symbols',
  'init_emval',
  'count_emval_handles',
  'Emval',
  'emval_methodCallers',
  'reflectConstruct',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);



var calledRun;

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

function run() {

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
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();


// end include: postamble.js
// include: /Users/hongchan/a/web-audio-samples/src/audio-worklet/design-pattern/lib/em-es6-module.js
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

/* global Module */

// EXPORT_ES6 option does not work as described at
// https://github.com/kripken/emscripten/issues/6284, so we have to
// manually add this by '--post-js' setting when the Emscripten compilation.
export default Module;

// end include: /Users/hongchan/a/web-audio-samples/src/audio-worklet/design-pattern/lib/em-es6-module.js
