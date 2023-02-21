<script>
  export let scene;
  export let live = false;
</script>

<div class="scene" class:live>
  <div class="mics">
    <h2>{scene ? scene.name : "--"}</h2>
    <div class="channels">
      {#each Object.keys(scene?.mics || {}) as i}
        <div class="channel" class:accent={scene?.mics[i]?.active} class:dne={!scene?.mics[i]}>
          <h3 style="font-weight: 400; text-overflow: clip;">{i}</h3>
          <div>
            <p style="font-size: 0.8em; font-weight: 200;" class="actorLabel" class:actorChanging={scene?.mics[i]?.switchingFrom}>
              {#if scene?.mics[i]?.switchingFrom}
                {scene?.mics[i]?.switchingFrom || ""}
                <br /> <strong>&rarr; {scene?.mics[i]?.actor || ""}</strong>
              {:else}
                {scene?.mics[i]?.actor || ""}
              {/if}
            </p>
            <p style="font-size: 0.9em; font-weight: 600;">
              {scene?.mics[i]?.character || ""}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div style="min-width: 0;">
    <h3 style="margin-block: 0.2em;">Notes</h3>
    <p style="overflow: auto">{scene?.notes || ""}</p>
  </div>
</div>

<style lang="scss">
  .scene {
    display: grid;
    grid-template-columns: 4fr 1fr;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid var(--green);
    opacity: var(--opacity);
  }
  .mics {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .scene.live {
    border-color: var(--red);
  }
  .channels {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(8, 1fr);
  }
  .channel {
    height: 4em;
    border-radius: 0.5em;
    padding: 0.5em;
    border: 2px solid var(--fg);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    overflow: hidden;
    transition: 120ms;
    > h3,
    p {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }

  .actorLabel {
    border: 4px solid transparent;
    border-radius: 4px;
    position: relative;
    top: 4px;
    right: 4px;
    width: 100%;
    &.actorChanging {
      transition: 360ms;
      transition-delay: 120ms;
      background: #fe0;
      color: #000;
    }
  }

  .accent {
    border-color: transparent;
  }
  .dne {
    opacity: 0.2;
  }
</style>
