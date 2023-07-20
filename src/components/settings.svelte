<script>
	import Modal from "./modal.svelte";

	import { mqttConfig, mqttStatus } from "../lib/stores";
	import { connect, disconnect } from "../lib/mqtt";

	import { oscStatus, openOSC, closeOSC } from "../lib/osc";
	import { oscConfig } from "../lib/stores";
</script>

<Modal modalName="settings">
	<h1>Settings</h1>
	<details>
		<summary> MQTT </summary>
		<div class="verti" style="align-items: flex-start">
			<div class="verti" disabled={$mqttStatus.connected || null}>
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
					<p>
						Follow:
						<input type="checkbox" bind:checked={$mqttConfig.rx_preview} /> Preview
						<input type="checkbox" bind:checked={$mqttConfig.rx_live} /> Live
					</p>
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
	</details>
	<details>
		<summary> OSC/WS </summary>
		<div class="verti">
			<p>
				An OSC WebSocket proxy, such as <a href="https://www.npmjs.com/package/x32-proxy" target="_blank">x32-proxy</a>,
				is required to connect to a mixer.
			</p>
			<p>
				If you are using x32-proxy, use the following command to connect: <br />
				<code>x32-proxy --ws --target your.mixer.ip.address</code> <br />
				then, leaving the settings below blank, tap connect.
			</p>
			<div class="verti" disabled={$oscStatus.connected || null}>
				<p>Host: <input type="text" bind:value={$oscConfig.host} /></p>
				<p>Port: <input type="number" bind:value={$oscConfig.port} /></p>
				<p>Secure: <input type="checkbox" bind:checked={$oscConfig.secure} /></p>
			</div>
			<p>
				{#if $oscStatus.connected}
					<button class="green" on:click={closeOSC}>Connected (tap to disconnect)</button>
				{:else}
					<button class="red" on:click={openOSC}>Disconnected (tap to connect)</button>
				{/if}
			</p>
		</div>
	</details>
</Modal>

<style lang="scss">
	div[disabled] {
		opacity: 0.5;
		* {
			pointer-events: none;
			user-select: none;
		}
	}
	details[open] summary {
		font-weight: bold;
	}
	details {
		width: 100%;
	}
</style>
