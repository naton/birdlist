<template>
  <div class="about">
    <div>
      <h1><img src="../assets/logo.webp" alt="Birdlist" class="logo" /></h1>
      <h2>
        Log your bird observations.<br />
        Make lists.<br />
        Share with friends.
      </h2>

      <div class="privacy-notes">
        <h3>Personuppgiftshantering</h3>
        <p>
          Genom att använda Birdlist godkänner du att din e-postadress lagras på
          såväl din enhet som på dina vänners enheter, i de fall du delar dina
          listor med dem.
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

.about .logo {
  display: flex;
  width: 25rem;
  max-width: 90%;
  margin-bottom: 2rem;
}

.privacy-notes {
  max-width: 100%;
  width: 25rem;
  margin-top: 2rem;
  font-size: 0.9rem;
}

@media (prefers-color-scheme: dark) {
  .about .logo {
    filter: invert(1);
  }
}
</style>
