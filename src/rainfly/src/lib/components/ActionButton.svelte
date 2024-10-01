<script>
  import {status, Status} from '$lib/stores/status';
  import playerPlay from '$lib/assets/player-play.svg';
  import playerStop from '$lib/assets/player-stop.svg';
  import playerPause from '$lib/assets/player-pause.svg';

  let showStop = false;
  let playButtonText = 'Play';
  let icon = playerPlay;

  /**
   * Play/Pause/Resume the AudioContext
   */
  function togglePlay() {
    if ($status === Status.stop) {
      status.set(Status.play);
    } else if ($status === Status.play || $status === Status.running) {
      status.set(Status.pause);
    } else if ($status === Status.pause) {
      status.set(Status.running);
    }
  }

  /**
   * Stop the AudioContext
   */
  function stop() {
    if ($status !== Status.stop) {
      status.set(Status.stop);
    }
  }

  $: {
    // update to next state
    switch ($status) {
      case Status.play:
      case Status.running:
        showStop = true;
        playButtonText = 'Pause';
        icon = playerPause;
        break;
      case Status.pause:
        showStop = true;
        playButtonText = 'Play';
        icon = playerPlay;
        break;
      default:
      case Status.stop:
        playButtonText = 'Run';
        icon = playerPlay;
        showStop = false;
    }
  }

</script>

<div class="flex">
  <button class="z-50" on:click={togglePlay}>
    <img src={icon} alt={playButtonText} />
  </button>
  <button class="z-40" class:fab-in={showStop} class:fab-out={!showStop}
  on:click={stop} id="stopButton">
    <img src={playerStop} alt="Stop" />
  </button>
</div>

<style lang="postcss">
  button {
    @apply p-4 bg-primary hover:shadow-xl rounded-full shadow-md transition;
  }
</style>
