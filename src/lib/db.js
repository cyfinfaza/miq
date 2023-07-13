import Dexie from "dexie";
import { derived, writable } from "svelte/store";
import Papa from "papaparse";
import { selectedConfigId } from "./stores";

export const ddp = {
  notesRow: 0,
  namesRow: 1,
  flagsRow: 2,
  micsStartRow: 2,
  micNumsCol: 0,
  actorNamesCol: 1,
  scenesStartCol: 2,
};

export const db = new Dexie("miq");
db.version(1).stores({
  configs: "++id, name",
  sheets: "++id",
});

export const storedConfigs = Dexie.liveQuery(async () => await db.configs.toArray());
export const externalConfigs = writable({});

export const configs = derived([storedConfigs, externalConfigs], ([$storedConfigs, $externalConfigs]) => {
  return [...($storedConfigs || []), ...Object.keys($externalConfigs).map((id) => ({ ...$externalConfigs[id], id }))];
});

export const sheets = Dexie.liveQuery(async () => await db.sheets.toArray());

export async function loadExternalConfig(id, source, config) {
  // make sure config contains all the required fields
  if (!config || !(config.sheetId || config.table)) {
    console.error("No config provided");
    return;
  }
  const newConfig = {
    ...config,
    notesRow: parseInt(config.notesRow ?? ddp.notesRow),
    namesRow: parseInt(config.namesRow ?? ddp.namesRow),
    flagsRow: parseInt(config.flagsRow ?? ddp.flagsRow),
    micsStartRow: parseInt(config.micsStartRow ?? ddp.micsStartRow),
    micNumsCol: parseInt(config.micNumsCol ?? ddp.micNumsCol),
    actorNamesCol: parseInt(config.actorNamesCol ?? ddp.actorNamesCol),
    scenesStartCol: parseInt(config.scenesStartCol ?? ddp.scenesStartCol),
    name: source + ": " + config.name ?? "Unnamed Config",
  };
  if (!newConfig.table) {
    //fetch the table
    await new Promise((resolve, reject) => {
      Papa.parse(`https://docs.google.com/spreadsheets/u/0/d/${config.sheetId}/export?format=csv`, {
        download: true,
        header: false,
        complete: function (results) {
          console.log(results);
          if (results.data && results.data.length > 0 && results.data[0]?.length > 0) {
            newConfig.table = results.data;
          }
          resolve();
        },
      });
    });
  }
  externalConfigs.update((configs) => {
    return { ...configs, [id]: newConfig };
  });
  selectedConfigId.update((_) => id);
}

/** refetches and updates a sheet in the db */
// todo: add support for linked mode?
export async function updateSheet(sheetDbId) {
	let editing = await db.sheets.get({id: sheetDbId});
	if (editing?.sheetId) await new Promise((resolve) => {
		Papa.parse(`https://docs.google.com/spreadsheets/u/0/d/${editing.sheetId}/export?format=csv`, {
			download: true,
			header: false,
			complete: async function (results) {
				let data = results.data;
				if (data) {
					await db.sheets.update({ id: sheetDbId }, { ...editing, table: data, lastFetched: new Date() });
				}
				resolve();
			},
		});
	});
}