<script>
  import { onMount } from "svelte";
  import { WebMidi } from "webmidi";

  let availableOutputs = [];
  $: console.log(availableOutputs);

  /** @type {WebMidi.MIDIOutput} */
  let selectedOutput = null;
  $: window.selectedOutput = selectedOutput;

  function setMute(channel, isMuted) {
    if (selectedOutput) {
      selectedOutput.channels[2].sendControlChange(channel, isMuted ? 255 : 0);
    }
  }

  onMount(async () => {
    await WebMidi.enable();
    availableOutputs = WebMidi.outputs;
  });
</script>

<main>
  <p>Selected Output: {selectedOutput?.name}</p>
  <ul>
    {#each availableOutputs as output}
      <li>
        <code>{output.id}</code> &bull; {output.name}
        <button on:click={(_) => (selectedOutput = output)}>select</button>
      </li>
    {/each}
  </ul>
</main>
