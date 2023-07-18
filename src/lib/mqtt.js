import Paho from "paho-mqtt";
import { get, writable } from "svelte/store";
import { makeToast, mqttConfig, mqttStatus } from "./stores";

/** @type {Paho.Client} */
export let mqttClient;

/** @type {import("svelte/store").Writable<Paho.Message|null>} */
export let incomingMessage = writable(null);

export function getCompleteMqttConfig(config) {
	return {
		...config,
		port: config.port || 443,
		basepath: config.basepath || "/ws",
		useAuth: config.useAuth ?? false,
		username: config.username,
		password: config.password,
	};
}

export function connect() {
	const config = getCompleteMqttConfig(get(mqttConfig));
	if (!config || !config.host || !config.topic) {
		makeToast("Bad MQTT Config", "Provide at least a host and topic", "info");
		return;
	}
	const clientID = "miq-" + Math.random().toString(16);
	mqttClient = new Paho.Client(config.host, config.port, config.basepath, clientID);
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
	if (config.useAuth) {
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
		makeToast("MQTT connection failed", e.errorMessage, "error");
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
