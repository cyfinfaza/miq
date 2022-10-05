<script>
  import Modal from "./components/modal.svelte";
  import Scene from "./components/scene.svelte";
  import { showingModal, dataSourceConfig, selectedDataSourceId } from "./lib/stores";

  import Papa from "papaparse";
  import { onMount } from "svelte";

  const ddp = {
    notesRow: 0,
    namesRow: 1,
    micsStartRow: 2,
    micNumsCol: 0,
    actorNamesCol: 1,
    scenesStartCol: 2,
  };

  let loading = ["Loading..."];

  let sceneSelector;

  $: selectedDataSource = $dataSourceConfig.find((item) => item.id === $selectedDataSourceId);
  let data = [];

  function updateData() {
    loading = ["Populating scenes...", ...loading]
    if (selectedDataSource) {
      Papa.parse(`https://docs.google.com/spreadsheets/u/0/d/${selectedDataSource.sheetId}/export?format=csv`, {
        download: true,
        header: false,
        complete: function (results) {
          console.log(results);
          data = results.data;
          loading = loading.filter(item => item !== "Populating scenes...");
        },
      });
    }
  }

  let scenes = [];
  $: {
    if (data.length > 0 && data[0]?.length > 0) {
      let newScenes = [];
      for (let i = selectedDataSource.scenesStartCol ?? ddp.scenesStartCol; i < data[0].length; i++) {
        let mics = {};
        for (let j = selectedDataSource.micsStartRow ?? ddp.micsStartRow; j < (selectedDataSource.micsStartRow ?? ddp.micsStartRow) + 16; j++) {
          mics[data[j][parseInt(selectedDataSource.micNumsCol ?? ddp.micNumsCol)]-1] = {
            actor: data[j][parseInt(selectedDataSource.actorNamesCol ?? ddp.actorNamesCol)],
            character: data[j][i],
            active: data[j][i].trim() !== "" && data[j][i].trim().slice(2) !== "//",
          };
        }
        newScenes.push({
          notes: data[selectedDataSource.notesRow ?? ddp.notesRow][i],
          name: data[selectedDataSource.namesRow ?? ddp.namesRow][i],
          mics,
        });
      }
      scenes = newScenes;
    }
  }

  $: selectedDataSource && updateData();

  let previewIndex = 0;
  let currentIndex = -1;
  // let scenes = [
  //   {
  //     name: "1.1",
  //     notes: "This is a note",
  //     mics: {
  //       0: {
  //         actor: "Actor 0",
  //         character: "Character 0 asdfasdf",
  //         active: true,
  //       },
  //       1: {
  //         actor: "Actor 1",
  //         character: "Character 1",
  //         active: true,
  //       },
  //       2: {
  //         actor: "Actor 2",
  //         character: "Character 2",
  //         active: false,
  //       },
  //     },
  //   },
  //   {
  //     name: "1.2",
  //     notes: "some information\nsome more information\nafsdkjflaskjdfl ahsdlfkjahdsl asdjhflakjshdf llakjsd fhlakj sd",
  //     mics: {
  //       0: {
  //         actor: "Actor 0",
  //         character: "Character 0",
  //         active: false,
  //       },
  //       1: {
  //         actor: "Actor 1",
  //         character: "Character 1.2",
  //         active: true,
  //       },
  //       2: {
  //         actor: "Actor 2",
  //         character: "Character 2",
  //         active: true,
  //       },
  //     },
  //   },
  // ];

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
      <button on:click={(_) => ($showingModal = ["dataSourceConfig"])}>Data Source: <strong>{selectedDataSource?.name || "Not Configured"}</strong></button>
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

<Modal modalName="dataSourceConfig">
  <h1>Data Source Config</h1>
  <p>Data is sourced from properly formatted Google Sheets. Ensure sheets are publicly available. Sheet ID can be found in the URL.</p>
  {#each $dataSourceConfig as source}
    <div class="horiz" style="flex-wrap: wrap; border-left: 2px solid var(--fg); padding-left: 12px;">
      <button on:click={(_) => ($selectedDataSourceId = source.id)} class:accent={source.id === $selectedDataSourceId}>{source.id === $selectedDataSourceId ? "Selected" : "Select"}</button>
      <input type="text" placeholder="Name" bind:value={source.name} />
      <input type="text" placeholder="Google Sheets ID" bind:value={source.sheetId} />
      <input type="number" placeholder="Notes R" bind:value={source.notesRow} />
      <input type="number" placeholder="Names R" bind:value={source.namesRow} />
      <input type="number" placeholder="Mics SR" bind:value={source.micsStartRow} />
      <input type="number" placeholder="Mic #s C" bind:value={source.micNumsCol} />
      <input type="number" placeholder="Actors C" bind:value={source.actorNamesCol} />
      <input type="number" placeholder="Scenes SC" bind:value={source.scenesStartCol} />
      <button class="red" on:click={(_) => ($dataSourceConfig = $dataSourceConfig.filter((item) => item.id !== source.id))}>Delete</button>
    </div>
  {/each}
  <button
    on:click={(_) => {
      $dataSourceConfig = [
        ...$dataSourceConfig,
        {
          id: parseInt(Math.random() * 90000 + 10000).toString(36),
          name: "",
          sheetId: "",
        },
      ];
    }}>New source</button
  >
</Modal>

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
    button {
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
  }
</style>
