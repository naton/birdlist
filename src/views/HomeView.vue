<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { db } from "../db";
import ObservationsLists from "@/components/ObservationsLists.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsData from "@/components/BirdsData.vue";

const me = ref("unauthorized");
let loginInterval;
let userSubscription;
let invitesSubscription;

/* Invites */
const invites = ref([]);

/* Login */
const userIsLoggedIn = computed(() => me.value !== "unauthorized");

function login() {
  userSubscription = liveQuery(() => db.cloud.currentUser).subscribe(
    (user) => {
      if (user._value) {
        me.value = user._value.name.toLowerCase()
        clearInterval(loginInterval);
      }
    },
    (error) => {
      console.log(error);
    }
  );

  invitesSubscription = liveQuery(() => db.cloud.invites).subscribe(
    (invites) => {
      invites.value = invites;
    }
  );
}

/* Lists */
const currentList = ref("monthly");

function selectList(list) {
  // Calculated lists come as strings, others are full objects
  if (typeof list === "string") {
    currentList.value = { id: list };
  } else if (list && list.id) {
    currentList.value = list;
    history.replaceState(history.state, "", "#" + list.id);
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
  /* Try to login */
  loginInterval = setInterval(login, 100);

  /* Load list from hash in URL, if available */
  if (!!document.location.hash && document.location.hash.startsWith("#lst")) {
    const listId = document.location.hash.replace("#", "");
    const list = await db.lists.get(listId);
    currentList.value = list;
  }

  /* Prepare to celebrate new leader */
  const canvas = document.getElementById("canvas");

  if (typeof confetti !== "undefined") {
    newLeaderConfetti = await confetti.create(canvas, {
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
  userSubscription.unsubscribe();
  invitesSubscription.unsubscribe();
});
</script>

<template>
  <div class="invites" v-if="invites.length">
    <h1>🎉 Du har blivit inbjuden till en lista!</h1>
    <ul>
        <li v-for="invite in invites" :key="invite.id">
          Du har blivit inbjuden av {{ invite.invitedBy?.name }} till <b>{{ invite.realm?.name }}</b>.
          <button class="btn" @click=invite.accept()>Tacka ja</button>
          <button class="btn" @click=invite.reject()>Avstå</button>
        </li>
    </ul>
  </div>

  <div class="body">
    <observations-lists @selectList="selectList" @newLeader="celebrate" :list="currentList" :user="me" :key="me" />
    <button class="login-button" @click="login()" v-if="!userIsLoggedIn">
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

#canvas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}
</style>
