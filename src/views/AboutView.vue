<template>
  <div class="about">
    <h1><img src="../assets/logo.webp" alt="Birdlist" class="logo" /></h1>
    <h2>
      Log your bird observations.<br />
      Nothing more.
    </h2>
  </div>
</template>

<style>
.about {
  display: grid;
  place-items: center;
  padding: 1rem;
  align-content: center;
}

.about .logo {
  display: flex;
  max-width: 70%;
  margin: 0 auto 2rem;
}

@media (prefers-color-scheme: dark) {
  .about .logo {
    filter: invert(1);
  }
}
</style>
