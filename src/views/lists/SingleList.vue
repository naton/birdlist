<script setup>
import { ref, computed, onBeforeMount, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { setupConfetti, destroyConfetti, celebrate } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
import ListInfo from "@/components/ListInfo.vue";
import EditListDialog from "@/components/EditListDialog.vue";
import BirdstreakList from "@/components/BirdstreakList.vue";
import CheckList from "@/components/CheckList.vue";
import BingoList from "@/components/BingoList.vue";
import NormalList from "@/components/NormalList.vue";

const emit = defineEmits(["openDialog", "edit"]);

const route = useRoute();

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { allLists, currentList, checkListEditMode } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

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
    :key="`${currentList.id}-birdstreak`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"></birdstreak-list>
  <check-list v-else-if="currentList && currentList.type === 'checklist'"
    :key="`${currentList.id}-checklist`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"></check-list>
  <bingo-list v-else-if="currentList && currentList.type === 'bingo'"
    :key="`${currentList.id}-${currentList.bingoSize}-bingo`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"></bingo-list>
  <normal-list v-else-if="currentList"
    :key="`${currentList.id}-normal`"
    :observations="allListObservations"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"
    @edit="edit">
  </normal-list>
</template>
