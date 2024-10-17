<script>
  import Toast from '$lib/components/Toast.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import {onDestroy, onMount} from 'svelte';
  import {runProcessorCode, runMainCode} from '$lib/utils/audio-host.js';
  import {vimStatus} from '$lib/stores/vim-status.js';
  import {status, Status} from '$lib/stores/status.js';
  import {fetchTextFile} from '$lib/utils/file-utils.js';
  import vimIcon from '$lib/assets/vim.svg';

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

    // TODO: Add ability for autosave on change to LocalStorage
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
        <img src={vimIcon} alt="Vim" />
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
