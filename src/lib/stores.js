import { writable, get } from "svelte/store";

export const showingModal = writable([]);

window?.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		showingModal.set([]);
	}
});

function localStorageWritable(key, defaultValue) {
	const store = writable(JSON.parse(localStorage.getItem(key)) || defaultValue);
	store.subscribe((value) => localStorage.setItem(key, JSON.stringify(value)));
	return store;
}

export const selectedConfigId = localStorageWritable("selectedConfig", null);

export const mqttConfig = localStorageWritable("mqttConfig", {
	mode: "tx",
	rx_preview: true,
	rx_live: false,
});
export const mqttStatus = writable({ connected: false, address: null });

export const connectionMode = localStorageWritable("connectionMode", "osc");
export const oscConfig = localStorageWritable("oscConfig", {});
export const msConfig = localStorageWritable("msConfig", {});

/** @type {import("svelte/store").Writable<import("./connection").BaseConnection>} */
export const currentConnection = writable(null);
export const currentConnectionStatus = writable({ connected: false, address: null });

// disconnect when switching modes
let lastConnectionMode = null;
connectionMode.subscribe((mode) => {
	if (mode !== lastConnectionMode) {
		lastConnectionMode = mode;
		get(currentConnection)?.close();
	}
});

export const toasts = writable([]);
/** @param {"info"|"warn"|"error"} type */
export function makeToast(title, message, type = "info") {
	toasts.update((toasts) => {
		toasts.push({ title, message, type, id: Date.now() });
		return toasts;
	});
}

if (window) window.makeToast = makeToast;
