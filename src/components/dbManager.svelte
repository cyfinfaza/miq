<script>
  import Modal from "./modal.svelte";
  import { db, configs, sheets } from "../lib/db";
  import Papa from "papaparse";
  import { onMount } from "svelte";
  import {ddp} from "../lib/db"

  let mode = "configs";
  let editing = {};

  async function addNew() {
    const newOne = await db[mode].add({name: ""});
    console.log(newOne)
    editing = {mode, data:{id:newOne, ...ddp}};
  }

  async function update(toUpdate) {
    if (toUpdate.mode && toUpdate.data) {
      await db[toUpdate.mode].update({ id: toUpdate.data.id }, toUpdate.data);
    }
  }

  function downloadCurrent() {
    if (editing?.data?.sheetId && editing?.data?.sheetId !== "") {
      Papa.parse(
        `https://docs.google.com/spreadsheets/u/0/d/${editing.data.sheetId}/export?format=csv`,
        {
          download: true,
          header: false,
          complete: async function (results) {
            console.log(results);
            let data = results.data;
            editing = { ...editing, data: {...editing.data, table: data, lastFetched: new Date()} };
            console.log(editing)
          },
        }
      );
    }
  }

  async function deleteCurrent() {
    if (editing?.data?.id) {
      await db[editing.mode].delete(editing.data.id);
      editing = {mode, data: { configs: $configs, sheets: $sheets }[mode][1]} || {};
    }
  }

  $: update(editing);
  //   $: editing = {
  //     mode,
  //     data: { configs: $configs, sheets: $sheets }[mode]?.find(
  //       (item) => item.id === editing.data?.id
  //     ),
  //   };
  onMount(_=>{
    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete") {
        deleteCurrent();
      }
    });
  })

  $: if (editing.mode != mode) editing = {}
</script>

<Modal modalName="dbConfig">
  <h1>Database Config</h1>
  <p>
    <select bind:value={mode}>
      <option value="sheets">Downloaded Sheets</option>
      <option value="configs">Configurations</option>
    </select>
    <button on:click={addNew}>Add New</button>
  </p>
  <div class="horiz" style="width: 100%; height: 400px">
    <div class="verti itemList">
      {#each { configs: $configs, sheets: $sheets }[mode] || [] as item, i}
        <button
          class="item"
          class:untitled={item.name === ""}
          class:selected={editing?.data?.id === item.id}
          on:click={() => (editing = { mode, data: item })}
        >
          {item.name || "Untitled"}
        </button>
      {/each}
    </div>
    <div class="itemConfig verti">
      {#if typeof editing?.data?.id === "number"}
        <p>
          Name: <input type="text" bind:value={editing.data.name} />
          <button class="red" on:click={deleteCurrent}>Delete Entry</button>
        </p>
        {#if editing?.mode === "sheets"}
          <p>
            Google Sheets ID: <input
              type="text"
              placeholder="44 characters"
              bind:value={editing.data.sheetId}
            />
          </p>
          <p>
            Last fetched: {editing.data.lastFetched || "Never"}
            <button on:click={downloadCurrent}>Fetch Now</button>
          </p>
          {#if editing.data.table}
            <div style="width: 100%; display: flex; overflow: auto;">
              <table style="flex:1; width: 100%; overflow: auto;">
                {#each editing.data.table as row}
                  <tr>
                    {#each row as cell}
                      <td>{cell}</td>
                    {/each}
                  </tr>
                {/each}
              </table>
            </div>
          {/if}
        {:else if editing?.mode === "configs"}
          <p>
            Google Sheet: 
            <select bind:value={editing.data.sheetId}>
              {#each $sheets as sheet}
                <option value={sheet.id} class:untitled={sheet.name === ""}>{sheet.name || "Untitled"}</option>
              {/each}
            </select>
          </p>
          <p>Notes Row: <input type="number" bind:value={editing.data.notesRow}></p>
          <p>Names Row: <input type="number" bind:value={editing.data.namesRow}></p>
          <p>Mics Start Row: <input type="number" bind:value={editing.data.micsStartRow}></p>
          <p>Mic Numbers Column: <input type="number" bind:value={editing.data.micNumsCol}></p>
          <p>Actor Names Column: <input type="number" bind:value={editing.data.actorNamesCol}></p>
          <p>Scenes Start Column: <input type="number" bind:value={editing.data.scenesStartCol}></p>
        {/if}
      {/if}
    </div>
  </div>
</Modal>

<style lang="scss">
  .itemList {
    width: 200px;
    height: 100%;
    overflow-y: auto;
    gap: 0;
    > button {
      padding: 4px;
      padding-block: 8px;
      border-radius: 0;
      border: none;
      text-align: left;
      &.selected {
        background-color: var(--accent);
        color: var(--accent-text);
      }
      &.untitled {
        color: var(--text-dimmed);
        font-style: italic;
      }
    }
    border: 2px solid var(--fg);
    border-radius: 4px;
  }
  .itemConfig {
    // width: 500px;
    flex: 1;
    height: 100%;
    width: 100%;
    overflow-y: auto;
    gap: 8px;
  }
  td {
    white-space: nowrap;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
