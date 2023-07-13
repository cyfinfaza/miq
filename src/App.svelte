<script>
	import Modal from "./components/modal.svelte";
	import Scene from "./components/scene.svelte";
	import {
		showingModal,
		dataSourceConfig,
		selectedDataSourceId,
		selectedConfigId,
		mqttStatus,
		mqttConfig,
	} from "./lib/stores";
	import { onFireOsc, oscStatus, openOSC, closeOSC } from "./lib/osc";

	import Papa from "papaparse";
	import { onMount, tick } from "svelte";
	import DbManager from "./components/dbManager.svelte";

	import { ddp, loadExternalConfig } from "./lib/db";

	import { configs, sheets } from "./lib/db";
	import osc from "osc-js";
	import MqttConfig from "./components/mqttConfig.svelte";
	import { incomingMessage, mqttClient } from "./lib/mqtt";

	let loading = ["Loading..."];

	let miniMode = false;

	/** @type {HTMLDivElement} */
	let sceneSelector;

	let selectedConfig = null;
	$: selectedConfig =
		($configs || []).find((config) => config.id === $selectedConfigId) || {};
	let data = [];
	$: data =
		selectedConfig?.table ||
		(selectedConfig.sheetId
			? $sheets.find((sheet) => sheet.id === selectedConfig.sheetId).table
			: []);

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
	});

	let scenes = [];
	let historyState = history.state;
	$: if (scenes.length && scenes[previewIndex]?.name) {
		history.replaceState(scenes[previewIndex].name, "");
	}
	$: {
		const config = {
			notesRow: parseInt(selectedConfig.notesRow ?? ddp.notesRow),
			namesRow: parseInt(selectedConfig.namesRow ?? ddp.namesRow),
			flagsRow: parseInt(selectedConfig.flagsRow ?? ddp.flagsRow),
			micsStartRow: parseInt(selectedConfig.micsStartRow ?? ddp.micsStartRow),
			micNumsCol: parseInt(selectedConfig.micNumsCol ?? ddp.micNumsCol),
			actorNamesCol: parseInt(
				selectedConfig.actorNamesCol ?? ddp.actorNamesCol
			),
			scenesStartCol: parseInt(
				selectedConfig.scenesStartCol ?? ddp.scenesStartCol
			),
		};
		if (data && data.length > 0 && data[0]?.length > 0) {
			let newScenes = [];
			let actorMicPairs = {};
			function generateActorMicPairs(col) {
				for (let j = config.micsStartRow; j < data.length; j++) {
					const micNum = parseInt(data[j][col]);
					if (micNum !== NaN && micNum > 0) {
						actorMicPairs[micNum] = {
							row: j,
							actor: data[j][config.actorNamesCol],
						};
					}
				}
			}
			generateActorMicPairs(config.micNumsCol);
			for (let i = config.scenesStartCol; i < data[0].length; i++) {
				if (data[config.flagsRow][i].includes("MIC_CHANGE")) {
					generateActorMicPairs(i);
					continue;
				}
				let mics = {};
				Object.keys(actorMicPairs).forEach((micNum) => {
					const pair = actorMicPairs[micNum];
					const j = pair.row;
					mics[micNum] = {
						actor: pair.actor,
						character: data[j][i],
						active:
							data[j][i].trim() !== "" &&
							data[j][i].trim().slice(0, 2) !== "//",
					};
				});
				newScenes.push({
					notes: data[config.notesRow][i],
					name: data[config.namesRow][i],
					mics,
				});
			}
			// backward pass
			let passMem = {};
			newScenes.reverse();
			newScenes.forEach((scene) => {
				Object.keys(scene.mics).forEach((micNum) => {
					if (passMem[micNum]?.actor && !scene.mics[micNum].active) {
						scene.mics[micNum].actor = passMem[micNum].actor;
					} else {
						passMem[micNum] = scene.mics[micNum];
					}
				});
			});
			// forward pass
			passMem = {};
			newScenes.reverse();
			newScenes.forEach((scene) => {
				Object.keys(scene.mics).forEach((micNum) => {
					if (
						passMem[micNum]?.switchingFrom &&
						!scene.mics[micNum].active &&
						passMem[micNum]?.switchingFrom !== scene.mics[micNum].actor
					) {
						scene.mics[micNum].switchingFrom = passMem[micNum].switchingFrom;
					} else {
						passMem[micNum] = { switchingFrom: scene.mics[micNum].actor };
					}
				});
			});
			scenes = newScenes;
			window.scenes = scenes;

			// try to restore from history state, first time only
			if (historyState !== null) {
				tick().then(() => {
					const index = scenes.findIndex(
						(scene) => scene.name === historyState
					);
					if (index !== -1) previewIndex = index;
					historyState = null;
				});
			}
		} else {
			scenes = [];
		}
	}

	let previewIndex = 0;
	let currentIndex = -1;
	let currentIndexConfigId = null;

	function fire(index) {
		currentIndex = index;
		currentIndexConfigId = $selectedConfigId;
		if (index === previewIndex) {
			previewIndex = index + 1;
			sceneSelector?.querySelectorAll("button")[index]?.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center",
			});
		}
		onFireOsc(scenes[currentIndex]);
	}

	$: sceneSelector?.querySelectorAll("button")[previewIndex]?.scrollIntoView({
		behavior: "smooth",
		block: "center",
		inline: "center",
	});

	$: if ($selectedConfigId !== currentIndexConfigId) {
		currentIndex = -1;
		currentIndexConfigId = null;
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			if (document.documentElement.requestFullscreen)
				document.documentElement.requestFullscreen();
			else document.documentElement.webkitRequestFullscreen();
		} else if (document.exitFullscreen) {
			if (document.fullscreenElement) document.exitFullscreen();
			else document.webkitExitFullscreen();
		}
	}

	$: {
		// console.log(selectedConfig, $mqttConfig.mode, $mqttStatus.connected)
		if (
			selectedConfig &&
			$mqttStatus.connected &&
			$mqttConfig.mode == "tx" &&
			$mqttConfig.topic
		) {
			let config = $configs?.find((item) => item.id === selectedConfig.id);
			const sheetId = $sheets?.find(
				(item) => item.id === config.sheetId
			)?.sheetId;
			if (sheetId) config = { ...config, sheetId };
			if (config.table) config = { ...config, table: undefined };
			console.log("sending config", config);
			mqttClient.publish(
				"miq/" + $mqttConfig.topic + "/config",
				JSON.stringify({ type: "config", data: config }),
				0,
				true
			);
			//set will message to clear
		}
	}

	$: {
		if (
			selectedConfig &&
			$mqttStatus.connected &&
			$mqttConfig.mode == "tx" &&
			$mqttConfig.topic
		) {
			// send current and preview index
			mqttClient.publish(
				"miq/" + $mqttConfig.topic,
				JSON.stringify({ type: "index", data: { currentIndex, previewIndex } }),
				0,
				false
			);
		}
	}

	let rxActive = false;
	$: rxActive = $mqttStatus.connected && $mqttConfig.mode == "rx";

	$: {
		if ($incomingMessage && $mqttStatus.connected && $mqttConfig.mode == "rx") {
			try {
				const data = JSON.parse($incomingMessage.payloadString);
				if (data.type === "config") {
					loadExternalConfig("mqtt", "MQTT", data.data);
					// $selectedConfigId = "mqtt";
				} else if (data.type === "index") {
					if ($mqttConfig.rx_preview) previewIndex = data.data.previewIndex;
					if ($mqttConfig.rx_live && data.data.currentIndex !== currentIndex) {
						fire(data.data.currentIndex);
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
	}

	onMount((_) => {
		loading = loading.filter((item) => item !== "Loading...");
		// check url for linked config
		try {
			const linkedConfig = JSON.parse(
				atob(new URL(window.location).searchParams.get("config"))
			);
			loadExternalConfig("linked", "Linked", linkedConfig);
		} catch (error) {}

		sceneSelector.addEventListener("wheel", (e) => {
			if (!e.deltaY || e.shiftKey) return;
			e.preventDefault(); // stop scrolling in another direction
			e.currentTarget.scrollLeft += (e.deltaY + e.deltaX) * 0.6;
			// sceneSelector.scrollBy({
			//   left: (e.deltaY + e.deltaX) * 3,
			//   behavior: "smooth",
			// });
		});
	});
</script>

<svelte:head>
	<title>{selectedConfig?.name || "miq"}</title>
</svelte:head>

<main
	class:showingModal={$showingModal.length > 0}
	class:hideButtons={rxActive && $mqttConfig.rx_preview}
	class:miniMode
>
	<div class="top">
		<h1 style="font-weight: 100; opacity: 0.5;">{loading[0] || "miq"}</h1>
		<div class="horiz" style="height: 100%; padding-block: 4px;">
			<button on:click={toggleFullscreen}>Fullscreen</button>
			<button on:click={() => (miniMode = !miniMode)}>Mini</button>
			<button
				on:click={(_) => ($showingModal = ["mqttConfig"])}
				class="connectionButton"
			>
				MQTT: <br />
				<span
					style:color={$mqttStatus.connected ? "var(--green)" : "var(--red)"}
				>
					<strong
						>{$mqttStatus.connected
							? $mqttConfig.mode + "/" + $mqttConfig.topic
							: "Disconnected"}</strong
					>
					<!-- {#if $oscStatus.address}
            ({$oscStatus.address})
          {/if} -->
				</span></button
			>
			<button
				on:click={$oscStatus.connected ? closeOSC() : openOSC()}
				class="connectionButton"
				style="position: relative;"
			>
				OSC/WS:
				<br />
				<span
					style:color={$oscStatus.connected ? "var(--green)" : "var(--red)"}
				>
					<strong>{$oscStatus.connected ? "Connected" : "Disconnected"}</strong>
					<!-- {#if $oscStatus.address}
            ({$oscStatus.address})
          {/if} -->
				</span>
				<span class="minilabel">tap to toggle connection</span>
			</button>
			<!-- <button>MIDI</button> -->
			{#if !rxActive}
				<button on:click={(_) => ($showingModal = ["dbConfig"])}
					>Database</button
				>
			{/if}
			<select
				style="font-weight: 900;"
				bind:value={$selectedConfigId}
				disabled={rxActive}
			>
				{#each $configs || [] as item}
					<option value={item.id}>{item.name || "Untitled"}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="middle">
		<div class="sceneselector" bind:this={sceneSelector}>
			<div class="sceneProgress">
				<strong>{currentIndex + 1}</strong>/{scenes.length}
				<!-- ({parseInt((previewIndex+1)/scenes.length*100)}%) -->
			</div>
			{#each scenes as scene, i}
				<button
					on:click={() => (previewIndex = i)}
					class:green={i === previewIndex && i !== currentIndex}
					class:red={i === currentIndex}
				>
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
		{#if !(rxActive && $mqttConfig.rx_preview)}
			<button disabled={previewIndex < 1} on:click={(_) => previewIndex--}
				>Preview backwards</button
			>
			<button
				disabled={previewIndex > scenes.length - 1}
				on:click={(_) => previewIndex++}>Preview forwards</button
			>
			<button
				disabled={previewIndex === currentIndex + 1}
				on:click={(_) => (previewIndex = currentIndex + 1)}
				>Preview reset</button
			>
		{/if}
		{#if !rxActive}
			<button
				disabled={previewIndex > scenes.length - 1}
				class="red"
				on:click={(_) => fire(previewIndex)}>Fire next</button
			>
		{/if}
	</div>
</main>

<DbManager />
<MqttConfig />

<style lang="scss">
	main {
		display: grid;
		grid-template-rows: 3em 1fr auto;
		gap: var(--spacing);
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		padding: var(--spacing);
		transition: var(--modal-transition);
		&.showingModal {
			transform: scale(0.8);
			opacity: 0;
		}
		&.hideButtons {
			grid-template-rows: 3em 1fr;
		}
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
		button,
		select {
			height: 100%;
			font-size: 1.1em;
			&.connectionButton {
				min-width: 130px;
				font-size: 1rem;
			}
			font-weight: 300;
			text-align: left;
			strong {
				font-weight: 900;
			}
		}
	}
	.buttons {
		display: flex;
		align-items: stretch;
		gap: var(--spacing);
		height: 4em;
		width: 100%;
		> * {
			flex: 1;
			font-size: 1.2em;
			font-weight: bold;
		}
		.hideButtons & {
			display: none;
		}
	}
	.middle {
		display: grid;
		align-items: stretch;
		gap: var(--spacing-required);
		grid-template-rows: auto 1fr;
		overflow: hidden;
	}
	.sceneselector {
		display: flex;
		flex-direction: row;
		// align-items: center;
		gap: 6px;
		overflow-y: hidden;
		overflow-x: auto;
		// width: 100%;
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
			background: linear-gradient(
				to left,
				transparent 0%,
				var(--bg) 12px,
				var(--bg) 100%
			);
			height: 100%;
			display: flex;
			align-items: center;
			// position: -webkit-sticky;
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
		gap: var(--spacing);
		overflow: auto;
	}
</style>
