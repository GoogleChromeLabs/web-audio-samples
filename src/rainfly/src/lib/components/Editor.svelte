<script>
  import Toast from '$lib/components/Toast.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import {onDestroy, onMount} from 'svelte';
  import {runProcessorCode, runMainCode} from '$lib/utils/audio-host.js';
  import {vimStatus} from '$lib/stores/vim-status.js';
  import {status, Status} from '$lib/stores/status.js';
  import {fetchTextFile} from '$lib/utils/file-utils.js';

  /**
   * @type {string} - "processor" | "main"
   */
  export let id = 'main';
  /**
   * @type {0 | 1} - 0 for processor, 1 for main
   */
  let editorType;
  const EditorTypes = Object.freeze({
    'processor': 0,
    'main': 1,
  });

  /** @type {typeof import('../utils/monaco.js').default} */
  let monaco;
  // eslint-disable-next-line max-len
  /** @type {import('../utils/monaco.js').default.editor.IStandaloneCodeEditor} */
  let editor;
  /** @type {HTMLDivElement} */
  let editorContainer;

  /** @type {typeof import('monaco-vim').initVimMode} */
  let initVimMode;
  /** @type {typeof import('monaco-vim').VimMode} */
  let vimMode;
  /** @type {HTMLDivElement} */
  let vimBar;

  /** @type {HTMLButtonElement} */
  let anchor;

  /** @type {string} */
  let errorMsg = '';
  /** @type {(state: boolean) => any} */
  let showError;

  let isMounted = false;

  $: {
    editorType = id === 'processor' ? EditorTypes.processor : EditorTypes.main;

    if (vimBar && isMounted) {
      $vimStatus ? initVim() : stopVim();
    }
  }

  onMount(async () => {
    monaco = (await import('../utils/monaco.js')).default;
    initVimMode = (await import('monaco-vim')).initVimMode;

    const templateCode = editorType === EditorTypes.processor ?
      (await fetchTextFile('examples/bypass/processor.js')).data :
      (await fetchTextFile('examples/bypass/main.js')).data;


    editor = monaco.editor.create(editorContainer, {
      minimap: {enabled: false},
      fontSize: 14,
      scrollBeyondLastLine: false,
      // automaticLayout: true,
    });
    const model = monaco.editor.createModel(
        templateCode || `console.log("Hello World!")`,
        'javascript',
    );
    editor.setModel(model);

    // temp testing
    editor.onDidChangeModelContent(() => {
      // console.log(getEditorCode())
    });

    initKeyBindings();

    isMounted = true;
  });

  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose());
    editor?.dispose();
  });

  /**
   * Resize monaco editor to fit container
   */
  function resizeEditor() {
    editor?.layout();
  }

  /**
   * Get editor code
   * @return {string} editor contents or empty string if undefined
   */
  export function getEditorCode() {
    return editor?.getValue() || '';
  }

  /**
   * Set editor contents
   * @param {string} code - code to set in editor
   */
  function setEditorCode(code) {
    editor?.setValue(code);
  }

  /**
   * Function to load code into specified editor
   * @param {string} code {string} - code to load into editor
   * @param {'processor' | 'main'} editorName - which editor to load code into
   */
  export function loadEditorCode(code, editorName) {
    const whichEditor = editorName === 'main' ?
        EditorTypes.main :
        EditorTypes.processor;
    if (editorType === whichEditor) {
      setEditorCode(code);
    }
  }

  /**
   * Run the editor code, passing code to audio host system
   */
  export async function runEditorCode() {
    const code = getEditorCode();
    if (code === '') return;

    if (editorType === EditorTypes.processor) {
      runProcessorCode(code);
    } else {
      try {
        await runMainCode(code);
        showError(false);
      } catch (/** @type {any} */ error) {
        errorMsg = error.message;
        showError(true);
        throw error;
      }
    }
  }

  /**
   * Create keyboard shortcuts in Monaco editor
   */
  function initKeyBindings() {
    editor.addAction({
      id: 'play',
      label: 'play',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        if ($status === Status.stop) {
          $status = Status.play;
        } else if ($status === Status.play || $status === Status.running) {
          $status = Status.pause;
        } else if ($status === Status.pause) {
          $status = Status.play;
        }
      },
    });
    editor.addAction({
      id: 'stop',
      label: 'stop',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backspace],
      run: () => {
        stop();
        if ($status !== Status.stop) {
          $status = Status.stop;
        }
      },
    });
  }

  /**
   * Enable vim keybindings
   */
  function initVim() {
    vimMode = initVimMode(editor, vimBar);
    $vimStatus = true;
    editorContainer.style.height = 'calc(100% - 1.75rem - 1.5rem)';
    resizeEditor();
  }

  /**
   * Disable vim keybindings
   */
  function stopVim() {
    vimMode?.dispose();
    $vimStatus = false;
    editorContainer.style.height = 'calc(100% - 1.75rem)';
    resizeEditor();
  }

  /**
   * Toggle vim mode
   */
  function toggleVim() {
    $vimStatus = !$vimStatus;
  }

</script>
<svelte:window on:resize={resizeEditor} />

<div class="container">
  <div class="header">
    <div class="inline-block font-semibold">
      {editorType === EditorTypes.processor ? 'AudioWorkletProcessor' : 'Main'}
    </div>
    {#if editorType === EditorTypes.main}
      <button
        on:click={toggleVim}
        class="p-1 transition hover:bg-accent/75"
        class:bg-accent={$vimStatus}
        bind:this={anchor}
      >
        <svg fill="#000000" width="20" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <!-- eslint-disable-next-line max-len -->
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <title>VIm</title>
            <!-- eslint-disable-next-line max-len -->
            <path d="M26.445 22.095l0.592-0.649h1.667l0.386 0.519-1.581 5.132h0.616l-0.1 0.261h-2.228l1.405-4.454h-2.518l-1.346 4.238h0.53l-0.091 0.217h-2.006l1.383-4.434h-2.619l-1.327 4.172h0.545l-0.090 0.261h-2.076l1.892-5.573h-0.732l0.114-0.339h2.062l0.649 0.671h1.132l0.614-0.692h1.326l0.611 0.669zM7.99 27.033h-2.141l-0.327-0.187v-21.979h-1.545l-0.125-0.125v-1.47l0.179-0.192h9.211l0.266 0.267v1.385l-0.177 0.216h-1.348v10.857l11.006-10.857h-2.607l-0.219-0.235v-1.453l0.151-0.139h9.36l0.165 0.166v1.337l-12.615 12.937h-0.466c-0.005-0-0.011-0-0.018-0-0.012 0-0.024 0.001-0.036 0.002l0.002-0-0.025 0.004c-0.058 0.012-0.108 0.039-0.149 0.075l0-0-0.429 0.369-0.005 0.004c-0.040 0.037-0.072 0.084-0.090 0.136l-0.001 0.002-0.37 1.037zM17.916 18.028l0.187 0.189-0.336 1.152-0.281 0.282h-1.211l-0.226-0.226 0.389-1.088 0.36-0.309zM13.298 27.42l1.973-5.635h-0.626l0.371-0.38h2.073l-1.953 5.692h0.779l-0.099 0.322zM30.996 15.982h-0.034l-5.396-5.396 5.377-5.516v-2.24l-0.811-0.81h-10.245l-0.825 0.756v1.306l-3.044-3.044v-0.034l-0.019 0.018-0.018-0.018v0.034l-1.612 1.613-0.672-0.673h-10.151l-0.797 0.865v2.356l0.77 0.77h0.9v6.636l-3.382 3.38h-0.034l0.018 0.016-0.018 0.017h0.034l3.382 3.382v8.081l1.133 0.654h2.902l2.321-2.379 5.206 5.206v0.035l0.019-0.017 0.017 0.017v-0.035l3.136-3.135h0.606c0.144-0.001 0.266-0.093 0.312-0.221l0.001-0.002 0.182-0.532c0.011-0.031 0.017-0.067 0.017-0.105 0-0.073-0.024-0.14-0.064-0.195l0.001 0.001 1.827-1.827-0.765 2.452c-0.009 0.029-0.015 0.063-0.015 0.097 0 0.149 0.098 0.275 0.233 0.317l0.002 0.001c0.029 0.009 0.063 0.015 0.097 0.015 0 0 0 0 0 0h2.279c0.136-0.001 0.252-0.084 0.303-0.201l0.001-0.002 0.206-0.492c0.014-0.036 0.022-0.077 0.022-0.121 0-0.048-0.010-0.094-0.028-0.135l0.001 0.002c-0.035-0.082-0.1-0.145-0.18-0.177l-0.002-0.001c-0.036-0.015-0.077-0.024-0.121-0.025h-0.094l1.050-3.304h1.54l-1.27 4.025c-0.009 0.029-0.015 0.063-0.015 0.097 0 0.149 0.098 0.274 0.232 0.317l0.002 0.001c0.029 0.009 0.063 0.015 0.098 0.015 0 0 0.001 0 0.001 0h2.502c0 0 0.001 0 0.001 0 0.14 0 0.26-0.087 0.308-0.21l0.001-0.002 0.205-0.535c0.013-0.034 0.020-0.073 0.020-0.114 0-0.142-0.090-0.264-0.215-0.311l-0.002-0.001c-0.034-0.013-0.073-0.021-0.114-0.021h-0.181l1.413-4.59c0.011-0.031 0.017-0.066 0.017-0.103 0-0.074-0.025-0.143-0.066-0.198l0.001 0.001-0.469-0.63-0.004-0.006c-0.061-0.078-0.156-0.127-0.261-0.127h-1.795c-0.093 0-0.177 0.039-0.237 0.101l-0 0-0.5 0.549h-0.78l-0.052-0.057 5.555-5.555h0.035l-0.017-0.014z"></path>
          </g>
        </svg>
      </button>
    {/if}
  </div>
  <div class="editor-container" bind:this={editorContainer} />
  <section class:hidden={!$vimStatus}>
    <div class="vimBar" bind:this={vimBar} />
  </section>
</div>

<Toast bind:handleToggle={showError}>{errorMsg}</Toast>

{#if editorType === EditorTypes.main}
  <Tooltip {anchor}>
    Toggle Vim mode
  </Tooltip>
{/if}

<style lang="postcss">
  .header {
    @apply px-2 h-7 flex justify-between items-center bg-primary;
  }

  .container {
    width: 100%;
    height: 100%;
  }

  .editor-container {
    /* 100% - header - vim */
    height: calc(100% - 1.75rem - 1.5rem);
  }
</style>
