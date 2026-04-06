<script setup>
import { onBeforeMount } from "vue";
import vue3SimpleTypeahead from "vue3-simple-typeahead";
import UserNav from "./UserNav.vue";
import BirdItem from "./BirdItem.vue";
import SvgChart from "./SvgChart.vue";
import { useCheckableList } from "@/composables/useCheckableList";
import "vue3-simple-typeahead/dist/vue3-simple-typeahead.css"; // Optional default CSS

const emit = defineEmits(["newLeader"]);
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
  currentLeader,
  birdsToCheck,
  addListBirdInput,
  checkListBirds,
  users,
  addListBird,
  checkBird,
  removeBird,
  saveCheckList,
  initializeBirdsFromList,
} = useCheckableList(props);

function emitNewLeader() {
  emit("newLeader");
}

onBeforeMount(() => {
  initializeBirdsFromList();
});
</script>

<template>
  <user-nav
    :users="users"
    v-model:selectedUser="selectedUser" />

  <svg-chart v-if="users?.length > 1"
    :observations="props.observations"
    :users="users"
    :selectedUser="selectedUser"
    :currentLeader="currentLeader"
    @newLeader="emitNewLeader"></svg-chart>

  <section class="check-list">
    <p v-if="props.readOnly" class="center margin-bottom">{{ t("List_Is_Read_Only_For_You") }}</p>
    <div v-if="checkListBirds.length">
      <div v-if="props.observations.length" class="center margin-bottom">
        <progress :value="props.observations.length" :max="birdsToCheck.length"></progress>
        <span class="pill">{{ props.observations.length }} / {{ birdsToCheck.length }} {{ t("Species").toLowerCase() }} ({{ Math.round((props.observations.length / birdsToCheck.length) * 100) }}%)</span>
      </div>
      <ul class="list">
        <bird-item v-for="bird in checkListBirds"
          :key="bird.name"
          :bird="bird.name"
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
    <button type="button" @click="saveCheckList">{{ t("Save") }}</button>
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
}
</style>
