<script setup>
import { db } from "../db";
import { useObservable } from "@vueuse/rxjs";
import { useSettingsStore } from '../stores/settings.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore

/* Invites */
const listInvites = useObservable(db.cloud.invites);
</script>

<template>
    <div class="invites" v-if="listInvites.length">
        <h2>🎉 {{ t("You_Have_Been_Invited_To_A_List") }}!</h2> 
        <ul>
            <li v-for="invite in listInvites" :key="invite.id">
                <p>{{ t("You_Have_Been_Invited_To_The_List") }} <b>{{ invite.realm?.name }}</b> {{ t("By").toLowerCase() }} {{ invite.invitedBy?.name }}.</p>
                <button class="btn" @click="invite.accept()">{{ t("Accept") }}</button>
                <button class="btn" @click="invite.reject()">{{ t("Deny") }}</button>
            </li>
        </ul>
    </div>
</template>

<style>
.invites {
  position: absolute;
  top: 32%;
  right: 1rem;
  left: 1rem;
  z-index: 1;
  padding: 1rem;
  border-radius: var(--radius);
  box-shadow: 0 3px 12px rgb(0 0 0 / 15%);
  color: var(--color-text);
  background: var(--color-background-dim);
  text-align: center;
}

.invites ul {
  margin: 1rem;
  list-style: none;
}

.invites p {
  margin: 1rem 0.5rem 0.25rem;
}

.invites b {
  font-weight: bold;
}
</style>
