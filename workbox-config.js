module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'index.html',
		'**/*.{css,png,jpg,webp,ico,svg,xml,json,js,webmanifest}'
	],
	swSrc: 'service-worker-src.js',
	swDest: 'dist/sw.js'
};