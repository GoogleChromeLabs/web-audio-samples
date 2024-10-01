<script>
  import NavItem from '$lib/components/nav/NavItem.svelte';
  import NavDropdownItem from '$lib/components/nav/NavDropdownItem.svelte';
  import {fetchTextFile} from '$lib/utils/file-utils.js';
  import {
    loadEditorProcessor,
    loadEditorMain,
  } from '$lib/../routes/+page.svelte';

  /**
   * Load processor and main code from URL to Editor
   * @param {string} mainCodeUrl - URL to main code
   * @param {string} processorCodeUrl - URL to processor code
   */
  async function loadExample(mainCodeUrl, processorCodeUrl) {
    loadEditorMain((await fetchTextFile(mainCodeUrl)).data, 'main');
    loadEditorProcessor(
        (await fetchTextFile(processorCodeUrl)).data,
        'processor',
    );
  }
</script>

<NavItem name="Examples">
  <NavDropdownItem
    on:click={() => {
      loadExample('examples/bypass/main.js', 'examples/bypass/processor.js');
    }}
  >
    Hello Bypass
  </NavDropdownItem>
  <NavDropdownItem
    on:click={() => {
      loadExample('examples/sine/main.js', 'examples/sine/processor.js');
    }}
  >
    Hello Sine
  </NavDropdownItem>
</NavItem>
