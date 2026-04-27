# birdlist

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

## Local API Secrets

1. Copy `.env.example` to `.env.local`.
2. Put your Dexie Cloud credentials in `.env.local`.
3. Optionally generate VAPID keys if you want push notifications locally:
```sh
npm run keys:vapid
```

Notes:
- `.env.local` is ignored by git.
- Server loads `.env.local` first, then `.env`.
- The API starts without VAPID keys, but push notifications are disabled until they are configured.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

This starts both the API server on `http://localhost:5001` and the Vite client on `http://localhost:5173`.
Use `npm run dev:client` or `npm run dev:api` if you need to run them separately.

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
