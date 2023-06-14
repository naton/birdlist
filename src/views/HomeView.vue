<script setup>
import { ref, onMounted } from "vue";
import { db } from "../db";
import { useObservable } from "@vueuse/rxjs";
import ObservationsLists from "@/components/ObservationsLists.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsData from "@/components/BirdsData.vue";

/* Me */
const currentUser = useObservable(db.cloud.currentUser);

/* Invites */
const listInvites = useObservable(db.cloud.invites);

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
  let bird = ev.target.value;
  let date = new Date();
  const isBatchImport = bird.includes(","); // Probably multiple birds
  const hasCustomDate = bird.startsWith("20") && bird.includes(":"); // Probably a date

  if (hasCustomDate) {
    const customDate = new Date(bird.split(":")[0]);
    date = isNaN(customDate) ? new Date() : customDate;
    bird = bird.split(":")[1];
  }

  async function add(bird) {
    await db.observations.add({
      name: bird.trim(),
      date: date,
      realmId: isCalculatedList ? undefined : currentList.value.realmId,
      listId: isCalculatedList ? undefined : currentList.value.id, // Any ID other than defaults are valid here
      location: location,
    });
  }

  if (isBatchImport) {
    const birds = bird.split(",");
    birds.forEach(async (bird) => add(bird));
  } else {
    add(bird);
  }

  // Reset form field value
  ev.target.value = "";
}

let newLeaderConfetti;

onMounted(async () => {
  /* Load list from hash in URL, if available */
  if (!!document.location.hash && document.location.hash.startsWith("#lst")) {
    const listId = document.location.hash.replace("#", "");
    const list = await db.lists.get(listId);
    currentList.value = list ? list : { id: "monthly" };
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
</script>

<template>
  <div class="invites" v-if="listInvites.length">
    <h2>🎉 Du har blivit inbjuden till en lista!</h2> 
    <ul>
        <li v-for="invite in listInvites" :key="invite.id">
          <p>Du har blivit inbjuden till listan <b>{{ invite.realm?.name }}</b> av {{ invite.invitedBy?.name }}.</p>
          <button class="btn" @click="invite.accept()">Tacka ja</button>
          <button class="btn" @click="invite.reject()">Avstå</button>
        </li>
    </ul>
  </div>

  <div class="body">
    <observations-lists @selectList="selectList" @newLeader="celebrate" :list="currentList" :user="currentUser.name" :key="currentUser.name" />
  </div>
  <div class="footer">
    <observation-input @add="addObservation" :list="currentList" />
    <birds-data />
  </div>
  <canvas id="canvas"></canvas>
</template>

<style>
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

.invites p {
  margin: 1rem 0.5rem 0.25rem;
}

.invites b {
  font-weight: bold;
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
