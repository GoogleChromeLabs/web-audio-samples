<script>
  import {clickOutside} from '$lib/actions/click-outside';

  export let name;

  /** @type {HTMLDialogElement} */
  let dropdown;
  let selected = false;

  const handleOpen = () => {
    if (selected) setTimeout(() => dropdown.close(), 200);
    else dropdown.show();
    selected = !selected;
  };

  const handleClickOutside = () => {
    setTimeout(() => dropdown.close(), 200);
    selected = false;
  };
</script>

<div
  class="flex hover:text-accent items-center relative select-none"
  class:text-accent={ selected }
  on:click={ handleOpen }
  on:keydown={ handleOpen }
  role="button"
  tabindex="0"
  use:clickOutside={ handleClickOutside }
>
  { name }
  <dialog
    bind:this={ dropdown }
    class="bg-secondary m-0 py-1 rounded-b shadow-md w-max z-50"
    class:fold={ !selected }
    class:unfold={ selected }
  >
    <slot />
  </dialog>
</div>

<style lang="postcss">
  dialog {
    top: calc(100% + .25rem);
  }
</style>
