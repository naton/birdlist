<script setup>
import { ref } from "vue";
import { db } from "../db";

const emit = defineEmits(["activate"]);

const showCreateListDialog = ref(false);
const title = ref("");
const description = ref("");

function openModal() {
  showCreateListDialog.value = true;
  setTimeout(() => {
    document.querySelector(".dialog input").focus();
  }, 100);
}

function closeModal() {
  showCreateListDialog.value = false;
}

async function createList() {
  // Insert the list in the db with title and descripton
  const newId = await db.lists.add({
    title: title.value,
    description: description.value,
  });
  // Fetch the list to activate it
  const list = await db.lists.get(newId);
  emit("activate", list);
  closeModal();
}
</script>

<template>
  <li class="c-tabs__tab last">
    <button class="add" @click.stop="openModal">Ny lista…</button>
    <div class="dialog create-list-dialog" v-if="showCreateListDialog">
      <input
        class="margin-bottom"
        type="text"
        v-model="title"
        @keyup.enter="createList()"
        @keyup.esc="closeModal"
        placeholder="Skriv namn på listan…"
      />
      <textarea
        class="margin-bottom"
        id="description"
        v-model="description"
        cols="30"
        rows="10"
        placeholder="Ev tävlingsregler, syften med listan, etc"
      ></textarea>
      <div>
        <button class="create" @click="createList(title)">Skapa lista</button>
        <button @click="closeModal">Avbryt</button>
      </div>
    </div>
  </li>
</template>
