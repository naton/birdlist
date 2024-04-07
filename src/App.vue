<script setup>
import { onBeforeMount } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from "vue-router";
import { useSettingsStore } from './stores/settings.js'
import InvitesList from './components/InvitesList.vue'
import FriendsIcon from './components/icons/FriendsIcon.vue'

const settingsStore = useSettingsStore()
const { t, loadTexts } = settingsStore
const { lang, texts } = storeToRefs(settingsStore)

onBeforeMount(() => {
  texts.value = loadTexts(lang.value)
  document.addEventListener('dblclick', () => false);
})
</script>

<template>
  <main class="main">
    <invites-list />
    <router-view />
  </main>
  <nav class="nav main-nav">
    <router-link class="nav-link" to="/"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 29" width="24" height="24"><path fill="currentColor" d="M.8 6.04a5.489 5.489 0 0 0 3.77-2.978A5.5 5.5 0 0 1 15 5.5a7.965 7.965 0 0 1-2.2 5.5h.009C21.823 11 26 14 26 14l4.689-1.562A1 1 0 0 1 32 13.39v2.603C32 22.988 25 29 16 29 9 29 2 25 2 19c0-4 3.493-7 3.493-9.5A1.5 1.5 0 0 0 4 8H1a1 1 0 0 1-1-1 .985.985 0 0 1 .8-.96ZM19 24a1 1 0 0 0 0-2 6.006 6.006 0 0 1-6-6 1 1 0 0 0-2 0 8.009 8.009 0 0 0 8 8ZM9.5 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>
      {{ t("Observations") }}
    </router-link>
    <router-link class="nav-link" to="/friends">
      <friends-icon />
      {{ t("Friends") }}
    </router-link>
    <router-link class="nav-link" to="/settings"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24"><g fill="currentColor"><path d="M10 1a5 5 0 0 0-4.9 4H2a1 1 0 0 0 0 2h3.1A5 5 0 1 0 10 1Zm21 5a1 1 0 0 0-1-1H17v2h13a1 1 0 0 0 1-1ZM10 21a5 5 0 0 0-4.9 4H2a1 1 0 0 0 0 2h3.1a5 5 0 1 0 4.9-6Zm21 5a1 1 0 0 0-1-1H17v2h13a1 1 0 0 0 1-1Z"/><path d="M30 15h-3.1a5 5 0 1 0 0 2H30a1 1 0 0 0 0-2ZM1 16a1 1 0 0 0 1 1h13v-2H2a1 1 0 0 0-1 1Z" /></g></svg>
      {{ t("Settings") }}
    </router-link>
    <router-link class="nav-link" to="/about"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24"><path fill="currentColor" d="M16 0C7.178 0 0 7.178 0 16s7.178 16 16 16 16-7.178 16-16S24.822 0 16 0Zm0 26a2 2 0 1 1-.001-3.999A2 2 0 0 1 16 26Zm4.926-11.645c-.958 1.142-2.715 2.138-3.374 3.144-.29.441-.36.935-.377 1.426a.498.498 0 0 1-.498.482h-1.388a.498.498 0 0 1-.501-.5c.005-.68.062-1.518.487-2.294.323-.591.89-1.202 1.699-1.833 1.56-1.232 2.244-1.889 2.28-3.166.035-1.199-.975-2.177-2.175-2.215-1.054-.034-2.098-.01-4.058.892a.504.504 0 0 1-.668-.233l-.594-1.245a.51.51 0 0 1 .224-.671A10.654 10.654 0 0 1 16.829 7c1.586 0 2.844.388 3.775 1.165S22 10.014 22 11.382c0 1.149-.312 2.066-1.074 2.973Z"/></svg>
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