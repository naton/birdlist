<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import ListView from "@/components/ListView.vue";

const props = defineProps(["observations"]);
const emit = defineEmits(["openDialog", "sort", "edit"]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy, shareBirdList } = listsStore;
const { currentSort, currentList } = storeToRefs(listsStore);

function edit() {
  emit("edit")
}

const isListOwner = computed(() => currentUser.value.name === currentList.owner);

onMounted(async () => {
  /* Load list from hash in URL, if available */
  if (!!document.location.hash && document.location.hash.startsWith("#lst")) {
    const listId = document.location.hash.replace("#", "");
    const list = await db.lists.get(listId);
    currentList.value = list ? list : { id: "monthly" };
  }

  /* Prepare to celebrate new leader */
  const canvas = document.getElementById("canvas");

  if (typeof confetti !== "undefined") {
    newLeaderConfetti = await confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });
  }
});

let newLeaderConfetti;

async function celebrate() {
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  if (typeof newLeaderConfetti !== "undefined") {
    await newLeaderConfetti({
      angle: randomInRange(55, 105),
      spread: randomInRange(50, 70),
      particleCount: randomInRange(80, 120),
      origin: { y: 0.4 },
    });
  }
}
</script>

<template>
  <list-view
    :observations="props.observations"
    :sort="currentSort"
    @newLeader="celebrate"
    @sort="sortBy"
    @edit="edit"
  >
    <template v-slot:header>
      <div class="list-header">
        <div class="subtitle">
          <details>
            <summary class="heading">{{ currentList.title }}</summary>
            <p class="list-description">{{ currentList.description }}</p>
            <p class="list-owner">{{ t("Created_By") }} {{ currentList.owner }}</p>
            <button
              v-if="isListOwner"
              class="share-button"
              @click.stop="shareBirdList(currentList.id, currentList.title)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <g fill="var(--color-background-dim)">
                  <path
                    d="M4.5 5H7v5a1 1 0 0 0 2 0V5h2.5a.5.5 0 0 0 .376-.829l-3.5-4a.514.514 0 0 0-.752 0l-3.5 4A.5.5 0 0 0 4.5 5Z"
                  />
                  <path d="M14 7h-3v2h3v5H2V9h3V7H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                </g>
              </svg>
              {{ t("Share") }}
            </button>
          </details>
        </div>
      </div>
    </template>
  </list-view>
</template>
