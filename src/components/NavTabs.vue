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
          {{ t("Lists") }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>