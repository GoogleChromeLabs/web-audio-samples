<script>
  import NavItem from '$lib/components/nav/NavItem.svelte';
  import NavDropdownItem from '$lib/components/nav/NavDropdownItem.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import {getRecordedSamples, getSampleRate} from '$lib/utils/audio-host';
  import {getEditorProcessor, getEditorMain} from '$lib/../routes/+page.svelte';
  import {audioBufferToWav} from '$lib/utils/audio-buffer-to-wav';
  import {zipTextFiles} from '$lib/utils/file-utils';

  /** @type {(state: boolean) => any} */
  let showError;
  let errorMsg = '';

  /**
   * Saves the code in the processor and main editor as a .zip file.
   */
  async function saveCode() {
    const processorCode = getEditorProcessor();
    const mainCode = getEditorMain();
    /** @type {Object.<string, string>}*/
    const files = {};
    processorCode && (files['processor.js'] = processorCode);
    mainCode && (files['main.js'] = mainCode);

    const zipBlob = await zipTextFiles(files);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exports the recorded audio samples as a .wav file.
   *
   * @function
   * @return {void}
   */
  function exportWav() {
    const recordedSamples = getRecordedSamples();
    const sampleRate = getSampleRate();
    if (recordedSamples.length === 0 || recordedSamples[0].length === 0) {
      errorMsg = 'Recording buffer is empty';
      console.error(errorMsg);
      showError(true);
      return;
    } else {
      showError(false);
    }

    const monoSamples = recordedSamples[0];
    const recordBuffer = new AudioBuffer({
      length: monoSamples.length,
      numberOfChannels: 1,
      sampleRate,
    });
    recordBuffer.copyToChannel(new Float32Array(monoSamples), 0);
    const recordBlob = audioBufferToWav(recordBuffer, true);
    console.log('exporting to wav (mono)', recordBuffer);

    const url = URL.createObjectURL(recordBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.wav';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<NavItem name="File">
  <NavDropdownItem on:click={saveCode}>
    Save code
  </NavDropdownItem>
  <NavDropdownItem on:click={exportWav}>
    Export to <code>.wav</code>
  </NavDropdownItem>
</NavItem>

<Toast bind:handleToggle={showError}>{errorMsg}</Toast>
