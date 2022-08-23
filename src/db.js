import Dexie from "dexie";
import dexieCloud from "dexie-cloud-addon";

export const db = new Dexie("birdlist", { addons: [dexieCloud] });
db.version(1).stores({
  observations: "@id, name, date", // Primary key and indexed props
});

db.cloud.configure({
  databaseUrl: "https://zyh2ho4s6.dexie.cloud",
  requireAuth: true,
});
