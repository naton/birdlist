<script setup>
import { ref } from "vue";
import { db } from "../db";
import ObservationsLists from "@/components/ObservationsLists.vue";
import ObservationInput from "@/components/ObservationInput.vue";
import BirdsData from "@/components/BirdsData.vue";

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

async function addObservation(ev) {
  const isCalculatedList =
    currentList.value.id == "monthly" || currentList.value.id == "everything";

  await db.observations.add({
    name: ev.target.value,
    date: new Date(),
    realmId: isCalculatedList ? undefined : currentList.value.realmId,
    listId: isCalculatedList ? undefined : currentList.value.id, // Any ID other than defaults are valid here
  });

  // Reset form field value
  ev.target.value = "";

  // Make sure new value is instantly visible in viewport
  setTimeout(() => {
    scrollToBottom(".body-content");
  }, 100);
}

if (typeof HTMLDialogElement !== "function") {
  document.documentElement.classList.add("no-dialog");
}
</script>

<template>
  <div class="body">
    <observations-lists @selectList="selectList" :list="currentList" />
  </div>
  <div class="footer">
    <observation-input @add="addObservation" :list="currentList" />
    <birds-data />
  </div>
</template>
