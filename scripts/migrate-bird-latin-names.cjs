const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const rootDir = path.resolve(__dirname, "..");
const base = "https://zyh2ho4s6.dexie.cloud";
const isApply = process.argv.includes("--apply");
const backupArg = process.argv.find((arg) => arg.startsWith("--backup="));
const backupPath = backupArg
  ? path.resolve(rootDir, backupArg.slice("--backup=".length))
  : latestBackupPath();

function latestBackupPath() {
  const backupDir = path.join(rootDir, "out", "db-backups");
  const file = fs
    .readdirSync(backupDir)
    .filter((name) => name.startsWith("dexie-cloud-backup-") && name.endsWith(".json"))
    .sort()
    .pop();

  if (!file) {
    throw new Error("No backup found in out/db-backups. Create a DB backup before migration.");
  }

  return path.join(backupDir, file);
}

function normalizeBirdName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[’`´]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("sv-SE");
}

function buildSpeciesLookup() {
  const species = JSON.parse(fs.readFileSync(path.join(rootDir, "src", "assets", "birdSpecies.json"), "utf8"));
  const byName = new Map();
  const byLatinName = new Map();

  function addName(name, item) {
    const key = normalizeBirdName(name);
    if (key && !byName.has(key)) {
      byName.set(key, item);
    }
  }

  for (const item of species) {
    byLatinName.set(item.latinName, item);
    addName(item.sv, item);
    addName(item.en, item);
    addName(item.de, item);
    for (const alias of item.aliases?.sv || []) addName(alias, item);
    for (const alias of item.aliases?.en || []) addName(alias, item);
    for (const alias of item.aliases?.de || []) addName(alias, item);
  }

  return { byName, byLatinName };
}

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function getAccessToken() {
  if (!process.env.DEXIE_CLOUD_CLIENTID || !process.env.DEXIE_CLOUD_CLIENTSECRET) {
    throw new Error("Missing DEXIE_CLOUD_CLIENTID or DEXIE_CLOUD_CLIENTSECRET.");
  }

  const response = await fetch(`${base}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      scopes: ["ACCESS_DB", "GLOBAL_READ", "GLOBAL_WRITE"],
      client_id: process.env.DEXIE_CLOUD_CLIENTID,
      client_secret: process.env.DEXIE_CLOUD_CLIENTSECRET,
      claims: { sub: "birdlist@system.local" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()).accessToken;
}

async function dexieRequest(pathname, accessToken, options = {}) {
  return fetch(`${base}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
}

async function fetchTable(table, accessToken) {
  const response = await dexieRequest(`/all/${table}`, accessToken);
  const text = await response.text();
  const payload = JSON.parse(text);
  if (!response.ok) {
    throw new Error(`GET /all/${table} failed (${response.status}): ${text}`);
  }
  return getRows(payload);
}

async function upsertMany(table, rows, accessToken) {
  if (!rows.length) {
    return;
  }

  const response = await dexieRequest(`/all/${table}`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`POST /all/${table} failed (${response.status}): ${await response.text()}`);
  }
}

function getBirdName(value) {
  return typeof value === "string" ? value : value?.name;
}

function convertBirdValue(value, lookup) {
  if (value?.latinName) {
    return {
      value,
      changed: false,
      matched: lookup.byLatinName.get(value.latinName) || null,
    };
  }

  const name = getBirdName(value);
  const matched = lookup.byName.get(normalizeBirdName(name));
  if (!matched) {
    return { value, changed: false, matched: null };
  }

  return {
    value: {
      name,
      latinName: matched.latinName,
    },
    changed: true,
    matched,
  };
}

function analyzeObservations(observations, lookup) {
  const updates = [];
  const matched = [];
  const unmatched = [];
  const skippedExisting = [];

  for (const observation of observations) {
    if (observation.latinName) {
      skippedExisting.push({ id: observation.id, name: observation.name, latinName: observation.latinName });
      continue;
    }

    const converted = convertBirdValue(observation.name, lookup);
    if (!converted.matched) {
      unmatched.push({ id: observation.id, name: observation.name, listId: observation.listId });
      continue;
    }

    updates.push({ ...observation, latinName: converted.matched.latinName });
    matched.push({
      id: observation.id,
      name: observation.name,
      latinName: converted.matched.latinName,
      sv: converted.matched.sv,
      en: converted.matched.en,
    });
  }

  return { updates, matched, unmatched, skippedExisting };
}

function analyzeLists(lists, lookup) {
  const updates = [];
  const matched = [];
  const unmatched = [];

  for (const list of lists) {
    if (!Array.isArray(list.birds)) {
      continue;
    }

    let changed = false;
    const nextBirds = list.birds.map((bird) => {
      const converted = convertBirdValue(bird, lookup);
      const originalName = getBirdName(bird);

      if (converted.matched) {
        matched.push({
          listId: list.id,
          listTitle: list.title,
          name: originalName,
          latinName: converted.matched.latinName,
          sv: converted.matched.sv,
          en: converted.matched.en,
        });
      } else {
        unmatched.push({ listId: list.id, listTitle: list.title, name: originalName });
      }

      changed = changed || converted.changed;
      return converted.value;
    });

    if (changed) {
      updates.push({ ...list, birds: nextBirds });
    }
  }

  return { updates, matched, unmatched };
}

function uniqueCounts(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "sv-SE"));
}

async function main() {
  const lookup = buildSpeciesLookup();
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const accessToken = isApply ? await getAccessToken() : null;
  const lists = isApply ? await fetchTable("lists", accessToken) : backup.tables.lists || [];
  const observations = isApply ? await fetchTable("observations", accessToken) : backup.tables.observations || [];

  const observationAnalysis = analyzeObservations(observations, lookup);
  const listAnalysis = analyzeLists(lists, lookup);

  const report = {
    createdAt: new Date().toISOString(),
    mode: isApply ? "apply" : "dry-run",
    backupPath,
    observations: {
      total: observations.length,
      updateCount: observationAnalysis.updates.length,
      skippedExistingCount: observationAnalysis.skippedExisting.length,
      matchedUnique: uniqueCounts(observationAnalysis.matched, (row) => row.name),
      unmatchedUnique: uniqueCounts(observationAnalysis.unmatched, (row) => row.name),
      unmatchedRows: observationAnalysis.unmatched,
    },
    lists: {
      total: lists.length,
      updateCount: listAnalysis.updates.length,
      matchedUnique: uniqueCounts(listAnalysis.matched, (row) => row.name),
      unmatchedUnique: uniqueCounts(listAnalysis.unmatched, (row) => row.name),
      unmatchedRows: listAnalysis.unmatched,
    },
  };

  if (isApply) {
    await upsertMany("observations", observationAnalysis.updates, accessToken);
    await upsertMany("lists", listAnalysis.updates, accessToken);
    report.applied = {
      observations: observationAnalysis.updates.length,
      lists: listAnalysis.updates.length,
    };
  }

  const outDir = path.join(rootDir, "out", "bird-migration");
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, `latin-name-migration-${isApply ? "apply" : "dry-run"}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({
    reportPath,
    mode: report.mode,
    observationUpdates: report.observations.updateCount,
    listUpdates: report.lists.updateCount,
    unmatchedObservationNames: report.observations.unmatchedUnique,
    unmatchedListBirdNames: report.lists.unmatchedUnique,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
