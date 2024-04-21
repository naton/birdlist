<script setup>
import { useSettingsStore } from '../stores/settings.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
</script>

<template>
  <div class="about">
    <div class="about-content">
      <div class="center">
        <img src="../assets/img/birdwatching4.svg" width="250" height="250" alt="">
      </div>

      <h1 class="hidden-visually">{{ t("About")}} Birdlist</h1>
      <picture>
        <source srcset="/logo.webp" type="image/webp" />
        <img src="/logo.png" alt="Birdlist" width="460" height="170" class="logo" />
      </picture>
      <h2>
        {{ t("Log_Your_Bird_Observations") }}.<br />
        {{ t("Make_Lists") }}.<br />
        {{ t("Share_With_Friends") }}.
      </h2>

      <div class="privacy-notes margin-bottom">
        <h3>{{ t("Personal_Data_Processing") }}</h3>
        <p>{{ t("By_Using_Birdlist_Info") }}</p>
      </div>

      <p>Made by <a href="https://mastodon.social/@naton" target="_blank">Anton Andreasson Gistedt</a></p>
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

.about .logo {
  display: flex;
  max-width: 100%;
  height: auto;
  margin-bottom: 2rem;
}

.privacy-notes {
  max-width: 45ch;
  margin-top: 2rem;
  font-size: 0.9rem;
}
</style>
