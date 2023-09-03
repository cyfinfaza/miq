import { get } from "svelte/store";
import { makeToast, msConfig, currentConnectionStatus } from "./stores";
import { BaseConnection } from "./baseConnection";

export class MixingStationConnection extends BaseConnection {
	client;

	constructor() {
		super();

		const config = MixingStationConnection.getCompleteConfig();

		this.client = new WebSocket(`ws${config.secure ? "s" : ""}://${config.host}:${config.port}/`);

		this.client.onopen = () => {
			currentConnectionStatus.set({
				connected: true,
				address: new URL(this.client.url).host,
			});
		};
		this.client.onclose = () => {
			currentConnectionStatus.set({ connected: false, address: null });
		};
		this.client.onerror = (error) => {
			makeToast("Mixing Station WS Error", "", "error");
			currentConnectionStatus.set({ connected: false, address: null });
		};

		// todo: validate connected mixer
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

	onFire(scene) {
		if (scene?.mics) {
			const sendNum = Math.round(Math.min(Math.max(get(msConfig).resendNum, 0), 4)) + 1;
			console.log("sending", sendNum, "times");
			for (let sends = 0; sends < sendNum; sends++) {
				Object.keys(scene.mics).forEach((channel) => {
					let mic = scene.mics[channel];
					channel = channel - 1; // 0 indexed in api
					if (mic) {
						this._sendMessage(channel, "mix.on", mic.active);
						this._sendMessage(
							channel,
							"cfg.name",
							(mic.character.startsWith("#") ? mic.actor : mic.character || mic.actor)
								// for sq, todo: change based on connected mixer
								.substr(0, 6)
						);
						this._sendMessage(channel, "cfg.color", mic.active ? 4 : 1);
					}
				});
			}
		}
	}

	static getCompleteConfig() {
		const config = get(msConfig);
		return {
			...config,
			host: config.host || "localhost",
			port: config.port || 8080,
			secure: config.secure ?? false,
		};
	}

	close() {
		this.client.close();
	}
}
