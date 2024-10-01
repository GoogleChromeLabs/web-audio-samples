<script>
  import NavItem from '$lib/components/nav/NavItem.svelte';
  import NavDropdownItem from '$lib/components/nav/NavDropdownItem.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import splash from '$lib/assets/splash.svg';

  /** @type {(state: boolean) => void}*/
  let showAbout;
</script>

<NavItem name="Help">
  <NavDropdownItem on:click={() => showAbout(true)}>About</NavDropdownItem>
</NavItem>

<Modal bind:showModal={showAbout}>
  <div class="w-full h-full p-4 text-left text-sm text-gray-600">
    <div class="w-full flex justify-between pb-4">
      <div>
        <h1 class="font-bold text-4xl mb-3 text-black">Rainfly</h1>
        <p>An AudioWorklet DSP Playground for Chromium Web Audio API Project
          (2024)</p>
        <br>
        <p>Created by <a href="https://github.com/terryzfeng">@terryzfeng</a> and <a href="https://github.com/kizjkre">@kizjkre</a></p>
        <br>
        <!-- TODO: Update with final URL-->
        <p>See
          <a href="https://github.com/GoogleChromeLabs/web-audio-samples">GitHub</a>
           for more information or to submit an issue</p>
      </div>
      <div class="pl-8">
        <img src={splash} alt="Rainfly logo" class="w-96" />
      </div>
    </div>
    <div class="text-center text-sm">
      <!-- eslint-disable-next-line no-undef -->
      <p>ver {meta.version}</p>
    </div>
  </div>
</Modal>

<style lang="postcss">
  a {
    @apply text-blue-500 underline;
  }
</style>
