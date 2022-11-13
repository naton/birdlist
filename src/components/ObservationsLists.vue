<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import ListView from "@/components/ListView.vue";
import EditDialog from "@/components/EditDialog.vue";
import { getMonthName } from "../helpers";

const componentKey = ref(0);
const props = defineProps(["list", "user"]);
const emit = defineEmits(["selectList"]);

const currentMonth = ref(new Date().getMonth());
const currentSort = ref("bydate");
const currentObservation = ref(false);
const allObservations = ref([]);
const tabList = ref([]);
const isListSelected = ref(false);
const isDialogOpen = ref(false);

/* Observations */
let observationsSubscription = liveQuery(
  async () => await db.observations.toArray()
).subscribe(
  (observations) => {
    allObservations.value = observations;
  },
  (error) => {
    console.log(error);
  }
);

const allMyObservations = computed(() => {
  return allObservations.value
    .filter((obs) => obs.owner == props.user)
    .sort((a, b) => a.date - b.date);
});

const allThisMonth = computed(() => {
  return allObservations.value
    .filter(
      (obs) =>
        obs.owner == props.user &&
        obs.date.getFullYear() == new Date().getFullYear() &&
        obs.date.getMonth() == currentMonth.value
    )
    .sort((a, b) => a.date - b.date);
});

const listObservations = computed(() => {
  const listId = props.list.id;
  return allObservations.value.filter((obs) => obs.listId == listId);
});

function selectObservation(obs) {
  currentObservation.value =
    obs && currentObservation.value && currentObservation.value.id == obs.id
      ? false
      : obs;
}

async function deleteObservation(id) {
  db.observations.delete(id);
}

function editObservation(obs) {
  componentKey.value += 1; // refresh modal component
  currentObservation.value = obs;
  isDialogOpen.value = true;
}

function goToMonth(month) {
  currentMonth.value = month;
  emit("selectList", "monthly");
}

function totalPerMonth(month) {
  return allObservations.value.filter(
    (obs) =>
      obs.owner == props.user &&
      obs.date.getFullYear() == new Date().getFullYear() &&
      obs.date.getMonth() == month
  ).length;
}

function sortBy(val) {
  return (currentSort.value = val);
}

function closeObservationDialog() {
  isDialogOpen.value = false;
}

/* Lists */
let listsSubscription = liveQuery(
  async () => await db.lists.toArray()
).subscribe(
  (lists) => {
    tabList.value = lists;
  },
  (error) => {
    console.log(error);
  }
);

const currentMonthFormatted = computed(() => {
  const date = new Date().setMonth(currentMonth.value);
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
    month: "long",
  }).format(date);
});

async function deleteList(listId) {
  let deleteRelatedObservations = false;

  if (confirm("Är du säker på att du vill ta bort denna lista?")) {
    deleteRelatedObservations = confirm("Radera även listans observationer?");

    await db
      .transaction(
        "rw",
        [db.lists, db.observations, db.realms, db.members],
        () => {
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
        }
      )
      .then(() => {
        emit("selectList", "monthly");
      });
  }
}

async function shareBirdList(listId, listName) {
  let email = prompt(
    "Ange e-postadressen till personen du vill dela denna lista med:"
  );

  if (!email) return;

  await db.transaction(
    "rw",
    [db.lists, db.observations, db.realms, db.members],
    async () => {
      // Add or update a realm, tied to the list using getTiedRealmId():
      const realmId = getTiedRealmId(listId);

      await db.realms.put({
        realmId,
        name: listName,
        represents: "a bird list",
      });

      // Move list into the realm (if not already there):
      await db.lists.update(listId, { realmId });
      // Move all items into the new realm consistently (modify() is consistent across sync peers)
      await db.observations
        .where({ listId: listId })
        .modify({ realmId: realmId });
      // Add the members to share it to:
      await db.members.add({
        realmId,
        email: email,
        invite: true, // Generates invite email on server on sync
        permissions: {
          add: ["observations"],
          update: {
            lists: ["title"],
            observations: "*",
          },
          // manage: "*", // Give your friend full permissions within this new realm.
        },
      });
    }
  );
}

function selectList(list) {
  emit("selectList", list);
}

/* Other */
function getSlotName(tab) {
  return `tabPanel-${tab}`;
}

onMounted(() => {
  emit("selectList", "monthly");
});

onUnmounted(() => {
  observationsSubscription.unsubscribe();
  listsSubscription.unsubscribe();
});
</script>

<template>
  <tabs-list
    :tabList="tabList"
    :currentList="props.list"
    @activate="selectList"
  >
    <template v-slot:[getSlotName(props.list.id)]>
      <div class="body-content">
        <list-view
          v-if="props.list.id === 'monthly'"
          :observations="allThisMonth"
          :sort="currentSort"
          :selected="currentObservation"
          :user="props.user"
          @sort="sortBy"
          @select="selectObservation"
          @edit="editObservation"
        >
          <template v-slot:header>
            <div class="list-header month-nav">
              <button class="prev-month" @click.prevent="currentMonth--">
                «
              </button>
              <h2 class="heading center">
                {{ currentMonthFormatted }}
              </h2>
              <button class="next-month" @click.prevent="currentMonth++">
                »
              </button>
            </div>
          </template>
        </list-view>

        <list-view
          v-else-if="props.list.id === 'everything'"
          :observations="allMyObservations"
          :selected="currentObservation"
          :sort="currentSort"
          :user="props.user"
          @sort="sortBy"
          @select="selectObservation"
          @edit="editObservation"
        >
          <template v-slot:header>
            <div class="list-header">
              <h2 class="heading center">Årskryss</h2>
            </div>
            <div class="center sidescroll">
              <table class="year-summary">
                <tbody>
                  <tr>
                    <td v-for="n in 12" :key="n">
                      {{ getMonthName(n - 1) }}
                    </td>
                  </tr>
                  <tr>
                    <td v-for="n in 12" :key="n">
                      <button
                        class="month-button"
                        :class="totalPerMonth(n - 1) == '0' && 'secondary'"
                        @click="goToMonth(n - 1)"
                      >
                        {{ totalPerMonth(n - 1) }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </list-view>

        <list-view
          v-else
          :observations="listObservations"
          :selected="currentObservation"
          :sort="currentSort"
          :user="props.user"
          @sort="sortBy"
          @select="selectObservation"
          @edit="editObservation"
        >
          <template v-slot:header>
            <div
              class="list-header"
              :class="isListSelected && 'is-active'"
              @click="isListSelected = !isListSelected"
            >
              <div class="subtitle">
                <h2 class="heading">{{ props.list.title }}</h2>
                <button
                  class="share-button"
                  :class="
                    props.list.realmId === getTiedRealmId(props.list.id) &&
                    'is-shared'
                  "
                  @click.stop="shareBirdList(props.list.id, props.list.title)"
                  v-if="listObservations.length"
                >
                  Dela
                </button>
              </div>
              <button
                class="delete-button"
                @click.prevent="deleteList(props.list.id)"
              >
                ✕
              </button>
            </div>
          </template>
        </list-view>
      </div>
    </template>
  </tabs-list>
  <edit-dialog
    :key="componentKey"
    :isOpen="isDialogOpen"
    :observation="currentObservation"
    :lists="tabList"
    @delete="deleteObservation"
    @close="closeObservationDialog"
  />
</template>

<style>
.body-nav {
  grid-area: body-nav;
  display: flex;
  max-width: 100vw;
  overflow: hidden;
  background: var(--color-background-dim);
}

.body-content {
  grid-area: body-content;
  overflow: auto;
}

.list-header {
  overflow: hidden;
  padding: 0.5rem 0;
}

.sidescroll {
  overflow-x: auto;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prev-month {
  margin-left: 0.8rem;
}

.next-month {
  margin-right: 0.8rem;
}

.year-summary {
  margin: 0 auto 1.5rem;
  font-size: 0.9rem;
}

.month-button {
  min-width: 2rem;
  padding: 0.5rem;
}

.is-active.list-header {
  position: relative;
}

.list-header .subtitle {
  display: flex;
  align-items: center;
  padding-left: 0.8rem;
  background: var(--color-background);
  transition: 0.1s transform ease-out;
}

.list-header .share-button {
  position: absolute;
  top: 0.1rem;
  right: 0.8rem;
  margin-left: 1rem;
  padding-right: 1rem;
  padding-left: 1rem;
}

.share-button.is-shared::before {
  content: "√";
}

.is-active.list-header .subtitle {
  background: var(--color-background-dim);
  transform: translateX(-3rem);
}

.list-header .delete-button {
  position: absolute;
  top: 0.6rem;
  right: 0;
  outline: 1px solid;
  transform: translateX(3.1rem);
  transition: 0.1s transform ease-out;
}

.is-active.list-header .delete-button {
  transform: translateX(-0.1rem);
}
</style>
