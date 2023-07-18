import Paho from "paho-mqtt";
import { get, writable } from "svelte/store";
import { mqttConfig, mqttStatus } from "./stores";

export let mqttClient;

export let incomingMessage = writable(null);

export function connect() {
	const config = get(mqttConfig);
	if (!config || !config.host || !config.topic) {
		return;
	}
	const clientID = "miq-" + Math.random().toString(16);
	mqttClient = new Paho.Client(config.host, config.port || 443, config.basepath || "/ws", clientID);
	let willMessage = new Paho.Message(new ArrayBuffer(0));
	willMessage.destinationName = "miq/" + config.topic + "/config";
	/** @type {Paho.ConnectionOptions} */
	const connectionOptions = {
		onSuccess: onConnect,
		onFailure: onFailure,
		// onConnectionLost: onDisconnect,
		useSSL: true,
		willMessage: willMessage,
		keepAliveInterval: 5,
		reconnect: true,
		// mqttVersion: 3,
		// uris: ["wss://mq03.cy2.me/mqtt"],
	};
	if (config.useAuth ?? false) {
		connectionOptions.userName = config.username;
		connectionOptions.password = config.password;
	} else {
		delete connectionOptions.userName;
		delete connectionOptions.password;
	}
	mqttClient.onMessageArrived = onMessageArrived;
	mqttClient.connect(connectionOptions);
	function onFailure(e) {
		console.error("MQTT: Connection failed", e);
		mqttStatus.update((_) => ({ connected: false, address: null, mode: "disabled" }));
		// setTimeout(() => {
		// 	client.connect(connectionOptions);
		// }, 2000);
	}
	// function onDisconnect() {
	// 	console.log("MQTT: Disconnected");
	// 	mqttStatus.update((_) => ({ connected: false, address: null }));
	// }
	function onConnect() {
		console.log("MQTT: Connected as " + clientID);
		mqttStatus.update((_) => ({ connected: true, address: config.host, mode: "disabled" }));
		mqttClient.subscribe("miq/" + config.topic + "/#");
	}
	function onMessageArrived(message) {
		console.log("MQTT: Message arrived", message);
		incomingMessage.update((_) => message);
	}
}

export function disconnect() {
	mqttClient && mqttClient.disconnect();
	mqttStatus.update((_) => ({ connected: false, address: null, mode: "disabled" }));
}
