<script setup>
import { ref } from "vue";
import { db } from "../db";

const showCreateListDialog = ref(false);
const listName = ref("");

const createList = async (listName) => {
  const id = await db.lists.add({ title: listName });
  return id;
};
</script>

<template>
  <button
    class="add"
    @click.prevent="showCreateListDialog = !showCreateListDialog"
  >
    Skapa ny lista
  </button>
  <dialog :open="showCreateListDialog">
    <input type="text" v-model="listName" />
    <div>
      <button class="create" @click.prevent="createList(listName)">
        Skapa lista
      </button>
      <button
        class="cancel"
        @click.prevent="showCreateListDialog = !showCreateListDialog"
      >
        Avbryt
      </button>
    </div>
  </dialog>
</template>

<style scoped>
input {
  font-size: 2rem;
}
.add {
  flex: 1;
  align-self: center;
  margin-right: 0.25rem;
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
