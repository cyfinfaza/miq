import osc from "osc-js";
import { get, writable } from "svelte/store";
import { makeToast, oscConfig, currentConnectionStatus } from "./stores";
import { BaseConnection } from "./baseConnection";

export const channelMeters = writable([]);

export class OSCConnection extends BaseConnection {
	client;
	liveRequestInterval;

	constructor() {
		super();

		const config = OSCConnection.getCompleteConfig();

		this.client = new osc({
			plugin: new osc.WebsocketClientPlugin({
				host: config.host,
				port: config.port,
				secure: config.secure,
			}),
		});

		// if (window) window.oscClient = this.client;

		this.client.on("*", (message) => {
			console.log(message.address, message.args);
			if (message.address === "/meters/6") {
				let meters = new Float32Array(message.args[0].buffer.slice(16));
				console.log(meters[0]);
			} else if (message.address === "/meters/1") {
				let meters = new Float32Array(message.args[0].buffer.slice(24));
				channelMeters.set(meters.slice(0, 32));
			}
		});

		this.client.on("open", () => {
			currentConnectionStatus.set({
				connected: true,
				address: this.client.options.plugin.options.host,
			});
			const liveRequestFunction = () => {
				if (config.liveMetersEnabled) {
					this.client.send(new osc.Message("/meters", "/meters/1"));
				}
			};
			liveRequestFunction();
			this.liveRequestInterval = setInterval(liveRequestFunction, 5000);
		});
		this.client.on("close", () => {
			this._onSocketClose();
			clearInterval(this.liveRequestInterval);
		});
		this.client.on("error", (error) => {
			console.error("OSC Error", error);
			makeToast("OSC Error", "", "error");
			currentConnectionStatus.set({ connected: false, address: null });
			clearInterval(this.liveRequestInterval);
		});
		this.client.open();
		// try {
		// } catch (error) {
		// 	makeToast("Error opening OSC", error, "error");
		// }
	}

	_fireChannel(channel, active, name) {
		this.client.send(new osc.Message(`/ch/${channel}/mix/on`, active ? 780 : 0));
		this.client.send(new osc.Message(`/ch/${channel}/config/color`, active ? 6 : 1));
		this.client.send(new osc.Message(`/ch/${channel}/config/name`, name));
	}

	static getCompleteConfig() {
		const config = get(oscConfig);
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
		clearInterval(this.liveRequestInterval);
	}
}
