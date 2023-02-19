import Dexie from "dexie";
import { liveQuery } from "dexie";
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

export const configs = Dexie.liveQuery(async () => await db.configs.toArray());

export const sheets = Dexie.liveQuery(async () => await db.sheets.toArray());
