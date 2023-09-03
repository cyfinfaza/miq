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
			currentConnectionStatus.set({ connected: false, address: null });
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

	onFire(scene) {
		// if (this.client.status() !== osc.STATUS.IS_OPEN) {
		// 	console.warn("not firing, osc not connected");
		// 	return;
		// }

		if (scene?.mics) {
			const sendNum = Math.round(Math.min(Math.max(get(oscConfig).resendNum, 0), 4)) + 1;
			console.log("sending", sendNum, "times");
			for (let sends = 0; sends < sendNum; sends++) {
				Object.keys(scene.mics).forEach((channel) => {
					let mic = scene.mics[channel];
					channel = String(channel).padStart(2, "0");
					if (mic) {
						console.log("sent osc message");
						this.client.send(new osc.Message(`/ch/${channel}/mix/on`, mic.active ? 780 : 0));
						this.client.send(new osc.Message(`/ch/${channel}/config/color`, mic.active ? 6 : 1));
						this.client.send(
							new osc.Message(
								`/ch/${channel}/config/name`,
								mic.character.startsWith("#") ? mic.actor : mic.character || mic.actor
							)
						);
					}
				});
			}
		}
	}

	static getCompleteConfig() {
		const config = get(oscConfig);
		return {
			...config,
			host: config.host || "localhost",
			port: config.port || 8080,
			secure: config.secure ?? false,
		};
	}

	close() {
		this.client.close();
		clearInterval(this.liveRequestInterval);
	}
}
