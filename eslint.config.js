import js from '@eslint/js';

export default [
  // Base configuration for most files
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        requestAnimationFrame: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        XMLHttpRequest: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        
        // Web Audio API globals
        AudioContext: 'readonly',
        OfflineAudioContext: 'readonly',
        BaseAudioContext: 'readonly',
        AudioWorkletNode: 'readonly',
        AudioWorkletProcessor: 'readonly',
        OscillatorNode: 'readonly',
        GainNode: 'readonly',
        AnalyserNode: 'readonly',
        MediaStreamAudioSourceNode: 'readonly',
        registerProcessor: 'readonly',
        
        // WebAssembly
        WebAssembly: 'readonly',
        
        // TextDecoder/TextEncoder
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        
        // ES2021+ globals
        Promise: 'readonly',
        Symbol: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        globalThis: 'readonly',
        
        // Common globals
        arguments: 'readonly',
      },
    },
    rules: {
      // Google style rules adapted for flat config
      'indent': ['error', 2, {
        'CallExpression': {
          'arguments': 2,
        },
        'FunctionDeclaration': {
          'parameters': 2,
        },
        'FunctionExpression': {
          'parameters': 2,
        },
        'MemberExpression': 2,
        'ObjectExpression': 1,
        'SwitchCase': 1,
        'ignoredNodes': [
          'ConditionalExpression',
        ],
      }],
      'max-len': ['error', {
        'code': 80,
        'tabWidth': 2,
        'ignoreUrls': true,
        'ignorePattern': 'goog\.(module|require)',
      }],
      'no-unused-vars': ['error', {'args': 'none'}],
      'operator-linebreak': ['error', 'after'],
      'padded-blocks': ['error', 'never'],
      'quote-props': ['error', 'consistent'],
      'require-jsdoc': 0,
      'spaced-comment': ['error', 'always'],
      'brace-style': 'error',
      'camelcase': ['error', {'properties': 'never'}],
      'comma-dangle': ['error', 'always-multiline'],
      'comma-spacing': 'error',
      'comma-style': 'error',
      'computed-property-spacing': 'error',
      'eol-last': 'error',
      'func-call-spacing': 'error',
      'key-spacing': 'error',
      'keyword-spacing': 'error',
      'linebreak-style': 'error',
      'new-cap': 'error',
      'no-array-constructor': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-multiple-empty-lines': ['error', {'max': 2}],
      'no-new-object': 'error',
      'no-tabs': 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': 'error',
      'one-var': ['error', {
        'var': 'never',
        'let': 'never',
        'const': 'never',
      }],
      'quotes': ['error', 'single', {'allowTemplateLiterals': true}],
      'semi': 'error',
      'semi-spacing': 'error',
      'space-before-blocks': 'error',
      'space-before-function-paren': ['error', {
        'asyncArrow': 'always',
        'anonymous': 'never',
        'named': 'never',
      }],
      'space-infix-ops': 'error',
      'space-unary-ops': ['error', {
        'words': true,
        'nonwords': false,
      }],
      'switch-colon-spacing': 'error',
    },
  },
  
  // Specific configuration for Worker files
  {
    files: ['**/*worker*.js', '**/*Worker*.js'],
    languageOptions: {
      globals: {
        // Worker globals
        self: 'readonly',
        Worker: 'readonly',
        postMessage: 'readonly',
        onmessage: 'readonly',
        importScripts: 'readonly',
        close: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
  
  // Specific configuration for Service Worker files  
  {
    files: ['**/*serviceworker*.js', '**/*service-worker*.js', '**/sw.js'],
    languageOptions: {
      globals: {
        // Service Worker globals
        self: 'readonly',
        clients: 'readonly',
        registration: 'readonly',
        skipWaiting: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        console: 'readonly',
        caches: 'readonly',
        indexedDB: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },
  },
  
  // Global ignores for all generated and problematic files
  {
    ignores: [
      // Archive and build directories
      '_site/archive/**',
      '_site/**/build/**',
      
      // All WASM related files
      '_site/**/*.wasm.js',
      '_site/**/*.wasmmodule.js',
      '_site/**/variable-buffer-kernel.wasmmodule.js',
      '_site/**/simple-kernel.wasmmodule.js',
      '_site/**/synth.wasm.js',
      
      // Service workers
      '_site/**/coi-serviceworker.js',
      '_site/**/*serviceworker*.js',
      
      // Generated/problematic files
      '_site/**/free-queue.js',
      '_site/**/wasm-worklet-processor.js',
      
      // Node modules and other build artifacts
      'node_modules/**',
      '_site/node_modules/**',
      
      // Specific problematic files that are likely generated
      '_site/**/design-pattern/wasm/**/*.js',
      '_site/**/design-pattern/wasm-ring-buffer/**/*.wasmmodule.js',
      '_site/**/design-pattern/wasm-supersaw/**/*.wasm.js',
      
      // Any file with "wasm" in the path that's likely generated
      '_site/**/*wasm*/**/*.js',
      
      // Free queue library files
      '_site/**/free-queue/**/*.js',
    ],
  },
]; 