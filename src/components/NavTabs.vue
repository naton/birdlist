<script setup>
import { getCurrentYear, getMonthName } from "@/helpers";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();
const { currentMonth, currentYear } = storeToRefs(settingsStore);
</script>

<template>
  <nav class="body-nav">
    <picture class="logo">
      <source srcset="/logo.webp" type="image/webp" />
      <img src="/logo.png" alt="Birdlist" width="65" height="24" />
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
    </ul>
  </nav>
</template>