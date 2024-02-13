<script setup>
import { onBeforeMount } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from "vue-router";
import { useSettingsStore } from './stores/settings.js'
import InvitesList from './components/InvitesList.vue'

const settingsStore = useSettingsStore()
const { t, loadTexts } = settingsStore
const { lang, texts } = storeToRefs(settingsStore)

onBeforeMount(() => {
  texts.value = loadTexts(lang.value)
})
</script>

<template>
  <main class="main">
    <invites-list />
    <router-view />
  </main>
  <nav class="nav">
    <router-link class="nav-link" to="/">Birdlist</router-link>
    <router-link class="nav-link" to="/settings">{{ t("Settings") }}</router-link>
    <router-link class="nav-link" to="/about">{{ t("About") }}</router-link>
  </nav>
</template>
