<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import ObservationsLists from "@/components/ObservationsLists.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsData from "@/components/BirdsData.vue";

const me = ref("unauthorized");

/* Login */
const userIsLoggedIn = computed(() => me.value !== "unauthorized");

let userSubscription;

setTimeout(
  () =>
    (userSubscription = liveQuery(async () => await db.cloud.currentUser).subscribe(
      (user) => {
        me.value = user._value ? user._value.name.toLowerCase() : "unauthorized";
      },
      (error) => {
        console.log(error);
      }
    )),
  400
);

/* Lists */
const currentList = ref("monthly");

function scrollToBottom(el) {
  document.querySelector(el).scrollTo(0, document.querySelector(el).scrollHeight + 40);
}

function selectList(list) {
  // Calculated lists come as strings, others are full objects
  if (typeof list === "string") {
    currentList.value = { id: list };
  } else {
    currentList.value = list;
    history.replaceState(list.name, null, "#" + list.id);
  }
}

/* Observations */
async function addObservation(ev, listId, location) {
  const isCalculatedList = currentList.value.id == "monthly" || currentList.value.id == "everything";

  await db.observations.add({
    name: ev.target.value.trim(),
    date: new Date(),
    realmId: isCalculatedList ? undefined : currentList.value.realmId,
    listId: isCalculatedList ? undefined : currentList.value.id, // Any ID other than defaults are valid here
    location: location,
  });

  // Reset form field value
  ev.target.value = "";
}

let newLeaderConfetti;

onMounted(async () => {
  /* Load list from hash  in URL */
  if (!!location.hash && location.hash.startsWith("#lst")) {
    const listId = location.hash.replace("#", "");
    const list = await db.lists.get(listId);
    currentList.value = list;
  }

  /* Prepare to celebrate new leader */
  const canvas = document.getElementById("canvas");

  if (typeof confetti !== "undefined") {
    newLeaderConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });
  }
});

async function celebrate() {
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  if (typeof newLeaderConfetti !== "undefined") {
    await newLeaderConfetti({
      angle: randomInRange(55, 105),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(80, 120),
      origin: { y: 0.4 },
    });
  }
}

onUnmounted(() => {
  newLeaderConfetti.reset();
  userSubscription.unsubscribe();
});
</script>

<template>
  <div class="body">
    <observations-lists @selectList="selectList" @newLeader="celebrate" :list="currentList" :user="me" />
    <button class="login-button" @click="db.cloud.login()" v-if="!userIsLoggedIn">
      <u>Logga in</u> för att hämta sparade 🐦
    </button>
  </div>
  <div class="footer">
    <observation-input @add="addObservation" :list="currentList" />
    <birds-data />
  </div>
  <canvas id="canvas"></canvas>
</template>

<style>
.login-button {
  margin: 0.5rem 1rem;
  box-shadow: rgb(17 17 26 / 20%) 0 2px 12px;
}

.dxc-login-dlg input[type] {
  width: auto !important;
  max-width: 100%;
  margin-bottom: 1rem;
}

#canvas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}
</style>
