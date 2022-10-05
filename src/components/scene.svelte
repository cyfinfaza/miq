<script>
	export let scene;
	export let live = false;
</script>

<div class="scene" class:live>
	<div class="mics">
		<h2>{scene ? scene.name : "--"}</h2>
		<div class="channels">
			{#each new Array(16) as _, i}
				<div class="channel" class:accent={scene?.mics[i]?.active}>
					<h3 style="font-weight: 400; text-overflow: clip;">{i+1}</h3>
					<div>
						<p style="font-size: 0.8em; font-weight: 200;">{scene?.mics[i]?.actor || ""}</p>
						<p style="font-size: 0.9em; font-weight: 600;">{scene?.mics[i]?.character || ""}</p>
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
		* {
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
	.accent {
		border-color: transparent;
	}
</style>