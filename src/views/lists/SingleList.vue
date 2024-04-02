<script setup>
import { computed, defineAsyncComponent, onMounted } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { setupConfetti, celebrate } from "@/helpers";
import { useListsStore } from "@/stores/lists.js";
import { useObservationsStore } from "@/stores/observations.js";
import { useCommentsStore } from "@/stores/comments.js";
const ObservationList = defineAsyncComponent(() => import("@/components/ObservationList.vue"));

const route = useRoute();
const emit = defineEmits(["openDialog", "sort", "edit"]);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentSort, currentList } = storeToRefs(listsStore);

const observationsStore = useObservationsStore();
const { allListObservations } = storeToRefs(observationsStore);

const commentsStore = useCommentsStore()
const { allComments } = storeToRefs(commentsStore)

/* Comments */
const listComments = computed(() => allComments.value?.filter((comment) => comment.listId == route.params.id));

function edit() {
  emit("edit")
}

onMounted(() => {
  setupConfetti();
});
</script>

<template>
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
