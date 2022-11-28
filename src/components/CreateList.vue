<script setup>
import { ref } from "vue";
import { db } from "../db";

const emit = defineEmits(["activate"]);

const showCreateListDialog = ref(false);
const title = ref("");

function openModal() {
  showCreateListDialog.value = true;
  setTimeout(() => {
    document.querySelector(".dialog input").focus();
  }, 100);
}

function closeModal() {
  showCreateListDialog.value = false;
}

async function createList(title) {
  const newId = await db.lists.add({ title: title });
  const list = await db.lists.get({ id: newId });
  emit("activate", list);
  closeModal();
}
</script>

<template>
  <li class="c-tabs__tab last">
    <button class="add" @click.stop="openModal">Ny lista…</button>
    <div class="dialog create-list-dialog" v-if="showCreateListDialog">
      <input
        type="text"
        v-model="title"
        @keyup.enter="createList(title)"
        @keyup.esc="closeModal"
        placeholder="Skriv namn på listan…"
      />
      <div>
        <button class="create" @click="createList(title)">Skapa lista</button>
        <button @click="closeModal">Avbryt</button>
      </div>
    </div>
  </li>
</template>

<style>
.c-tabs__tab.last {
  margin-left: auto;
}

.c-tabs__tab .add {
  align-self: center;
  margin-right: 1rem;
  margin-left: 1rem;
  padding-right: 1rem;
  padding-left: 1rem;
}

.create-list-dialog input {
  max-width: 90vw;
  font-size: 2rem;
}

.create-list-dialog .create {
  margin-top: 1rem;
}
</style>
