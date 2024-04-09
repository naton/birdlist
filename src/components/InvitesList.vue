<script setup>
import { db } from "../db";
import { useObservable } from "@vueuse/rxjs";
import { useRouter } from "vue-router";
import { useSettingsStore } from '../stores/settings.js'

const router = useRouter()
const settingsStore = useSettingsStore()
const { t } = settingsStore

/* Invites */
const listInvites = useObservable(db.cloud.invites);

function acceptAndGoToLists(invite) {
  invite.accept();
  router.push({ name: "lists" });
}
</script>

<template>
  <dialog :open="listInvites.find(invite => !invite.rejected)" class="invites dialog">
    <h2>🎉 {{ t("You_Have_Been_Invited_To_A_List") }}!</h2>
    <ul>
      <li v-for="invite in listInvites.filter(invite => !invite.rejected)" :key="invite.id">
        <p>{{ t("You_Have_Been_Invited_To_The_List") }} <b>{{ invite.realm?.name }}</b> {{ t("By").toLowerCase() }} {{ invite.invitedBy?.name }}.</p>
        <button type="button" class="btn" @click="acceptAndGoToLists(invite)">{{ t("Accept") }}</button>
        <button type="button" class="btn" @click="invite.reject()">{{ t("Deny") }}</button>
      </li>
    </ul>
  </dialog>
</template>

<style>
.dialog.invites[open] {
  margin-top: 10%;
  box-shadow: 0 3px 12px rgb(0 0 0 / 15%);
  background: var(--color-background-dim);
  text-align: center;
  z-index: 1;
}

.invites ul {
  margin: 1rem;
  list-style: none;
}

.invites p {
  margin: 1rem 0.5rem 1rem;
}

.invites b {
  font-weight: bold;
}
</style>
