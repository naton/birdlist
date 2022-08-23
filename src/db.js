import Dexie from "dexie";

export const db = new Dexie("birdlist");
db.version(1).stores({
  observations: "++id, name, date", // Primary key and indexed props
});
