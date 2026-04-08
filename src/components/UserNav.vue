<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import UserInitial from "./icons/UserInitial.vue";
import { useFriendsStore } from "@/stores/friends.js";
import { useSettingsStore } from "@/stores/settings.js";
import { toSafeUserLabel } from "@/helpers";

const selectedUser = defineModel('selectedUser');

const friendsStore = useFriendsStore();
const { getFriendlyName } = friendsStore;
const settingsStore = useSettingsStore();
const { currentUser } = storeToRefs(settingsStore);

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  showForSingle: {
    type: Boolean,
    default: false,
  },
});

const shouldShowUserNav = computed(() => {
  const count = props.users?.length || 0;
  return props.showForSingle ? count > 0 : count > 1;
});
const currentUserAliases = computed(() => {
  return [
    currentUser.value?.userId,
    currentUser.value?.email,
    currentUser.value?.name,
  ].filter(Boolean);
});

function changeUser(user) {
  selectedUser.value = user === selectedUser.value ? null : user;
}

function isCurrentUser(user) {
  return currentUserAliases.value.includes(user);
}

function getDisplayName(user) {
  return toSafeUserLabel(user, getFriendlyName(user));
}
</script>

<template>
    <nav class="user-nav" v-if="shouldShowUserNav">
        <transition-group name="list" appear>
            <button v-for="{ name, score, leader } in props.users" class="user-button" :class="name === selectedUser && 'user-button--active'" @click="changeUser(name)" :key="name">
                <user-initial :user="name" :initial-label="getDisplayName(name)" :color-key="name" :score="score" :leader="leader">
                    <span :class="isCurrentUser(name) && 'me'">{{ getDisplayName(name) }}</span>
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
