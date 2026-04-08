const fs = require("fs");
const path = require("path");

function pad(value) {
  return String(value).padStart(2, "0");
}

function createSwVersion(date = new Date()) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`,
  ].join(".");
}

function renderServiceWorkerSource(template, version) {
  return template.replaceAll("__SW_VERSION__", version);
}

function prepareServiceWorkerSource() {
  const rootDir = path.resolve(__dirname, "..");
  const sourcePath = path.join(rootDir, "service-worker-src.js");
  const outputDir = path.join(rootDir, ".generated");
  const outputPath = path.join(outputDir, "service-worker-src.js");
  const template = fs.readFileSync(sourcePath, "utf8");
  const version = createSwVersion();
  const output = renderServiceWorkerSource(template, version);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, output, "utf8");

  return {
    version,
    sourcePath,
    outputPath,
  };
}

if (require.main === module) {
  const { version, outputPath } = prepareServiceWorkerSource();
  console.log(`Prepared service worker source ${version} -> ${outputPath}`);
}

module.exports = {
  createSwVersion,
  renderServiceWorkerSource,
  prepareServiceWorkerSource,
};
