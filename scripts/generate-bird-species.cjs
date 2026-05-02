const fs = require("node:fs");
const path = require("node:path");
const fetch = require("node-fetch");

const SOURCE_URL = "https://www.natursidan.se/nyheter/svenska-faglars-namn-pa-latin-och-engelska/";
const US_SOURCE_URL = "https://en.wikipedia.org/wiki/List_of_birds_of_the_United_States";
const GERMANY_SOURCE_URL = "https://de.wikipedia.org/wiki/Liste_der_V%C3%B6gel_Deutschlands";
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "src", "assets");

const regionFiles = ["birds_sv-SE.json", "birds_en-GB.json", "birds_en-US.json"];

const manualRegionBirds = [
  {
    name: "Kråka",
    latinName: "Corvus corone",
    regions: ["sv-SE"],
  },
  {
    name: "Svartkråka",
    latinName: "Corvus corone",
    regions: ["sv-SE"],
  },
];

const manualSpeciesOverrides = new Set([
  "Columba livia",
  "Columba livia domestica",
]);

const germanScientificNameAliases = new Map([
  ["Accipiter gentilis", ["Astur gentilis"]],
  ["Ixobrychus minutus", ["Botaurus minutus"]],
  ["Microcarbo pygmeus", ["Microcarbo pygmaeus"]],
  ["Charadrius morinellus", ["Eudromias morinellus"]],
  ["Sylvia nisoria", ["Curruca nisoria"]],
  ["Bubulcus ibis", ["Ardea ibis"]],
  ["Charadrius dubius", ["Thinornis dubius"]],
  ["Cygnus bewickii", ["Cygnus columbianus"]],
  ["Sylvia undata", ["Curruca undata"]],
  ["Cecropis daurica", ["Cecropis rufula"]],
  ["Sylvia cantillans", ["Curruca cantillans"]],
  ["Mergus albellus", ["Mergellus albellus"]],
  ["Sylvia melanocephala", ["Curruca melanocephala"]],
  ["Charadrius alexandrinus", ["Anarhynchus alexandrinus"]],
  ["Phalacrocorax aristotelis", ["Gulosus aristotelis"]],
  ["Sylvia communis", ["Curruca communis"]],
  ["Egretta alba", ["Ardea alba"]],
  ["Sylvia curruca", ["Curruca curruca"]],
]);

const manualSpecies = [
  {
    latinName: "Apus pallidus",
    sv: "Blek tornseglare",
    en: "Pallid Swift",
    de: "Fahlsegler",
    aliases: {
      sv: ["Blektornseglare"],
      en: [],
      de: [],
    },
    regions: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Columba livia domestica",
    sv: "Tamduva",
    en: "Feral Pigeon",
    de: "Straßentaube",
    aliases: {
      sv: ["Duva"],
      en: [],
      de: ["Haustaube"],
    },
    regions: ["en-GB", "en-US", "sv-SE"],
  },
  {
    latinName: "Columba livia",
    sv: "Klippduva",
    en: "Rock Dove",
    de: "Felsentaube",
    aliases: {
      sv: [],
      en: ["Rock Pigeon"],
      de: [],
    },
    regions: ["en-GB", "en-US", "sv-SE"],
  },
  {
    latinName: "Corvus corone",
    sv: "Gråkråka",
    en: "Carrion Crow",
    de: "Aaskrähe",
    aliases: {
      sv: ["Kråka", "Svartkråka"],
      en: ["Hooded Crow"],
      de: ["Rabenkrähe", "Nebelkrähe"],
    },
    regions: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Ardea cinerea",
    sv: "Gråhäger",
    en: "Grey Heron",
    de: "Graureiher",
    aliases: {
      sv: ["Häger"],
      en: ["Gray Heron"],
      de: [],
    },
    regions: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Milvus milvus",
    sv: "Röd glada",
    en: "Red Kite",
    de: "Rotmilan",
    aliases: {
      sv: ["Glada"],
      en: [],
      de: ["Roter Milan"],
    },
    regions: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Cyanocitta cristata",
    sv: "Blåskrika",
    en: "Blue Jay",
    de: "",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Cardinalis cardinalis",
    sv: "Röd kardinal",
    en: "Northern Cardinal",
    de: "",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Haemorhous mexicanus",
    sv: "Husfink",
    en: "House Finch",
    de: "",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Tyto furcata",
    sv: "",
    en: "American barn owl",
    de: "",
    aliases: {
      sv: [],
      en: ["Barn Owl"],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Setophaga nigrescens",
    sv: "",
    en: "Black-throated grey warbler",
    de: "",
    aliases: {
      sv: [],
      en: ["Black-throated Gray Warbler"],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Empidonax fulvifrons",
    sv: "",
    en: "Buff-breasted Flycatcher",
    de: "",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Columba palumbus",
    sv: "",
    en: "Common Wood Pigeon",
    de: "Ringeltaube",
    aliases: {
      sv: [],
      en: ["Common Wood-Pigeon"],
      de: [],
    },
    regions: ["en-US", "en-GB"],
  },
  {
    latinName: "Leucosticte tephrocotis",
    sv: "",
    en: "Gray-crowned Rosy-Finch",
    de: "",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Porphyrio poliocephalus",
    sv: "",
    en: "Gray-headed Swamphen",
    de: "Graukopf-Purpurhuhn",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Larus smithsonianus",
    sv: "",
    en: "American herring gull",
    de: "",
    aliases: {
      sv: [],
      en: ["Herring Gull"],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Piaya cayana",
    sv: "",
    en: "Squirrel Cuckoo",
    de: "",
    aliases: {
      sv: [],
      en: [],
      de: [],
    },
    regions: ["en-US"],
  },
  {
    latinName: "Nyctanassa violacea",
    sv: "",
    en: "Yellow-crowned night-heron",
    de: "",
    aliases: {
      sv: [],
      en: ["Yellow-crowned Night Heron"],
      de: [],
    },
    regions: ["en-US"],
  },
];

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\"")
    .replace(/&ldquo;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[’`´]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("sv-SE");
}

function capitalizeFirst(value) {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toLocaleUpperCase("sv-SE") + text.slice(1) : text;
}

function toSpecies(row, source) {
  return {
    latinName: row.latinName || row.latin,
    sv: row.sv ? capitalizeFirst(row.sv) : "",
    en: row.en,
    de: row.de || "",
    aliases: {
      sv: [...new Set([...(row.aliases?.sv || [])].map(capitalizeFirst))].sort((a, b) => a.localeCompare(b, "sv-SE")),
      en: [...new Set([...(row.aliases?.en || [])])].sort((a, b) => a.localeCompare(b, "en")),
      de: [...new Set([...(row.aliases?.de || [])])].sort((a, b) => a.localeCompare(b, "de")),
    },
    source,
  };
}

function addLookupName(lookup, species, name) {
  const key = normalizeName(name);
  if (key && !lookup.has(key)) {
    lookup.set(key, species);
  }
}

async function fetchNatursidanRows() {
  const html = await (await fetch(SOURCE_URL)).text();
  return [...html.matchAll(/<tr><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>/g)]
    .map((match) => ({
      sv: decodeHtml(match[1]),
      latin: decodeHtml(match[2]),
      en: decodeHtml(match[3]),
    }))
    .filter((row) => row.sv && row.latin && row.en);
}

async function fetchUnitedStatesRows() {
  const html = await (await fetch(US_SOURCE_URL)).text();
  return [...html.matchAll(/<li>\s*<a[^>]*>([^<]+)<\/a>,\s*<i>([^<]+)<\/i>/g)]
    .map((match) => ({
      en: decodeHtml(match[1]),
      latin: decodeHtml(match[2]),
    }))
    .filter((row) => row.en && row.latin);
}

async function fetchGermanyRows() {
  const html = await (await fetch(GERMANY_SOURCE_URL)).text();
  return [...html.matchAll(/<tr[^>]*>\s*<td[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>\s*<i[^>]*>([\s\S]*?)<\/i>[\s\S]*?<\/td>[\s\S]*?<\/tr>/g)]
    .map((match) => ({
      de: decodeHtml(match[1].replace(/<[^>]+>/g, "")),
      latin: decodeHtml(match[2]),
    }))
    .filter((row) => row.de && row.latin);
}

function mergeSpecies(existing, incoming) {
  if (!existing) {
    return incoming;
  }

  const aliases = {
    sv: new Set(existing.aliases?.sv || []),
    en: new Set(existing.aliases?.en || []),
    de: new Set(existing.aliases?.de || []),
  };

  if (incoming.sv && existing.sv && normalizeName(incoming.sv) !== normalizeName(existing.sv)) {
    aliases.sv.add(incoming.sv);
  }

  if (incoming.en && existing.en && normalizeName(incoming.en) !== normalizeName(existing.en)) {
    aliases.en.add(incoming.en);
  }

  if (incoming.de && existing.de && normalizeName(incoming.de) !== normalizeName(existing.de)) {
    aliases.de.add(incoming.de);
  }

  for (const alias of incoming.aliases?.sv || []) aliases.sv.add(alias);
  for (const alias of incoming.aliases?.en || []) aliases.en.add(alias);
  for (const alias of incoming.aliases?.de || []) aliases.de.add(alias);

  return {
    ...existing,
    sv: existing.sv || incoming.sv,
    en: existing.en || incoming.en,
    de: existing.de || incoming.de,
    aliases: {
      sv: [...aliases.sv].sort((a, b) => a.localeCompare(b, "sv-SE")),
      en: [...aliases.en].sort((a, b) => a.localeCompare(b, "en")),
      de: [...aliases.de].sort((a, b) => a.localeCompare(b, "de")),
    },
    source: existing.source === incoming.source ? existing.source : `${existing.source}; ${incoming.source}`,
  };
}

async function main() {
  const natursidanSpecies = (await fetchNatursidanRows()).map((row) => toSpecies(row, SOURCE_URL));
  const speciesByLatin = new Map(natursidanSpecies.map((species) => [species.latinName, species]));

  for (const row of await fetchUnitedStatesRows()) {
    const incoming = toSpecies(row, US_SOURCE_URL);
    speciesByLatin.set(row.latin, mergeSpecies(speciesByLatin.get(row.latin), incoming));
  }

  for (const row of await fetchGermanyRows()) {
    const latinNames = [row.latin, ...(germanScientificNameAliases.get(row.latin) || [])];

    for (const latin of latinNames) {
      const incoming = toSpecies({ ...row, latin }, GERMANY_SOURCE_URL);
      speciesByLatin.set(latin, mergeSpecies(speciesByLatin.get(latin), incoming));
    }
  }

  for (const row of manualSpecies) {
    const incoming = toSpecies(row, "manual");
    speciesByLatin.set(
      row.latinName,
      manualSpeciesOverrides.has(row.latinName)
        ? incoming
        : mergeSpecies(speciesByLatin.get(row.latinName), incoming)
    );
  }

  const species = [...speciesByLatin.values()].sort((a, b) => a.latinName.localeCompare(b.latinName, "en"));
  const lookup = new Map();
  for (const item of species) {
    addLookupName(lookup, item, item.sv);
    addLookupName(lookup, item, item.en);
    addLookupName(lookup, item, item.de);
    for (const alias of item.aliases.sv) addLookupName(lookup, item, alias);
    for (const alias of item.aliases.en) addLookupName(lookup, item, alias);
    for (const alias of item.aliases.de) addLookupName(lookup, item, alias);
  }

  const speciesAsset = species.map(({ source, ...item }) => item);
  fs.writeFileSync(path.join(assetsDir, "birdSpecies.json"), `${JSON.stringify(speciesAsset, null, 2)}\n`);

  for (const fileName of regionFiles) {
    const region = fileName.replace("birds_", "").replace(".json", "");
    const regionPath = path.join(assetsDir, fileName);
    const rows = JSON.parse(fs.readFileSync(regionPath, "utf8"));
    const regionRows = [];
    const seenLatin = new Set();

    for (const row of rows) {
      const matched = lookup.get(normalizeName(row.name));
      if (matched?.latinName) {
        seenLatin.add(matched.latinName);
        regionRows.push({
          name: row.name,
          latinName: matched.latinName,
        });
      } else {
        regionRows.push({ name: row.name });
      }
    }

    for (const item of manualSpecies.filter((manual) => manual.regions.includes(region))) {
      if (!seenLatin.has(item.latinName)) {
        regionRows.push({
          name: region === "sv-SE" ? item.sv : item.en,
          latinName: item.latinName,
        });
      }
    }

    for (const item of manualRegionBirds.filter((manual) => manual.regions.includes(region))) {
      const hasSameName = regionRows.some((row) => normalizeName(row.name) === normalizeName(item.name));
      if (!hasSameName) {
        regionRows.push({
          name: item.name,
          latinName: item.latinName,
        });
      }
    }

    regionRows.sort((a, b) => a.name.localeCompare(b.name, region));
    fs.writeFileSync(regionPath, `${JSON.stringify(regionRows, null, 2)}\n`);
  }

  console.log(`Wrote ${species.length} species and updated ${regionFiles.length} region files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
