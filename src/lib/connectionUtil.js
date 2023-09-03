import { get, writable } from "svelte/store";
import { connectionMode, currentConnection, currentConnectionStatus, oscConfig, msConfig } from "./stores";
import { OSCConnection } from "./osc";
import { MixingStationConnection } from "./mixing-station";

const updateAddress = () => {
	const currentAddress = get(currentConnectionStatus).address;
	if (currentAddress) return connectionAddress.set(currentAddress);

	const mode = get(connectionMode);
	const config =
		mode === "osc"
			? OSCConnection.getCompleteConfig()
			: mode === "ms"
			? MixingStationConnection.getCompleteConfig()
			: null;
	return connectionAddress.set(config?.host + ":" + config?.port);
};
export const connectionAddress = writable(null);

// update the probable next address anytime any connection stuff changes
currentConnectionStatus.subscribe(updateAddress);
connectionMode.subscribe(updateAddress);
oscConfig.subscribe(updateAddress);
msConfig.subscribe(updateAddress);

export function newConnection() {
	const mode = get(connectionMode);
	currentConnection.set(mode === "osc" ? new OSCConnection() : mode === "ms" ? new MixingStationConnection() : null);
}
