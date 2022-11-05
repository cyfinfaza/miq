import { writable } from "svelte/store";

export const showingModal = writable([]);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    showingModal.set([]);
  }
});

export const dataSourceConfig = writable(JSON.parse(localStorage.getItem("dataSourceConfig")) || []);
dataSourceConfig.subscribe((value) => localStorage.setItem("dataSourceConfig", JSON.stringify(value)));

export const selectedDataSourceId = writable(JSON.parse(localStorage.getItem("selectedDataSource")) || null);
selectedDataSourceId.subscribe((value) => localStorage.setItem("selectedDataSource", JSON.stringify(value)));

export const selectedConfigId = writable(JSON.parse(localStorage.getItem("selectedConfig")) || null);
selectedConfigId.subscribe((value) => localStorage.setItem("selectedConfig", JSON.stringify(value)));