import { currentConnection, currentConnectionStatus, makeToast } from "../lib/stores";
import { get } from "svelte/store";

export class BaseConnection {
	constructor() {
		// reset status
		currentConnectionStatus.set({ connected: false, address: null });
	}

	onFire(scene) {
		if (scene?.mics) {
			const sendNum = Math.round(Math.min(Math.max(this.constructor.getCompleteConfig().resendNum || 0, 0), 4)) + 1;
			console.log("sending", sendNum, "times");

			for (let sends = 0; sends < sendNum; sends++) {
				Object.keys(scene.mics).forEach((channel) => {
					let mic = scene.mics[channel];
					if (mic)
						this._fireChannel(
							channel,
							mic.active,
							mic.character.startsWith("#") ? mic.actor : mic.character || mic.actor
						);
				});
			}
		}
	}

	/** triggered for each channel to update it on fire */
	_fireChannel(channel, active, name) {}

	static getCompleteConfig() {
		return {
			resendNum: 0,
		};
	}

	/** gracefully close, for when the user wants to close it */
	close() {
		currentConnection.set(null); // unregister self for handling fires
	}

	_onSocketClose() {
		currentConnectionStatus.set({ connected: false, address: null });

		// try autoreconnecting if we shouldn't have been disconnected
		if (get(currentConnection) === this) {
			const willAutoReconnect = this.constructor.getCompleteConfig().autoReconnect;
			makeToast(
				"Mixer disconnected unexpectedly",
				willAutoReconnect ? "Auto Reconnect is enabled" : "Auto Reconnect is disabled",
				"error"
			);
			if (willAutoReconnect)
				setTimeout(() => {
					// recheck incase config changed between now and then
					if (get(currentConnection) === this) {
						currentConnection.set(new this.constructor());
						makeToast("Mixer Reconnecting", "", "warn");
					}
					// delay to not ddos in case something goes horrifically wrong
				}, 1000);
		}
	}
}
