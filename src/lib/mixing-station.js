import { get } from "svelte/store";
import { makeToast, msConfig, currentConnectionStatus } from "./stores";
import { BaseConnection } from "./baseConnection";

export class MixingStationConnection extends BaseConnection {
	client;
	nameCharacterLimit = 0; // none to start
	_pingInterval;

	constructor() {
		super();

		const config = MixingStationConnection.getCompleteConfig();

		this.client = new WebSocket(`ws${config.secure ? "s" : ""}://${config.host}:${config.port}/`);
		if (window) window.msClient = this.client;

		this.client.onopen = () => {
			currentConnectionStatus.set({
				connected: true,
				address: new URL(this.client.url).host,
				reconnecting: false,
			});

			const testKey = "ch.0.cfg.name";
			this.client.onmessage = (e) => {
				try {
					const res = JSON.parse(e.data);

					// not connected to mixer or something else bad
					if (res.error) {
						makeToast("Mixing Station WS Error", res.error, "error");
						if (res.error.includes("not available") || res.error.includes("not started")) this.close(); // graceful close (no more mixer for the forseeable future) so no auto reconnect
					}

					if (this.nameCharacterLimit === 0)
						res?.body?.definitions?.[testKey]?.constraints?.forEach((c) => {
							const trim = "Max length ";
							if (!c.startsWith(trim)) return;
							const num = parseInt(c.slice(trim.length));
							if (isFinite(num)) {
								this.nameCharacterLimit = num;
							}
						});
				} catch (err) {}
			};
			// get string length now as it's dependent on the console, also verifies the console is ok
			this.client.send(
				JSON.stringify({
					path: `/console/data/definitions/${testKey}`,
					method: "GET",
					body: null,
				})
			);

			// mixing station will disconnect exactly 30 seconds after the last message
			// so send a generic ping message to keep it alive
			const ping = () => {
				this.client.send(
					JSON.stringify({
						path: "/app/ui/selectedChannel",
						method: "GET",
						body: null,
					})
				);
			};
			this._pingInterval = setInterval(ping, 28000);
		};
		this.client.onclose = () => {
			if (this._pingInterval) this._pingInterval = clearInterval(this._pingInterval);
			this._onSocketClose();
		};
		this.client.onerror = (event) => {
			// let onclose handle close
			if (event?.target?.readyState !== 3) makeToast("Mixing Station WS Error", "", "error");
		};
	}

	_sendMessage(channel, path, value) {
		this.client.send(
			JSON.stringify({
				path: `/console/data/set/ch.${channel}.${path}/val`,
				method: "POST",
				body: { value },
			})
		);
	}

	_fireChannel(channel, active, name) {
		channel -= 1; // 0 indexed in api

		this._sendMessage(channel, "mix.on", active);
		if (this.nameCharacterLimit) name = name.substr(0, this.nameCharacterLimit);
		// mixing station won't accept forward slash or pipe even though sq does, so replace with something close enough
		this._sendMessage(channel, "cfg.name", name.replace(/[\/\|]/g, "\\"));
		// todo: different colors for different mixers? (not high priority)
		this._sendMessage(channel, "cfg.color", active ? 4 : 1);
	}

	static getCompleteConfig() {
		const config = get(msConfig);
		return {
			...config,
			host: config.host || "localhost",
			port: config.port || 8080,
			secure: config.secure ?? false,
			autoReconnect: config.autoReconnect ?? false,
		};
	}

	close() {
		super.close();
		this.client.close();
	}
}
