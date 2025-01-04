<script>
  import NavExamples from '$lib/components/nav/items/NavExamples.svelte';
  import NavFile from '$lib/components/nav/items/NavFile.svelte';
  import logo from '$lib/assets/logo.svg';
  import NavHelp from '$lib/components/nav/items/NavHelp.svelte';
</script>

<nav class="w-full h-full pl-16 pr-4 py-1 mt-1 bg-secondary flex gap-6
  items-center border border-x-8 border-b-4 border-white box-border
  rounded-full">
  <NavFile />
  <NavExamples />
  <NavHelp />
</nav>

<img alt="rainfly logo" class="absolute left-4 top-1 w-11 z-40" src={logo}>
