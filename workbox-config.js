module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'index.html',
		'**/*.{css,png,jpg,webp,ico,svg,xml,json,js,webmanifest}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};