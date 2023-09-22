<script>
	import Modal from "./modal.svelte";

	import { mqttConfig, mqttStatus } from "../lib/stores";
	import { connect, disconnect } from "../lib/mqtt";

	import { newConnection } from "../lib/connectionUtil";
	import { connectionMode, currentConnection, currentConnectionStatus, oscConfig, msConfig } from "../lib/stores";
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
		<summary>Mixer Connection</summary>
		<div class="verti">
			<p>
				Connection mode: <select disabled={$currentConnectionStatus.connected} bind:value={$connectionMode}>
					<option value="osc">OSC/WS</option>
					<option value="ms">Mixing Station/WS</option>
				</select>
				{#if $currentConnectionStatus.connected}(disconnect to edit){/if}
			</p>

			{#if $connectionMode === "osc"}
				<p>
					An OSC WebSocket proxy, such as <a href="https://www.npmjs.com/package/x32-proxy" target="_blank">x32-proxy</a
					>, is required to connect to a mixer.
				</p>
				<p>
					If you are using x32-proxy, use the following command to connect: <br />
					<code>x32-proxy --ws --target your.mixer.ip.address</code> <br />
					then, leaving the settings below blank, tap connect.
				</p>
				<div class="verti" disabled={$currentConnectionStatus.connected || null}>
					<p>Host: <input type="text" bind:value={$oscConfig.host} /></p>
					<p>Port: <input type="number" bind:value={$oscConfig.port} /></p>
					<p>Secure: <input type="checkbox" bind:checked={$oscConfig.secure} /></p>
					<p>Resend cues (0≤n≤4): <input type="number" bind:value={$oscConfig.resendNum} min="0" max="4" /> times</p>
					<p>Enable Live Metering?: <input type="checkbox" bind:checked={$oscConfig.liveMetersEnabled} /></p>
				</div>
			{:else if $connectionMode === "ms"}
				<p>
					<a href="https://mixingstation.app/" target="_blank">Mixing Station</a> includes a common
					<a href="https://mixingstation.app/ms-docs/integrations/apis/" target="_blank">API</a>
					for controlling mixers. It needs to be enabled under <code>Global Settings > API: HTTP REST > Enable.</code>
				</p>
				<div class="verti" disabled={$currentConnectionStatus.connected || null}>
					<p>Host: <input type="text" bind:value={$msConfig.host} /></p>
					<p>Port: <input type="number" bind:value={$msConfig.port} /></p>
					<p>Secure: <input type="checkbox" bind:checked={$msConfig.secure} /></p>
					<p>Resend cues (0≤n≤4): <input type="number" bind:value={$msConfig.resendNum} min="0" max="4" /> times</p>
				</div>
			{/if}
			<p>
				{#if $currentConnectionStatus.connected}
					<button class="green" on:click={$currentConnection.close()}>Connected (tap to disconnect)</button>
				{:else}
					<button class="red" on:click={newConnection}>Disconnected (tap to connect)</button>
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
