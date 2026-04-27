const fs = require("node:fs");
const path = require("node:path");
const fetch = require("node-fetch");

const SOURCE_URL = "https://www.natursidan.se/nyheter/svenska-faglars-namn-pa-latin-och-engelska/";
const US_SOURCE_URL = "https://en.wikipedia.org/wiki/List_of_birds_of_the_United_States";
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "src", "assets");

const marketFiles = ["birds_sv-SE.json", "birds_en-GB.json", "birds_en-US.json"];

const manualSpecies = [
  {
    latinName: "Columba livia",
    sv: "Tamduva",
    en: "Rock Dove",
    aliases: {
      sv: ["Duva"],
      en: ["Rock Pigeon", "Feral Pigeon"],
    },
    markets: ["en-GB", "en-US", "sv-SE"],
  },
  {
    latinName: "Corvus corone",
    sv: "Gråkråka",
    en: "Carrion Crow",
    aliases: {
      sv: ["Kråka"],
      en: ["Hooded Crow"],
    },
    markets: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Ardea cinerea",
    sv: "Gråhäger",
    en: "Grey Heron",
    aliases: {
      sv: ["Häger"],
      en: ["Gray Heron"],
    },
    markets: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Milvus milvus",
    sv: "Röd glada",
    en: "Red Kite",
    aliases: {
      sv: ["Glada"],
      en: [],
    },
    markets: ["en-GB", "sv-SE"],
  },
  {
    latinName: "Cyanocitta cristata",
    sv: "Blåskrika",
    en: "Blue Jay",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Cardinalis cardinalis",
    sv: "Röd kardinal",
    en: "Northern Cardinal",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Haemorhous mexicanus",
    sv: "Husfink",
    en: "House Finch",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Tyto furcata",
    sv: "",
    en: "American barn owl",
    aliases: {
      sv: [],
      en: ["Barn Owl"],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Setophaga nigrescens",
    sv: "",
    en: "Black-throated grey warbler",
    aliases: {
      sv: [],
      en: ["Black-throated Gray Warbler"],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Empidonax fulvifrons",
    sv: "",
    en: "Buff-breasted Flycatcher",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Columba palumbus",
    sv: "",
    en: "Common Wood Pigeon",
    aliases: {
      sv: [],
      en: ["Common Wood-Pigeon"],
    },
    markets: ["en-US", "en-GB"],
  },
  {
    latinName: "Leucosticte tephrocotis",
    sv: "",
    en: "Gray-crowned Rosy-Finch",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Porphyrio poliocephalus",
    sv: "",
    en: "Gray-headed Swamphen",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Larus smithsonianus",
    sv: "",
    en: "American herring gull",
    aliases: {
      sv: [],
      en: ["Herring Gull"],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Piaya cayana",
    sv: "",
    en: "Squirrel Cuckoo",
    aliases: {
      sv: [],
      en: [],
    },
    markets: ["en-US"],
  },
  {
    latinName: "Nyctanassa violacea",
    sv: "",
    en: "Yellow-crowned night-heron",
    aliases: {
      sv: [],
      en: ["Yellow-crowned Night Heron"],
    },
    markets: ["en-US"],
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
    aliases: {
      sv: [...new Set([...(row.aliases?.sv || [])].map(capitalizeFirst))].sort((a, b) => a.localeCompare(b, "sv-SE")),
      en: [...new Set([...(row.aliases?.en || [])])].sort((a, b) => a.localeCompare(b, "en")),
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

function mergeSpecies(existing, incoming) {
  if (!existing) {
    return incoming;
  }

  const aliases = {
    sv: new Set(existing.aliases?.sv || []),
    en: new Set(existing.aliases?.en || []),
  };

  if (incoming.sv && existing.sv && normalizeName(incoming.sv) !== normalizeName(existing.sv)) {
    aliases.sv.add(incoming.sv);
  }

  if (incoming.en && existing.en && normalizeName(incoming.en) !== normalizeName(existing.en)) {
    aliases.en.add(incoming.en);
  }

  for (const alias of incoming.aliases?.sv || []) aliases.sv.add(alias);
  for (const alias of incoming.aliases?.en || []) aliases.en.add(alias);

  return {
    ...existing,
    sv: existing.sv || incoming.sv,
    en: existing.en || incoming.en,
    aliases: {
      sv: [...aliases.sv].sort((a, b) => a.localeCompare(b, "sv-SE")),
      en: [...aliases.en].sort((a, b) => a.localeCompare(b, "en")),
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

  for (const row of manualSpecies) {
    const incoming = toSpecies(row, "manual");
    speciesByLatin.set(row.latinName, mergeSpecies(speciesByLatin.get(row.latinName), incoming));
  }

  const species = [...speciesByLatin.values()].sort((a, b) => a.latinName.localeCompare(b.latinName, "en"));
  const lookup = new Map();
  for (const item of species) {
    addLookupName(lookup, item, item.sv);
    addLookupName(lookup, item, item.en);
    for (const alias of item.aliases.sv) addLookupName(lookup, item, alias);
    for (const alias of item.aliases.en) addLookupName(lookup, item, alias);
  }

  const speciesAsset = species.map(({ source, ...item }) => item);
  fs.writeFileSync(path.join(assetsDir, "birdSpecies.json"), `${JSON.stringify(speciesAsset, null, 2)}\n`);

  for (const fileName of marketFiles) {
    const market = fileName.replace("birds_", "").replace(".json", "");
    const marketPath = path.join(assetsDir, fileName);
    const rows = JSON.parse(fs.readFileSync(marketPath, "utf8"));
    const marketRows = [];
    const seenLatin = new Set();

    for (const row of rows) {
      const matched = lookup.get(normalizeName(row.name));
      if (matched?.latinName) {
        seenLatin.add(matched.latinName);
        marketRows.push({
          name: row.name,
          latinName: matched.latinName,
        });
      } else {
        marketRows.push({ name: row.name });
      }
    }

    for (const item of manualSpecies.filter((manual) => manual.markets.includes(market))) {
      if (!seenLatin.has(item.latinName)) {
        marketRows.push({
          name: market === "sv-SE" ? item.sv : item.en,
          latinName: item.latinName,
        });
      }
    }

    marketRows.sort((a, b) => a.name.localeCompare(b.name, market));
    fs.writeFileSync(marketPath, `${JSON.stringify(marketRows, null, 2)}\n`);
  }

  console.log(`Wrote ${species.length} species and updated ${marketFiles.length} market files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
