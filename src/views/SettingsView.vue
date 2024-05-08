<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import SettingsIcon from '../components/icons/SettingsIcon.vue';
import UserIcon from '../components/icons/UserIcon.vue';
import SettingsIllustration from '../components/illustrations/SettingsIllustration.vue';
import SettingsConfig from '../components/SettingsConfig.vue';
import SettingsAccount from '../components/SettingsAccount.vue';

const settingsStore = useSettingsStore()
const { t } = settingsStore
const currentTab = ref('config')
</script>

<template>
  <article class="settings">
    <figure class="center">
      <settings-illustration />
    </figure>
    <section class="settings-content">
      <header>
        <h1 class="center">{{ t("Settings") }}</h1>
        <nav class="nav margin-top margin-bottom">
          <button type="button" @click="currentTab = 'config'" class="nav-link" :class="currentTab === 'config' && 'current'">
            <settings-icon />
            {{ t("Settings") }}
          </button>
          <button type="button" @click="currentTab = 'account'" class="nav-link" :class="currentTab === 'account' && 'current'">
            <user-icon />
            {{ t("Account") }}
          </button>
        </nav>
      </header>

      <settings-config v-if="currentTab === 'config'" />
      <settings-account v-if="currentTab === 'account'" />
    </section>
  </article>
</template>

<style>
.settings-content {
  display: grid;
  align-self: start;
  gap: 0.5rem;
  padding: 1rem;
}

.settings-content label {
  display: block;
}

input[type="range"] {
  width: 100%;
}

.map-buttons {
  justify-content: space-around;
  gap: 1rem;
}

.map-button {
  flex-shrink: 1;
  padding: 1rem;
  border: none;
  background: none;
}

.map-button.selected {
  outline: 2px solid var(--color-border);
  border-radius: var(--radius);
}

.map-button svg {
  width: 100%;
  height: auto;
  max-height: 4rem;
}
</style>