<script setup>
import { storeToRefs } from "pinia";
import UserInitial from "./icons/UserInitial.vue";
import { useFriendsStore } from "@/stores/friends.js";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
const { selectedUser } = storeToRefs(settingsStore);

const friendsStore = useFriendsStore();
const { getFriendlyName } = friendsStore;
const { currentUser } = storeToRefs(friendsStore);

const props = defineProps(["users"]);

function changeUser(user) {
  selectedUser.value = user === selectedUser.value ? null : user;
}
</script>

<template>
    <nav class="user-nav" v-if="props.users?.length > 1">
        <transition-group name="list" appear>
            <button v-for="{ name, score, leader } in props.users" class="user-button" :class="name === selectedUser && 'user-button--active'" @click="changeUser(name)" :key="name">
                <user-initial :user="name" :score="score" :leader="leader">
                    <span :class="name === currentUser && 'me'">{{ getFriendlyName(name) }}</span>
                </user-initial>
            </button>
        </transition-group>
    </nav>
</template>

<style>
.user-nav {
  position: sticky;
  top: 0;
  display: flex;
  flex-shrink: 0;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  overflow: auto;
  white-space: nowrap;
  box-shadow: rgb(0 0 0 / 10%) 0 6px 8px 0;
  z-index: 1;
}

.user-button {
  flex-shrink: 1;
  min-width: 6rem;
  max-width: 33%;
  margin: 0;
  padding: 5px 0 0;
  color: inherit;
  background: none;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.user-button .user {
  width: 2.5rem;
  height: 2.5rem;
}

.user-button .me::before {
  content: "Jag:";
  display: inline-block;
  position: absolute;
  left: 0.1em;
  font-style: italic;
  font-size: 0.8em;
}

.user-button--active .user {
  box-shadow: inset 0 0 0 3px var(--color-text);
}
</style>