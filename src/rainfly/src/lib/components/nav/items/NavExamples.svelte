<script>
  import NavItem from '$lib/components/nav/NavItem.svelte';
  import NavDropdownItem from '$lib/components/nav/NavDropdownItem.svelte';
  import {onMount} from 'svelte';
  import {fetchTextFile} from '$lib/utils/file-utils.js';
  import {
    loadEditorProcessor,
    loadEditorMain,
  } from '$lib/../routes/+page.svelte';

   /**
   * @typedef {Object} Example
   * @property {string} name - The name of the example
   * @property {string} mainCodeUrl - URL to the AudioWorkletNode code
   * @property {string} processorCodeUrl - URL to the AudioWorkletProcessor code
   */

  /** @type Example[] */
  let examples = [];

  onMount(async () => {
    buildExamples();
  });

  /**
   * Load processor and main code from URL to Editor
   * @param {string} mainCodeUrl - URL to main code
   * @param {string} processorCodeUrl - URL to processor code
   */
  async function loadExample(mainCodeUrl, processorCodeUrl) {
    try {
      loadEditorMain((await fetchTextFile(mainCodeUrl)).data, 'main');
      loadEditorProcessor(
          (await fetchTextFile(processorCodeUrl)).data,
          'processor',
      );
    } catch (/** @type any */ e) {
      loadEditorProcessor(`${e.message}`, 'processor');
    }
  }

  /**
   * Build examples dropdown from examples.json
   */
  async function buildExamples() {
    const response = await fetch('examples/examples.json');
    const data = await response.json();
    examples = data.examples;
  }
</script>

<NavItem name="Examples">
  {#each examples as example}
    <NavDropdownItem
      on:click={() => {
        loadExample(example.mainCodeUrl, example.processorCodeUrl);
      }}
    >
      {example.name}
    </NavDropdownItem>
  {/each}
</NavItem>
