<script setup>
import { useSettingsStore } from '../stores/settings.js'
import AboutIllustration from '@/shared/illustrations/AboutIllustration.vue';

const settingsStore = useSettingsStore()
const { t } = settingsStore
</script>

<template>
  <article class="about">
    <router-link to="/">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64"><title>c-remove</title><g fill="#000000"><path d="M32,2A30,30,0,1,0,62,32,30.026,30.026,0,0,0,32,2ZM44.7,43.3a.967.967,0,0,1,0,1.4.967.967,0,0,1-1.4,0L32,33.4,20.7,44.7a.967.967,0,0,1-1.4,0,.967.967,0,0,1,0-1.4L30.6,32,19.3,20.7a.99.99,0,0,1,1.4-1.4L32,30.6,43.3,19.3a.99.99,0,1,1,1.4,1.4L33.4,32Z" fill="currentColor"></path></g></svg>
    </router-link>

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
  padding: 1rem 0.5rem;
  align-content: center;
}  

.about-content {
  display: grid;
  gap: 0.5rem;
  align-self: start;
  padding: 1rem;
}

.about .logo {
  display: flex;
  max-width: 50%;
  height: auto;
  margin: 0 auto;
}

.tagline {
  margin: 2rem 0;
}

.privacy-notes {
  max-width: 45ch;
  margin-top: 2rem;
  font-size: 0.9rem;
}
</style>
