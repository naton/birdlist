import Dexie from "dexie";
import dexieCloud from "dexie-cloud-addon";

export const db = new Dexie("birdlist", { addons: [dexieCloud] });

db.version(8).stores({
  // Application tables
  lists: "@id, title",
  observations: "@id, name, date, listId",
  comments: "@id, comment, date, listId",
  // Access Control tables
  // (Note: these tables need to be named exactly like in this sample,
  // and will correspond to server-side access control of Dexie Cloud)
  realms: "@realmId",
  members: "@id, userId, [realmId+email]",
  roles: "[realmId+name]",
});

db.cloud.configure({
  databaseUrl: "https://zyh2ho4s6.dexie.cloud",
  requireAuth: true,
});
