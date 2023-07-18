import osc from "osc-js";
import { writable } from "svelte/store";

export const oscStatus = writable({ connected: false, address: null });

// var socket = new WebSocket("ws://127.0.0.1:8080");
// // Connection opened
// socket.addEventListener("open", function (event) {
// 	console.log("Connected to the WS Server!");
// });

// // Connection closed
// socket.addEventListener("close", function (event) {
// 	console.log("Disconnected from the WS Server!");
// });

// // Listen for messages
// socket.addEventListener("message", function (event) {
// 	console.log("rx: ", event.data);
// 	const msg = new osc.Message();
// 	msg.unpack(event.data);
// 	console.log(msg);
// });

let client = new osc({ plugin: new osc.WebsocketClientPlugin() });

client.on("*", (message) => {
	console.log(message.args);
});

client.on("open", () => {
	oscStatus.set({
		connected: true,
		address: client.options.plugin.options.host,
	});
});
client.on("close", () => {
	oscStatus.set({
		connected: false,
		address: null,
	});
});

client.open();

// window.socket = socket;
window.osc = osc;
window.client = client;

export function onFireOsc(scene) {
	console.log("onFireOsc", scene);

	// if (client.status() !== osc.STATUS.IS_OPEN) {
	// 	console.warn("not firing, osc not connected");
	// 	return;
	// }

	if (scene?.mics) {
		Object.keys(scene.mics).forEach((channel) => {
			let mic = scene.mics[channel];
			channel = String(channel).padStart(2, "0");
			if (mic) {
				console.log("sent osc message");
				client.send(
					new osc.Message(`/ch/${channel}/mix/on`, mic.active ? 780 : 0)
				);
				client.send(
					new osc.Message(`/ch/${channel}/config/color`, mic.active ? 6 : 1)
				);
				client.send(
					new osc.Message(
						`/ch/${channel}/config/name`,
						mic.character.startsWith("#")
							? mic.actor
							: mic.character || mic.actor
					)
				);
			}
		});
	}
}

export function openOSC() {
	client.open();
}

export function closeOSC() {
	client.close();
}
