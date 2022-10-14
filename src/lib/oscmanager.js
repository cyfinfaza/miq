import osc from "osc-js";

// var socket = new WebSocket('ws://127.0.0.1:8080');
// // Connection opened
// socket.addEventListener('open', function (event) {
//     console.log('Connected to the WS Server!')
// });

// // Connection closed
// socket.addEventListener('close', function (event) {
//     console.log('Disconnected from the WS Server!')
// });

// // Listen for messages
// socket.addEventListener('message', function (event) {
//     console.log('rx: ', event.data);
//     const msg = new osc.Message()
//     msg.unpack(event.data)
//     console.log(msg)
// });

let client = new osc({ plugin: new osc.WebsocketClientPlugin() });
client.open();

client.on("*", (message) => {
  console.log(message.args);
});

// window.socket = socket;
window.osc = osc;
window.client = client;

export function onFireOsc(scene) {
  [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
  ].forEach((channel) => {
    let mic = scene.mics[parseInt(channel) - 1];
    client.send(new osc.Message(`/ch/${channel}/mix/on`, mic.active ? 780 : 0));
    client.send(
      new osc.Message(`/ch/${channel}/config/color`, mic.active ? 6 : 1)
    );
    client.send(new osc.Message(`/ch/${channel}/config/name`, mic.character));
  });
}
