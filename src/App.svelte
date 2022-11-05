<script>
  import Modal from "./components/modal.svelte";
  import Scene from "./components/scene.svelte";
  import { showingModal, dataSourceConfig, selectedDataSourceId, selectedConfigId } from "./lib/stores";

  import Papa from "papaparse";
  import { onMount } from "svelte";
  import DbManager from "./components/dbManager.svelte";

  import {ddp} from "./lib/db"

  import { configs, sheets } from './lib/db';

  let loading = ["Loading..."];

  let sceneSelector;

  let selectedConfig = null;
  $: selectedConfig = ($configs || []).find(config => config.id === $selectedConfigId) || {};
  let data = [];
  $: data = selectedConfig.sheetId ? $sheets.find(sheet => sheet.id === selectedConfig.sheetId).table : [];

  // $: console.log(data);
  // $: console.log(selectedConfig)
  // $: console.log($configs)
  // $: console.log($sheets)
  // $: console.log($selectedConfigId)
  $: console.log({
    data,
    selectedConfig,
    configs: $configs,
    sheets: $sheets,
    selectedConfigId: $selectedConfigId,
  })

  let scenes = [];
  $: {
    if (data && data.length > 0 && data[0]?.length > 0) {
      let newScenes = [];
      for (let i = selectedConfig.scenesStartCol ?? ddp.scenesStartCol; i < data[0].length; i++) {
        let mics = {};
        for (let j = selectedConfig.micsStartRow ?? ddp.micsStartRow; j < (selectedConfig.micsStartRow ?? ddp.micsStartRow) + 16; j++) {
          mics[data[j][parseInt(selectedConfig.micNumsCol ?? ddp.micNumsCol)]-1] = {
            actor: data[j][parseInt(selectedConfig.actorNamesCol ?? ddp.actorNamesCol)],
            character: data[j][i],
            active: data[j][i].trim() !== "" && data[j][i].trim().slice(2) !== "//",
          };
        }
        newScenes.push({
          notes: data[selectedConfig.notesRow ?? ddp.notesRow][i],
          name: data[selectedConfig.namesRow ?? ddp.namesRow][i],
          mics,
        });
      }
      scenes = newScenes;
    } else {
      scenes = [];
    }
  }

  let previewIndex = 0;
  let currentIndex = -1;

  function fire(index) {
    currentIndex = index;
    if (index === previewIndex) {
      previewIndex = index + 1;
      sceneSelector?.querySelectorAll("button")[index]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }

  $: sceneSelector?.querySelectorAll("button")[previewIndex]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  onMount(_=>{
    loading = loading.filter(item => item !== "Loading...");
  })
</script>

<main class:showingModal={$showingModal.length > 0}>
  <div class="top">
    <h1 style="font-weight: 100; opacity: 0.5;">{loading[0] || "miq"}</h1>
    <div class="horiz">
      <button>OSC/WS</button>
      <button>MIDI</button>
      <button on:click={(_) => ($showingModal = ["dbConfig"])}>Database</button>
      <select style="font-weight: 900;" bind:value={$selectedConfigId}>
        {#each ($configs || []) as item}
          <option value={item.id}>{item.name || "Untitled"}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="middle">
    <div class="sceneselector" bind:this={sceneSelector}>
      <div class="sceneProgress">
        <strong>{currentIndex+1}</strong>/{scenes.length}
        <!-- ({parseInt((previewIndex+1)/scenes.length*100)}%) -->
      </div>
      {#each scenes as scene, i}
        <button on:click={() => (previewIndex = i)} class:green={i === previewIndex && i !== currentIndex} class:red={i === currentIndex}>
          {scene.name}
        </button>
      {/each}
    </div>
    <div class="sceneview">
      <Scene scene={scenes[previewIndex]} --border-color="var(--green)" />
      <Scene scene={scenes[currentIndex]} live --border-color="var(--red)" />
    </div>
  </div>
  <div class="buttons">
    <button disabled={previewIndex < 1} on:click={(_) => previewIndex--}>Preview backwards</button>
    <button disabled={previewIndex > scenes.length - 1} on:click={(_) => previewIndex++}>Preview forwards</button>
    <button disabled={previewIndex === currentIndex+1} on:click={_=>previewIndex=currentIndex+1}>Preview reset</button>
    <button disabled={previewIndex > scenes.length - 1} class="red" on:click={(_) => fire(previewIndex)}>Fire next</button>
  </div>
</main>

<DbManager />

<style lang="scss">
  main {
    display: grid;
    grid-template-rows: 3em 1fr 4em;
    gap: 12px;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    transition: var(--modal-transition);
    &.showingModal {
      transform: scale(0.8);
      opacity: 0;
    }
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    button, select {
      font-size: 1.1em;
      font-weight: 300;
      strong {
        font-weight: 900;
      }
    }
  }
  .buttons {
    display: flex;
    align-items: stretch;
    gap: 12px;
    height: 100%;
    width: 100%;
    > * {
      flex: 1;
      font-size: 1.2em;
      font-weight: bold;
    }
  }
  .middle {
    display: grid;
    align-items: stretch;
    gap: 24px;
    grid-template-rows: auto 1fr;
    overflow: hidden;
  }
  .sceneselector {
    display: flex;
    flex-direction: row;
    gap: 6px;
    overflow: auto;
    width: 100%;
    > * {
      flex: 0 0 auto;
      height: 3em;
      padding: 0.5em 0.75em;
      font-weight: bold;
      transition: 120ms;
    }
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    padding-bottom: 6px;
    &::-webkit-scrollbar-thumb {
      background: var(--fg);
      border-radius: 6px;
    }
    .sceneProgress {
      padding: 0 12px;
      padding-right: 24px;
      background: linear-gradient(to left, transparent 0%, var(--bg) 12px, var(--bg) 100%);
      height: 100%;
      display: flex;
      align-items: center;
      position: sticky;
      left: 0;
      font-weight: 200;
      font-size: 1.5em;
    }
  }
  .sceneview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    overflow: auto;
  }
</style>
