<script setup>
import { onBeforeMount } from "vue";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import UserNav from "./UserNav.vue";
import BirdItem from "./BirdItem.vue";
import { useCheckableList } from "@/composables/useCheckableList";
import "vue3-simple-typeahead/dist/vue3-simple-typeahead.css"; // Optional default CSS

defineEmits(["newLeader"]);

const props = defineProps({
  list: Object,
  comments: Array,
  observations: {
    type: Array,
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const {
  t,
  birds,
  selectedUser,
  checkListEditMode,
  birdsToCheck,
  addListBirdInput,
  checkListBirds,
  users,
  addListBird,
  addAllBirdsFromRegion,
  checkBird,
  removeBird,
  saveCheckList,
  initializeBirdsFromList,
} = useCheckableList(props);

onBeforeMount(() => {
  initializeBirdsFromList();
});
</script>

<template>
  <user-nav
    :users="users"
    v-model:selectedUser="selectedUser" />

  <section class="check-list">
    <p v-if="props.readOnly" class="center margin-bottom">{{ t("List_Is_Read_Only_For_You") }}</p>
    <div v-else-if="checkListEditMode" class="checklist-mode-banner">
      <h2 class="heading">{{ t("Checklist_Setup_Mode") }}</h2>
      <p class="subtitle center">{{ t("Checklist_Setup_Help") }}</p>
    </div>
    <div v-else class="checklist-toolbar">
      <button type="button" class="secondary" data-action="edit-birds-inline" @click="checkListEditMode = true">
        {{ t("Edit_Birds") }}
      </button>
    </div>
    <div v-if="checkListBirds.length">
      <div v-if="props.observations.length" class="center margin-bottom">
        <progress :value="props.observations.length" :max="birdsToCheck.length"></progress>
        <span class="pill">{{ props.observations.length }} / {{ birdsToCheck.length }} {{ t("Species").toLowerCase() }} ({{ Math.round((props.observations.length / birdsToCheck.length) * 100) }}%)</span>
      </div>
      <ul class="list">
        <bird-item v-for="bird in checkListBirds"
          :key="bird.key"
          :bird="bird"
          :checked="bird.checked"
          :edit="checkListEditMode"
          @check="checkBird"
          @remove="removeBird"></bird-item>
      </ul>
    </div>
    <div v-else class="empty-list">
      {{ t("No_Birds_Added") }}
    </div>
  </section>

  <form v-if="checkListEditMode && !props.readOnly" class="add-bird fixed">
    <vue3-simple-typeahead ref="addListBirdInput" :placeholder="`${t('Add_Bird_To')} ${t('This_List').toLowerCase()}…`" :items="birds" :minInputLength="1" :itemProjection="(bird) => bird.name" @selectItem="(bird) => addListBird(bird)"></vue3-simple-typeahead>
    <div class="buttons">
      <button type="button" data-action="save-birds" @click="saveCheckList">{{ t("Save") }}</button>
      <button type="button" class="secondary" data-action="add-region-birds" @click="addAllBirdsFromRegion">
        {{ t("Add_All") }}
      </button>
      <button type="button" class="secondary" data-action="cancel-edit-birds" @click="checkListEditMode = false">
        {{ t("Cancel") }}
      </button>
    </div>
  </form>
</template>

<style>
progress {
  width: calc(100% - 2rem);
  margin: 0 1rem;
}

.check-list {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 9rem;
}

.checklist-mode-banner {
  display: grid;
  gap: 0.5rem;
  justify-items: center;
  margin-bottom: 1rem;
}

.checklist-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.checklist-toolbar button {
  min-width: 12rem;
}
</style>
