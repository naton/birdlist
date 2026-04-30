const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(__dirname, '..', 'src', 'assets', 'birdSpecies.json');
const targetPath = path.resolve(__dirname, '..', 'dist', 'birdSpecies.json');

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Copied bird species data to ${targetPath}`);
