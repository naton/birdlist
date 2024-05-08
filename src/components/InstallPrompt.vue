<script setup>
import '@khmyznikov/pwa-install';
import { useSettingsStore } from '@/stores/settings.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore
</script>

<template>
  <pwa-install
    disable-screenshots="true"
    manifest-url="/site.webmanifest"
    name="Birdlist"
    :description="`${t('Log_Your_Bird_Observations')}. ${t('Make_Lists')}. ${t('Share_With_Friends')}.`"
    icon="/favicon-32x32.png">
  </pwa-install>
</template>