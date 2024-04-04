<script setup>
import { getCurrentYear, getMonthName } from "@/helpers";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentMonth, currentYear } = storeToRefs(settingsStore);
</script>

<template>
  <nav class="body-nav">
    <picture>
      <source srcset="/logo.webp" type="image/webp" />
      <img src="/logo.png" alt="Birdlist" width="65" height="24" class="logo" />
    </picture>

    <ul class="c-tabs">
      <li class="c-tabs__tab">
        <router-link :to="{ name: 'monthly' }">
          {{ getMonthName(currentMonth, 'long') }}
        </router-link>
      </li>
      <li class="c-tabs__tab">
        <router-link :to="{ name: 'yearly' }">
          {{ getCurrentYear(currentYear) }}
        </router-link>
      </li>
      <li class="c-tabs__tab">
        <router-link :to="{ name: 'lists' }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M.5 2.5h2m-2 4h2m-2 4h2m-2 4h2m3-12h10m-10 4h6m-6 4h10m-10 4h5"/></svg>
          {{ t("Lists") }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>