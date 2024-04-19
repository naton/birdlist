<script setup>
import { ref, computed, defineAsyncComponent, onBeforeMount, onMounted, onBeforeUnmount, toRaw } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { setupConfetti, destroyConfetti, celebrate } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
import ListInfo from "@/components/ListInfo.vue";
import EditListDialog from "@/components/EditListDialog.vue";
const BirdstreakList = defineAsyncComponent(() => import("@/components/BirdstreakList.vue"));
const CheckList = defineAsyncComponent(() => import("@/components/CheckList.vue"));
const NormalList = defineAsyncComponent(() => import("@/components/NormalList.vue"));

const emit = defineEmits(["openDialog", "sort", "edit"]);

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy, updateList } = listsStore;
const { allLists, currentSort, currentList } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

const checkListEditMode = ref(false);

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));

const editDialog = ref(null);

const isListOwner = computed(() => currentUser.value?.userId === currentList.value?.owner);

function openModal() {
  editDialog.value.openModal();
}

function edit(obs) {
  emit("edit", obs)
}

function saveCheckList(birds) {
  birds = toRaw(birds);
  const payload = Object.assign({}, currentList.value, { birds });
  updateList(payload);
  checkListEditMode.value = false;
}

onBeforeMount(async () => {
  currentList.value = await allLists.value?.find((list) => list.id == route.params.id);
});

onMounted(() => {
  setupConfetti();
});

onBeforeUnmount(() => {
  destroyConfetti();
});
</script>

<template>
  <edit-list-dialog ref="editDialog" />
  <list-info>
    <template v-slot:extra>
      <button v-if="isListOwner" class="add secondary" @click="openModal">
        {{ t("Edit_List") }}
      </button>
      <button v-if="isListOwner && (currentList.type === 'checklist' || currentList.type === 'bingo')" class="secondary" @click="checkListEditMode = !checkListEditMode">
        {{ !checkListEditMode ? t("Edit_Birds") : t("Cancel") }}
      </button>
    </template>
  </list-info>
  <birdstreak-list v-if="currentList && currentList.type === 'birdstreak'"
    :key="`${currentList}-birdstreak`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"></birdstreak-list>
  <check-list v-else-if="currentList && (currentList.type === 'checklist' || currentList.type === 'bingo')"
    :key="`${currentList}-checklist`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    :edit="checkListEditMode"
    @save="saveCheckList"
    @newLeader="celebrate"></check-list>
  <normal-list v-else-if="currentList"
    :key="`${currentList}-normal`"
    :observations="allListObservations"
    :sort="currentSort"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"
    @sort="sortBy"
    @edit="edit"
  >
  </normal-list>
</template>
