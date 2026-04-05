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

## Local API Secrets (`npm start`)

1. Copy `.env.example` to `.env.local`.
2. Generate VAPID keys:
```sh
npm run keys:vapid
```
3. Put generated keys and your Dexie Cloud credentials in `.env.local`.
4. Start API:
```sh
npm start
```

Notes:
- `.env.local` is ignored by git.
- Server loads `.env.local` first, then `.env`.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

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
