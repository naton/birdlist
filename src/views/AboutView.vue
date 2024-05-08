<script setup>
import { useSettingsStore } from '../stores/settings.js'
import AboutIllustration from '../components/illustrations/AboutIllustration.vue';

const settingsStore = useSettingsStore()
const { t } = settingsStore
</script>

<template>
  <article class="about">
    <figure class="center">
      <about-illustration />
    </figure>
    <section class="about-content">
      <h1 class="hidden-visually">{{ t("About")}} Birdlist</h1>
      <picture>
        <source srcset="/logo.webp" type="image/webp" />
        <img src="/logo.png" alt="Birdlist" width="460" height="170" class="logo" />
      </picture>

      <h2 class="tagline">
        {{ t("Log_Your_Bird_Observations") }}.<br />
        {{ t("Make_Lists") }}.<br />
        {{ t("Share_With_Friends") }}.
      </h2>

      <h3 class="center">{{ t("In_Brief") }}:</h3>
      <details class="help">
        <summary>{{ t("Lists") }}</summary>
        <p v-html="t('Create_List_Help')"></p>
      </details>
      <details class="help">
        <summary>{{ t("Friends") }}</summary>
        <p class="margin-left">{{ t("Friends_Help") }}</p>
      </details>
      <details class="help">
        <summary>{{ t("Share_With_Friends") }}</summary>
        <p class="margin-left">{{ t("Invite_Help_1") }}</p>
        <p class="margin-left">{{ t("Invite_Help_2") }}</p>
      </details>
      <details class="help">
        <summary>{{ t("Account") }}</summary>
        <p v-html="t('Account_Help')"></p>
      </details>

      <div class="privacy-notes margin-bottom">
        <h3>{{ t("Personal_Data_Processing") }}</h3>
        <p>{{ t("By_Using_Birdlist_Info") }}</p>
      </div>

      <p>Made by <a href="https://mastodon.social/@naton" target="_blank">Anton Andreasson Gistedt</a></p>
    </section>
  </article>
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
  max-width: 80%;
  height: auto;
  margin: 0 auto;
}

.tagline {
  margin: 3rem 0;
}

.privacy-notes {
  max-width: 45ch;
  margin-top: 2rem;
  font-size: 0.9rem;
}
</style>
