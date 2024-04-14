<script setup>
import { onBeforeMount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from "vue-router";
import { useSettingsStore } from './stores/settings.js'
import { useMessagesStore } from './stores/messages.js'
import AppMessages from './components/AppMessages.vue'
import InvitesList from './components/InvitesList.vue'
import HomeIcon from './components/icons/HomeIcon.vue'
import FriendsIcon from './components/icons/FriendsIcon.vue'
import SettingsIcon from './components/icons/SettingsIcon.vue'
import HelpIcon from './components/icons/HelpIcon.vue'

const settingsStore = useSettingsStore()
const { t, loadTexts, setThemeColor } = settingsStore
const { locale, texts } = storeToRefs(settingsStore)

const messagesStore = useMessagesStore()
const { addMessage } = messagesStore

onBeforeMount(() => {
  texts.value = loadTexts(locale.value)
  document.addEventListener('dblclick', () => false);
})

onMounted(() => {
  setTimeout(() => setThemeColor(), 500)
})
</script>

<template>
  <main class="main">
    <app-messages />
    <invites-list />
    <router-view />
  </main>
  <nav class="nav main-nav">
    <router-link class="nav-link" to="/">
      <home-icon />
      {{ t("Observations") }}
    </router-link>
    <router-link class="nav-link" to="/friends">
      <friends-icon />
      {{ t("Friends") }}
    </router-link>
    <router-link class="nav-link" to="/settings">
      <settings-icon />
      {{ t("Settings") }}
    </router-link>
    <router-link class="nav-link" to="/about">
      <help-icon />
      {{ t("About") }}
    </router-link>
  </nav>
</template>

<style>
.main-nav a {
  display: flex;
  gap: 0.5rem 0;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
  line-height: 1;
}
</style>