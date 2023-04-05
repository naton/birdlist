<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import ListView from "@/components/ListView.vue";
import EditDialog from "@/components/EditDialog.vue";
import { getCurrentYear, getMonthName } from "../helpers";

const componentKey = ref(0);
const props = defineProps(["list", "user"]);
const emit = defineEmits(["selectList", "newLeader"]);

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const currentSort = ref("bydate");
const currentObservation = ref(false);
const allObservations = ref([]);
const tabList = ref([]);
const isDialogOpen = ref(false);

/* Observations */
let observationsSubscription = liveQuery(async () => await db.observations.toArray()).subscribe(
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
    .filter((obs) => obs.date.getFullYear() == currentYear.value)
    .sort((a, b) => a.date - b.date);
});

const allThisMonth = computed(() => {
  return allObservations.value
    .filter(
      (obs) =>
        obs.owner == props.user &&
        obs.date.getFullYear() == currentYear.value &&
        obs.date.getMonth() == currentMonth.value
    )
    .sort((a, b) => a.date - b.date);
});

const listObservations = computed(() => {
  const listId = props.list.id;
  return allObservations.value.filter((obs) => obs.listId == listId);
});

function selectObservation(obs) {
  currentObservation.value = obs && currentObservation.value && currentObservation.value.id == obs.id ? false : obs;
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

function prevMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
}

function totalPerMonth(month) {
  return allObservations.value.filter(
    (obs) => obs.owner == props.user && obs.date.getFullYear() == currentYear.value && obs.date.getMonth() == month
  ).length;
}

function sortBy(val) {
  return (currentSort.value = val);
}

function closeObservationDialog() {
  isDialogOpen.value = false;
}

/* Lists */
let listsSubscription = liveQuery(async () => await db.lists.toArray()).subscribe(
  (lists) => {
    tabList.value = lists;
  },
  (error) => {
    console.log(error);
  }
);

const currentMonthFormatted = computed(() => {
  const date = new Date().setFullYear(currentYear.value, currentMonth.value);
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
        emit("selectList", "monthly");
      });
  }
}

async function shareBirdList(listId, listName) {
  let email = prompt("Ange e-postadressen till personen du vill dela denna lista med:");

  if (!email) return;

  await db.transaction("rw", [db.lists, db.observations, db.realms, db.members], async () => {
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
    await db.observations.where({ listId: listId }).modify({ realmId: realmId });
    // Add the members to share it to:
    await db.members.add({
      realmId,
      email: email,
      invite: true, // Generates invite email on server on sync
      permissions: {
        add: ["observations"],
        update: {
          lists: ["title"],
          observations: ["*", "realmId"],
        },
        // manage: "*", // Give your friend full permissions within this new realm.
      },
    });
  });
}

function selectList(list) {
  emit("selectList", list);
}

function newLeader() {
  emit("newLeader");
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
    :monthLabel="getMonthName(currentMonth, 'long')"
    :yearLabel="getCurrentYear(currentYear)"
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
            <div class="list-header date-nav">
              <button class="prev-date" @click.prevent="prevMonth">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
                  <path
                    fill="currentColor"
                    d="m9.854 1.646-1.5-1.5a.5.5 0 0 0-.708 0l-5.5 5.5a.5.5 0 0 0 0 .708l5.5 5.5a.5.5 0 0 0 .708 0l1.5-1.5a.5.5 0 0 0 0-.708L6.207 6l3.647-3.646a.5.5 0 0 0 0-.708Z"
                  />
                </svg>
              </button>
              <h2 class="heading center">
                {{ currentMonthFormatted }}
              </h2>
              <button class="next-date" @click.prevent="nextMonth">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
                  <path
                    fill="currentColor"
                    d="m2.146 10.354 1.5 1.5a.5.5 0 0 0 .708 0l5.5-5.5a.5.5 0 0 0 0-.708l-5.5-5.5a.5.5 0 0 0-.708 0l-1.5 1.5a.5.5 0 0 0 0 .708L5.793 6 2.146 9.646a.5.5 0 0 0 0 .708Z"
                  />
                </svg>
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
            <div class="list-header date-nav">
              <button class="prev-date" @click.prevent="currentYear--">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
                  <path
                    fill="currentColor"
                    d="m9.854 1.646-1.5-1.5a.5.5 0 0 0-.708 0l-5.5 5.5a.5.5 0 0 0 0 .708l5.5 5.5a.5.5 0 0 0 .708 0l1.5-1.5a.5.5 0 0 0 0-.708L6.207 6l3.647-3.646a.5.5 0 0 0 0-.708Z"
                  />
                </svg>
              </button>
              <h2 class="heading center">Årskryss {{ currentYear }}</h2>
              <button class="next-date" @click.prevent="currentYear++">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
                  <path
                    fill="currentColor"
                    d="m2.146 10.354 1.5 1.5a.5.5 0 0 0 .708 0l5.5-5.5a.5.5 0 0 0 0-.708l-5.5-5.5a.5.5 0 0 0-.708 0l-1.5 1.5a.5.5 0 0 0 0 .708L5.793 6 2.146 9.646a.5.5 0 0 0 0 .708Z"
                  />
                </svg>
              </button>
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
          @new-leader="newLeader"
          @sort="sortBy"
          @select="selectObservation"
          @edit="editObservation"
        >
          <template v-slot:header>
            <div class="list-header">
              <div class="subtitle">
                <details>
                  <summary class="heading">{{ props.list.title }}</summary>
                  <p>{{ props.list.description }}</p>
                <button class="share-button" @click.stop="shareBirdList(props.list.id, props.list.title)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <g fill="var(--color-background-dim)">
                        <path d="M4.5 5H7v5a1 1 0 0 0 2 0V5h2.5a.5.5 0 0 0 .376-.829l-3.5-4a.514.514 0 0 0-.752 0l-3.5 4A.5.5 0 0 0 4.5 5Z"/>
                        <path d="M14 7h-3v2h3v5H2V9h3V7H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                    </g>
                  </svg>
                  Dela
                </button>
                  <button class="delete-button" @click.prevent="deleteList(props.list.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24">
                      <g fill="none" stroke="currentColor" stroke-miterlimit="10">
                        <path stroke-linecap="square" d="M20 9v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"/>
                        <path stroke-linecap="square" d="M1 5h22"/>
                        <path stroke-linecap="square" d="M12 12v6m-4-6v6m8-6v6"/>
                        <path d="M8 5V1h8v4"/>
                      </g>
                    </svg>
                    Radera
                  </button>
                </details>
              </div>
            </div>
            <details v-if="props.list.description" class="list-description">
              <summary>Information om listan</summary>
              {{ props.list.description }}
            </details>
          </template>
        </list-view>
      </div>
    </template>
  </tabs-list>
  <edit-dialog
    :key="componentKey"
    :isOpen="isDialogOpen"
    :user="props.user"
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
  box-shadow: inset rgb(17 17 26 / 10%) 0 -6px 8px 0;
}

.body-content {
  grid-area: body-content;
  overflow: auto;
}

.body-content::-webkit-scrollbar {
  width: 6px;
  background: rgba(0, 0, 0, 0.05);
}

.body-content::-webkit-scrollbar-thumb {
  border-radius: var(--radius);
  background: var(--color-background-dim);
}

.list-header {
  position: relative;
  overflow: hidden;
  padding: 0.25rem 0;
}

.list-description {
  margin: 0 1rem 0.25rem;
}

.sidescroll {
  overflow-x: auto;
  padding: 0 0.8rem;
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prev-date {
  margin-left: 1rem;
}

.next-date {
  margin-right: 1rem;
}

.year-summary {
  margin: 0 auto 1rem;
  font-size: 0.9rem;
}

.month-button {
  min-width: 2rem;
  padding: 0.5rem;
}

.list-header .subtitle {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 1rem;
  background: var(--color-background);
  transition: 0.1s transform ease-out;
}

.list-header button {
  min-height: 2.3rem;
}

.list-header .notify-button {
  margin-top: 0.3rem;
}

.list-header .share-button {
  align-self: center;
  margin-left: 0.5rem;
  white-space: nowrap;
}

.list-header .delete-button {
  margin-left: 1rem;
}

.notify-button svg {
  width: 20px;
  vertical-align: middle;
}

.share-button svg,
.delete-button svg {
  width: 16px;
  margin-right: 0.4rem;
  vertical-align: text-top;
}
</style>
