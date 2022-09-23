<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { liveQuery } from "dexie";
import { getTiedRealmId } from "dexie-cloud-addon";
import { db } from "../db";
import TabsList from "@/components/TabsList.vue";
import ThisList from "@/components/ThisList.vue";
import EditDialog from "@/components/EditDialog.vue";

const componentKey = ref(0);
const props = defineProps(["list"]);
const emit = defineEmits(["selectList"]);

const currentMonth = ref(new Date().getMonth());
const currentSort = ref("bydate");
const currentObservation = ref(false);
const allObservations = ref([]);
const tabList = ref([]);
const isListSelected = ref(false);
const isDialogOpen = ref(false);
const me = ref("");

/* Login */
function login() {
  db.cloud.login();
}

const userIsLoggedIn = computed(() => me.value !== "Unauthorized");

const userSubscription = liveQuery(() => db.cloud.currentUser).subscribe(
  (user) => {
    me.value = user._value.name;
  },
  (error) => {
    console.log(error);
  }
);

/* Observations */
const observationsSubscription = liveQuery(() =>
  db.observations.toArray()
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
    .filter((obs) => obs.owner == me.value)
    .sort((a, b) => a.date - b.date);
});

const allThisMonth = computed(() => {
  return allObservations.value
    .filter(
      (obs) =>
        obs.owner == me.value &&
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
      obs.owner == me.value &&
      obs.date.getFullYear() == new Date().getFullYear() &&
      obs.date.getMonth() == month
  ).length;
}

function getMonthNameFormatted(month) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(month);
  return new Intl.DateTimeFormat("sv", {
    month: "short",
  }).format(date);
}

function sortBy(val) {
  return (currentSort.value = val);
}

function closeObservationDialog() {
  isDialogOpen.value = false;
}

/* Lists */
const listsSubscription = liveQuery(() => db.lists.toArray()).subscribe(
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

function deleteList(listId) {
  if (
    confirm(
      "Är du säker på att du vill ta bort denna lista och alla dess observationer?"
    )
  ) {
    return db
      .transaction(
        "rw",
        [db.lists, db.observations, db.realms, db.members],
        () => {
          // Delete possible todo-items:
          db.observations.where({ listId: listId }).delete();
          // Delete the list:
          db.lists.delete(listId);
          // Delete possible realm and its members in case list was shared:
          const tiedRealmId = getTiedRealmId(listId);
          db.members.where({ realmId: tiedRealmId }).delete();
          db.realms.delete(tiedRealmId);
        }
      )
      .then(() => {
        emit("selectList", "monthly");
      });
  }
}

function shareBirdList(listId, listName) {
  let email = prompt(
    "Ange e-postadressen till personen du vill dela denna lista med:"
  );

  if (!email) return;

  return db.transaction("rw", [db.lists, db.realms, db.members], () => {
    // Add or update a realm, tied to the todo-list using getTiedRealmId():
    const realmId = getTiedRealmId(listId);

    db.realms.put({
      realmId,
      name: listName,
      represents: "a bird list",
    });

    // Move todo-list into the realm (if not already there):
    db.lists.update(listId, { realmId });

    // Add the members to share it to:
    db.members.add({
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
  });
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
  userSubscription.unsubscribe();
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
        <this-list
          v-if="props.list.id === 'monthly'"
          :observations="allThisMonth"
          :sort="currentSort"
          :selected="currentObservation"
          @sort="sortBy"
          @select="selectObservation"
          @edit="editObservation"
        >
          <template v-slot:header>
            <div class="month-nav">
              <button @click.prevent="currentMonth--">«</button>
              <h2 class="subtitle center">
                {{ currentMonthFormatted }}
              </h2>
              <button @click.prevent="currentMonth++">»</button>
            </div>
          </template>
        </this-list>

        <this-list
          v-else-if="props.list.id === 'everything'"
          :observations="allMyObservations"
          :selected="currentObservation"
          :sort="currentSort"
          @sort="sortBy"
          @select="selectObservation"
          @edit="editObservation"
        >
          <template v-slot:header>
            <div class="list-header">
              <h2 class="subtitle center">Årskryss</h2>
            </div>
            <div class="center sidescroll">
              <table class="year-summary">
                <tbody>
                  <tr>
                    <td v-for="n in 12" :key="n">
                      {{ getMonthNameFormatted(n - 1) }}
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
        </this-list>

        <this-list
          v-else
          :observations="listObservations"
          :selected="currentObservation"
          :sort="currentSort"
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
                <h2>{{ props.list.title }}</h2>
                <button
                  class="share-button"
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
        </this-list>
      </div>
    </template>
  </tabs-list>
  <button class="login-button" @click="login" v-if="!userIsLoggedIn">
    Logga in
  </button>
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
}

.sidescroll {
  overflow-x: auto;
}

.year-summary {
  margin: auto;
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
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 1rem;
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

.login-button {
  align-self: flex-end;
}
</style>
