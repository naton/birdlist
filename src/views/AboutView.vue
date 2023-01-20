<template>
  <div class="about">
    <div class="about-content">
      <h1 class="hidden-visually">About Birdlist</h1>
      <picture>
        <source srcset="/logo.webp" type="image/webp" />
        <img src="/logo.png" alt="Birdlist" width="460" height="170" class="logo" />
      </picture>
      <h2>
        Log your bird observations.<br />
        Make lists.<br />
        Share with friends.
      </h2>

      <div class="privacy-notes">
        <h3>Personuppgiftshantering</h3>
        <p>
          Genom att använda Birdlist godkänner du att din e-postadress lagras på såväl din enhet som på dina vänners
          enheter, i de fall du delar dina listor med dem.
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.about {
  display: grid;
  place-items: center;
  padding: 1rem;
  align-content: center;
}

.about-content {
  width: 25rem;
  max-width: 85vw;
}

.logo {
  display: flex;
  max-width: 100%;
  height: auto;
  margin-bottom: 2rem;
}

.hidden-visually {
  position: absolute;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
  width: 0;
  height: 0;
  margin: 0;
}

.privacy-notes {
  max-width: 45ch;
  margin-top: 2rem;
  font-size: 0.9rem;
}

@media (prefers-color-scheme: dark) {
  .about .logo {
    filter: invert(1);
  }
}
</style>
