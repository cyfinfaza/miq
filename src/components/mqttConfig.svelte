<script>
	import Modal from "./modal.svelte";
	import { mqttConfig, mqttStatus } from "../lib/stores";
	import { connect, disconnect } from "../lib/mqtt";

	let newTxTopic = "";
	let newRxTopic = "";
</script>

<Modal modalName="mqttConfig">
	<h1>MQTT Config</h1>
	<div class="split" style="width: 100%">
		<div class="verti" style="align-items: flex-start">
			<div class="verti" class:disabled={$mqttStatus.connected}>
				<p>Host: <input type="text" bind:value={$mqttConfig.host} /></p>
				<p>Port: <input type="number" bind:value={$mqttConfig.port} /></p>
				<p>Basepath: <input type="text" bind:value={$mqttConfig.basepath} /></p>
				<p>Use Authentication? <input type="checkbox" bind:checked={$mqttConfig.useAuth} /></p>
				{#if $mqttConfig.useAuth}
					<p>Username: <input type="text" bind:value={$mqttConfig.username} /></p>
					<p>Password: <input type="password" bind:value={$mqttConfig.password} /></p>
				{/if}
				<p>Topic: <input type="text" bind:value={$mqttConfig.topic} /></p>
				<p>
					Mode: <select bind:value={$mqttConfig.mode}>
						<option value="tx">Transmit</option>
						<option value="rx">Receive</option>
					</select>
				</p>
				{#if $mqttConfig.mode === "rx"}
					<p>Follow: <input type="checkbox" bind:checked={$mqttConfig.rx_preview} /> Preview <input type="checkbox" bind:checked={$mqttConfig.rx_live} /> Live</p>
				{/if}
			</div>
			<p>
				{#if $mqttStatus.connected}
					<button class="green" on:click={disconnect}>Connected (tap to disconnect)</button>
				{:else}
					<button class="red" on:click={connect}>Disconnected (tap to connect)</button>
				{/if}
			</p>
		</div>
		<!-- <div class="verti" style="align-items: flex-end">
			{#if $mqttStatus.connected}
				<p>
					Mode: <select bind:value={$mqttStatus.mode}>
						<option value="tx">Transmit</option>
						<option value="rx">Receive</option>
						<option value="disabled">Disabled</option>
					</select>
				</p>
				{#if $mqttStatus.mode === "tx"}
					<p>
						Update TX Topic: <input type="text" bind:value={newTxTopic} /> <button on:click={() => ($mqttConfig.txTopic = newTxTopic)}>Update</button>
					</p>
					<h2>
						{$mqttConfig.txTopic || "No TX Topic"}
					</h2>
				{/if}
				{#if $mqttStatus.mode === "rx"}
					<p>
						Update RX Topic: <input type="text" bind:value={newRxTopic} /> <button on:click={() => ($mqttConfig.rxTopic = newRxTopic)}>Update</button>
					</p>
				{/if}
			{/if}
		</div> -->
	</div>
</Modal>

<style>
	div.disabled {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
