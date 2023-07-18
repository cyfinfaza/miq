import "./app.scss";
import App from "./App.svelte";

const app = new App({
	target: document.body,
});

export default app;

// if (navigator.serviceWorker.controller) {
// 	console.log("Active service worker found");
// } else {
// 	navigator.serviceWorker
// 		.register("service-worker.js", {
// 			scope: "/",
// 		})
// 		.then(function (reg) {
// 			console.log("Service worker registered");
// 		});
// }
