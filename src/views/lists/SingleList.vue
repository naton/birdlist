<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { setupConfetti, celebrate } from "@/helpers";
import { useSettingsStore } from '@/stores/settings.js'
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
import ListInfo from "@/components/ListInfo.vue";
import EditListDialog from "@/components/EditListDialog.vue";
const ObservationList = defineAsyncComponent(() => import("@/components/ObservationList.vue"));

const route = useRoute();
const emit = defineEmits(["openDialog", "sort", "edit"]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentSort, currentList } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));

const editListDialog = ref(null);

const isListOwner = computed(() => currentUser.value?.name === currentList.value?.owner);

function updateList() {
  editListDialog.value.openModal();
}

function edit(obs) {
  emit("edit", obs)
}

onMounted(() => {
  setupConfetti();
});
</script>

<template>
  <edit-list-dialog ref="editListDialog" />
  <list-info>
    <template v-slot:extra>
      <button v-if="isListOwner" class="add" @click="updateList">
        {{ t("Edit_List") }}
      </button>
    </template>
  </list-info>
  <observation-list
    :observations="allListObservations"
    :sort="currentSort"
    :list="currentList"
    :comments="listComments"
    @newLeader="celebrate"
    @sort="sortBy"
    @edit="edit"
  >
  </observation-list>
</template>
