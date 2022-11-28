<script setup>
import { ref, computed, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import ObservationsLists from "@/components/ObservationsLists.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsData from "@/components/BirdsData.vue";

const me = ref(null);

/* Login */
const userIsLoggedIn = computed(() => me.value !== "Unauthorized");

let userSubscription;

setTimeout(
  () =>
    (userSubscription = liveQuery(
      async () => await db.cloud.currentUser
    ).subscribe(
      (user) => {
        me.value = user._value ? user._value.name : null;
      },
      (error) => {
        console.log(error);
      }
    )),
  500
);

/* Lists */
const currentList = ref("monthly");

function scrollToBottom(el) {
  document
    .querySelector(el)
    .scrollTo(0, document.querySelector(el).scrollHeight + 40);
}

function selectList(list) {
  if (typeof list === "string") {
    currentList.value = { id: list };
  } else {
    currentList.value = list;
  }
}

/* Observations */
async function addObservation(ev, listId, location) {
  const isCalculatedList =
    currentList.value.id == "monthly" || currentList.value.id == "everything";

  await db.observations.add({
    name: ev.target.value,
    date: new Date(),
    realmId: isCalculatedList ? undefined : currentList.value.realmId,
    listId: isCalculatedList ? undefined : currentList.value.id, // Any ID other than defaults are valid here
    location: location,
  });

  // Reset form field value
  ev.target.value = "";

  // Make sure new value is instantly visible in viewport
  setTimeout(() => {
    scrollToBottom(".body-content");
  }, 100);
}

onUnmounted(() => {
  userSubscription.unsubscribe();
});
</script>

<template>
  <div class="body">
    <observations-lists
      @selectList="selectList"
      :list="currentList"
      :user="me"
    />
  </div>
  <div class="footer">
    <button
      class="login-button"
      @click="db.cloud.login()"
      v-if="!userIsLoggedIn"
    >
      Logga in (för att synka med sparade obsar)
    </button>
    <observation-input @add="addObservation" :list="currentList" />
    <birds-data />
  </div>
</template>

<style>
.login-button {
  width: 100%;
}
</style>
