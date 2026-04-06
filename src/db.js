import Dexie from "dexie";
import dexieCloud from "dexie-cloud-addon";

export const db = new Dexie("birdlist", { addons: [dexieCloud] });

db.version(10).stores({
  // Application tables
  lists: "@id",
  observations: "@id, listId",
  friends: "@id",
  comments: "@id, listId",
  // Access Control tables
  // (Note: these tables need to be named exactly like in this sample,
  // and will correspond to server-side access control of Dexie Cloud)
  realms: "@realmId",
  members: "@id, userId, [realmId+email]",
  roles: "[realmId+name]",
});

db.version(11).stores({
  // Application tables
  lists: "@id",
  observations: "@id, listId",
  friends: "@id",
  comments: "@id, listId",
  joinedLists: "@id, userId, listId, [userId+listId]",
  // Access Control tables
  realms: "@realmId",
  members: "@id, userId, [realmId+email]",
  roles: "[realmId+name]",
});

db.version(12).stores({
  // Application tables
  lists: "@id",
  observations: "@id, listId",
  friends: "@id",
  comments: "@id, listId",
  joinedLists: "@id, userId, listId, [userId+listId]",
  // Access Control tables
  realms: "@realmId",
  members: "@id, userId, [realmId+email]",
  roles: "[realmId+name]",
});

db.cloud.configure({
  databaseUrl: "https://zyh2ho4s6.dexie.cloud",
  requireAuth: false,
});
