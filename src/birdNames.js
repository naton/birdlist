import birdSpecies from "@/assets/birdSpecies.json";

function normalizeBirdName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[’`´]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("sv-SE");
}

const speciesByLatinName = new Map(birdSpecies.map((species) => [species.latinName, species]));
const speciesByName = new Map();

function addNameLookup(name, species) {
  const normalized = normalizeBirdName(name);
  if (normalized && !speciesByName.has(normalized)) {
    speciesByName.set(normalized, species);
  }
}

for (const species of birdSpecies) {
  addNameLookup(species.sv, species);
  addNameLookup(species.en, species);
  addNameLookup(species.de, species);
  for (const alias of species.aliases?.sv || []) addNameLookup(alias, species);
  for (const alias of species.aliases?.en || []) addNameLookup(alias, species);
  for (const alias of species.aliases?.de || []) addNameLookup(alias, species);
}

function getLanguageCode(languageOrLocale) {
  return String(languageOrLocale || "en").split("-")[0];
}

function getBirdSpeciesByLatinName(latinName) {
  return speciesByLatinName.get(String(latinName || "").trim()) || null;
}

function findBirdSpeciesByName(name) {
  return speciesByName.get(normalizeBirdName(name)) || null;
}

function resolveBirdSpecies(bird) {
  if (!bird) {
    return null;
  }

  if (typeof bird === "string") {
    return findBirdSpeciesByName(bird);
  }

  return getBirdSpeciesByLatinName(bird.latinName) || findBirdSpeciesByName(bird.name);
}

function getBirdDisplayName(bird, languageOrLocale = "en") {
  const species = resolveBirdSpecies(bird);
  const language = getLanguageCode(languageOrLocale);

  if (species) {
    return species[language] || species.en || species.sv || species.latinName;
  }

  return typeof bird === "string" ? bird : bird?.name || "";
}

function getBirdLatinName(bird) {
  return resolveBirdSpecies(bird)?.latinName || "";
}

function getBirdStorageName(bird, languageOrLocale = "en") {
  return getBirdDisplayName(bird, languageOrLocale).trim();
}

function getBirdKey(bird) {
  const latinName = typeof bird === "string" ? getBirdLatinName(bird) : bird?.latinName || getBirdLatinName(bird);
  return latinName || normalizeBirdName(typeof bird === "string" ? bird : bird?.name);
}

export {
  birdSpecies,
  findBirdSpeciesByName,
  getBirdDisplayName,
  getBirdKey,
  getBirdLatinName,
  getBirdSpeciesByLatinName,
  getBirdStorageName,
  normalizeBirdName,
};
