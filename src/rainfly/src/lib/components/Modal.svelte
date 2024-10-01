<script>
  import {portal} from '$lib/actions/portal.js';

  /** @type {HTMLDialogElement} */
  let modalDialog;

  /**
   * @param {boolean} state
   */
  export function showModal(state) {
    state ? modalDialog.showModal() : modalDialog.close();
  }
</script>

<dialog
  class="absolute bg-white w-full max-w-2xl max-h-[75vh] cursor-pointer
    rounded-3xl shadow-md"
  bind:this={modalDialog}
  use:portal
>
  <button class="h-full px-4 py-2 w-full" on:click={() => showModal(false)}>
    <slot />
  </button>
</dialog>

<style lang="postcss">
  dialog {
    transition: display .2s allow-discrete, overlay 1s allow-discrete;
    animation: appear .2s forwards;
  }

  dialog:not([open]) {
    animation: disappear .2s forwards;
  }
</style>
