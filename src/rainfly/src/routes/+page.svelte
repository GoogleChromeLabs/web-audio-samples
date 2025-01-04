<script>
  import Nav from '$lib/components/nav/Nav.svelte';
  import Visualizer from '$lib/components/Visualizer.svelte';
  import Editor from '$lib/components/Editor.svelte';
  import clickOutsideListener from '$lib/utils/click-outside';
  import {status, Status} from '$lib/stores/status';
  import {
    resumeContext,
    stopContext,
    suspendContext,
  } from '$lib/utils/audio-host';

  /** @type {(() => Promise<void>)} */
  let runEditorProcessor;
  /** @type {(() => Promise<void>)} */
  let runEditorMain;

  $: {
    switch ($status) {
      case Status.play:
        runCode();
        break;
      case Status.running:
        resumeContext();
        break;
      case Status.pause:
        suspendContext();
        break;
      default:
      case Status.stop:
        stopContext();
    }
  }

  /**
   * Run editor code and update status
   */
  async function runCode() {
    runEditorProcessor();
    try {
      await runEditorMain();
    } catch (error) {
      $status = Status.stop;
      throw error;
    }
  }
</script>
<script context="module">
  /** @type {(code: string, editorName: 'processor' | 'main') => void} */
  export let loadEditorProcessor;
  /** @type {(code: string, editorName: 'processor' | 'main') => void} */
  export let loadEditorMain;
  /** @type {() => string} */
  export let getEditorProcessor;
  /** @type {() => string} */
  export let getEditorMain;
</script>

<svelte:document on:click={clickOutsideListener} />

<main class="grid grid-cols-2 grid-rows-main h-full w-full">
  <nav class="col-span-2">
    <Nav />
  </nav>
  <header class="col-span-2">
    <Visualizer />
  </header>

  <section class="border-r border-black">
    <Editor id="processor"
      bind:runEditorCode={runEditorProcessor}
      bind:loadEditorCode={loadEditorProcessor}
      bind:getEditorCode={getEditorProcessor}/>
  </section>
  <section class="border-l border-black">
    <Editor id="main"
      bind:runEditorCode={runEditorMain}
      bind:loadEditorCode={loadEditorMain}
      bind:getEditorCode={getEditorMain}/>
  </section>
</main>
