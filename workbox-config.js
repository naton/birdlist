/* eslint-disable no-undef */
module.exports = {
  globDirectory: "public/",
  globPatterns: ["**/*.{ico,json}"],
  swDest: "public/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};
