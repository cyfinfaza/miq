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
		<summary>Mixer Connection</summary>
		<div class="verti">
			<p>MIQ requires a proxy to connect to a mixer. 2 proxy methods are supported:</p>
			<ul>
				<li>
					<a href="https://www.npmjs.com/package/x32-proxy" target="_blank" class="openNewIcon">x32-proxy</a>: For
					Behringer/Midas M32/X32 mixers only. Free, requires NodeJS.
				</li>
				<li>
					<a href="https://mixingstation.app/" target="_blank" class="openNewIcon">Mixing Station</a>: For several
					popular mixers. Paid, stanalone, only newer versions are supported.
				</li>
			</ul>

			<p>
				Connection mode: <select disabled={$currentConnectionStatus.connected} bind:value={$connectionMode}>
					<option value="osc">x32-proxy</option>
					<option value="ms">Mixing Station</option>
				</select>
				{#if $currentConnectionStatus.connected}(disconnect to edit){/if}
			</p>

			{#if $connectionMode === "osc"}
				<p>
					Once <a href="https://www.npmjs.com/package/x32-proxy" target="_blank">x32-proxy</a> is installed, use the
					following command to start up the proxy server: <br />
					<code>x32-proxy --ws --target your.mixer.ip.address</code> <br />
					then, leaving the settings below blank, tap connect.
				</p>
				<div class="verti" disabled={$currentConnectionStatus.connected || null}>
					<p>Host: <input type="text" bind:value={$oscConfig.host} /></p>
					<p>Port: <input type="number" bind:value={$oscConfig.port} /></p>
					<p>Secure: <input type="checkbox" bind:checked={$oscConfig.secure} /></p>
					<p>Resend cues (0≤n≤4): <input type="number" bind:value={$oscConfig.resendNum} min="0" max="4" /> times</p>
					<p>Enable Live Metering?: <input type="checkbox" bind:checked={$oscConfig.liveMetersEnabled} /></p>
					<p>Enable Auto Reconnect?: <input type="checkbox" bind:checked={$oscConfig.autoReconnect} /></p>
				</div>
			{:else if $connectionMode === "ms"}
				<p>
					On the start-up screen of <a href="https://mixingstation.app/" target="_blank">Mixing Station</a>, click the
					settings cog in the upper right corner, then enable the REST API:
					<strong>Global Settings &rarr; API: HTTP REST &rarr; Enable.</strong>
				</p>
				<p>
					Once you have enabled the API, <strong>first</strong> connect to your mixer through Mixing Station.
					<strong>Then,</strong> leaving the settings below blank, tap connect.
				</p>
				<div class="verti" disabled={$currentConnectionStatus.connected || null}>
					<p>Host: <input type="text" bind:value={$msConfig.host} /></p>
					<p>Port: <input type="number" bind:value={$msConfig.port} /></p>
					<p>Secure: <input type="checkbox" bind:checked={$msConfig.secure} /></p>
					<p>Resend cues (0≤n≤4): <input type="number" bind:value={$msConfig.resendNum} min="0" max="4" /> times</p>
					<p>Enable Auto Reconnect?: <input type="checkbox" bind:checked={$msConfig.autoReconnect} /></p>
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
