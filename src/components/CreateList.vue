<script setup>
import { ref } from "vue";
import { db } from "../db";
import { getTiedRealmId } from "dexie-cloud-addon";

const emit = defineEmits(["activate"]);

const showCreateListDialog = ref(false);
const title = ref("");

function openModal() {
  showCreateListDialog.value = true;
  setTimeout(() => {
    document.querySelector("dialog input").focus();
  }, 100);
}

function closeModal() {
  showCreateListDialog.value = false;
}

async function createList(title) {
  let id = await db.lists.add({ title: title });
  let realmId = getTiedRealmId(id);
  emit("activate", id, title, realmId);
  closeModal();
}
</script>

<template>
  <li class="c-tabs__tab">
    <button class="add" @click.prevent="openModal">Skapa ny lista…</button>
    <dialog :open="showCreateListDialog">
      <input
        type="text"
        v-model="title"
        @keyup.enter="createList(title)"
        @keyup.esc="closeModal"
        placeholder="Enter list name…"
      />
      <div>
        <button class="create" @click.prevent="createList(title)">
          Skapa lista
        </button>
        <button class="cancel" @click.prevent="closeModal">Avbryt</button>
      </div>
    </dialog>
  </li>
</template>

<style scoped>
input {
  max-width: 80vw;
  font-size: 2rem;
}
.add {
  align-self: center;
  margin-right: 0.5rem;
  margin-left: 1rem;
  padding-right: 1rem;
  padding-left: 1rem;
}

.cancel {
  margin-left: 1rem;
}

.create {
  margin-top: 1rem;
}

dialog {
  position: fixed;
  top: 1%;
  left: 1%;
  width: 98%;
  height: 98%;
  padding-bottom: 30%;
  place-content: center;
  z-index: 1;
}

dialog[open] {
  display: grid;
}

dialog::backdrop {
  background: #000000cc;
}
</style>
