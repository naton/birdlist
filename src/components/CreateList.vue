<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings.js'
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";

const settingsStore = useSettingsStore()
const { t } = settingsStore
const { currentUser } = storeToRefs(settingsStore)

const props = defineProps(["list"]);
const emit = defineEmits(["activate"]);

const showListDialog = ref(false);
const title = ref("");
const description = ref("");
const isListOwner = computed(() => currentUser.value?.name === props.list.owner);

function openModal(hasTitle) {
  showListDialog.value = true;

  if (isListOwner.value && hasTitle) {
    title.value = props.list.title;
    description.value = props.list.description;
  } else {
    title.value = "";
    description.value = "";
  }

  setTimeout(() => {
    document.querySelector(".dialog input").focus();
  }, 100);
}

function closeModal() {
  showListDialog.value = false;
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

async function updateList(listId) {
  await db.transaction("rw", [db.lists], async () => {
    await db.lists.where({ id: listId }).modify({ title: title.value, description: description.value });
  });
  closeModal();
}

async function deleteList(listId) {
  let deleteRelatedObservations = false;

  if (confirm("Är du säker på att du vill ta bort denna lista?")) {
    deleteRelatedObservations = confirm("Radera även listans observationer?");

    await db
      .transaction("rw", [db.lists, db.observations, db.realms, db.members], () => {
        if (deleteRelatedObservations) {
          // Delete possible observations:
          db.observations.where({ listId: listId }).delete();
        }
        // Delete the list:
        db.lists.delete(listId);
        // Delete possible realm and its members in case list was shared:
        const tiedRealmId = getTiedRealmId(listId);
        // Empty out any tied realm from members:
        db.members.where({ realmId: tiedRealmId }).delete();
        // Delete the tied realm if it exists:
        db.realms.delete(tiedRealmId);
      })
      .then(() => {
        emit("activate", "monthly");
        showListDialog.value = false;
        document.location.hash = "";
      });
  }
}
</script>

<template>
  <li class="c-tabs__tab last">
    <button class="add" @click.stop="openModal(props.list.title)">
      <span v-if="isListOwner && props.list.title">{{ t("Edit_List") }}</span>
      <span v-else>{{ t("New_List") }}…</span>
    </button>
    <div class="dialog create-list-dialog" v-if="showListDialog">
      <input class="margin-bottom" type="text" v-model="title" @keyup.esc="closeModal" :placeholder="t('Enter_The_Name_Of_The_List')" />
      <textarea class="margin-bottom" id="description" v-model="description" cols="30" rows="10" :placeholder="t('List_Rules_Etc')"></textarea>
      <div class="buttons">
        <button v-if="isListOwner && props.list.title" class="update-button" @click="updateList(props.list.id)">{{ t("Save") }}</button>
        <button v-if="isListOwner && props.list.title" class="delete-button" @click="deleteList(props.list.id)">
          <svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" stroke-miterlimit="10">
              <path stroke-linecap="square" d="M20 9v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" />
              <path stroke-linecap="square" d="M1 5h22" />
              <path stroke-linecap="square" d="M12 12v6m-4-6v6m8-6v6" />
              <path d="M8 5V1h8v4" />
            </g>
          </svg>
          {{ t("Delete") }}
        </button>
        <button v-else class="create" @click="createList(title)">{{ t("Create_List") }}</button>
        <button @click="closeModal">{{ t("Cancel") }}</button>
      </div>
    </div>
  </li>
</template>

<style>
.buttons {
  display: flex;
  align-items: center;
  margin-top: 1rem;
}

.buttons button {
  display: inline-flex;
  align-items: center;
}
</style>