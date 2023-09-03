import { currentConnectionStatus } from "../lib/stores";

export class BaseConnection {
	constructor() {
		// reset status
		currentConnectionStatus.set({ connected: false, address: null });
	}

	onFire(scene) {}

	static getCompleteConfig() {
		return {};
	}

	close() {}
}
