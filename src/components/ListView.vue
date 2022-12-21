<script setup>
import { ref, computed, watch } from "vue";
import ObservationItem from "./ObservationItem.vue";
import UserIcon from "./UserIcon.vue";
import SpeciesItem from "./SpeciesItem.vue";

const props = defineProps(["observations", "sort", "selected", "user"]);
const emit = defineEmits(["sort", "select", "delete", "edit", "newLeader"]);

const species = computed(() => [...new Set(props.observations.map((item) => item.name))].sort());

const users = computed(() => {
  const names = [...new Set(props.observations.map((item) => item.owner))].sort();
  let users = [];
  let highestScore = 0;
  let leader = false;

  names.forEach((name) => {
    const score = Object.keys(
      groupBy(
        props.observations.filter((obs) => obs.owner === name),
        "name"
      )
    ).length;
    highestScore = score > highestScore ? score : highestScore;
    users.push({
      name,
      score,
      leader,
    });
  });

  users.forEach((user) => {
    if (user.score === highestScore) {
      user.leader = true;
      currentLeader.value = user.name;
    }
  });

  return users.sort((a, b) => b.score - a.score);
});

const selectedUser = ref(null);
const currentLeader = ref("");

watch(currentLeader, (newLeader) => {
  // Announce new leader only if you’re not alone
  if (users.value.length > 1 && newLeader === props.user) {
    emit("newLeader");
  }
});

function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    const key = obj[property].toLowerCase();
    if (!acc[key]) {
      acc[key] = [];
    }
    // Add object to list for given key's value
    acc[key].push(obj);
    return sortObject(acc);
  }, {});
}

function sortObject(o) {
  return Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});
}

const observationsByUser = computed(() => {
  return selectedUser.value === null
    ? props.observations.sort((a, b) => b.date - a.date)
    : props.observations.filter((obs) => obs.owner === selectedUser.value).sort((a, b) => b.date - a.date);
});

const speciesByUser = computed(() => {
  return selectedUser.value === null
    ? groupBy(props.observations, "name")
    : groupBy(
        props.observations.filter((obs) => obs.owner === selectedUser.value),
        "name"
      );
});

function changeUser(user) {
  selectedUser.value = user === selectedUser.value ? null : user;
}

function emitSort(value) {
  emit("sort", value);
}

function emitSelect(obs) {
  emit("select", obs);
}

function emitDelete(id) {
  emit("delete", id);
}

function emitEdit(obs) {
  emit("edit", obs);
}
</script>

<template>
  <slot name="header" />

  <slot name="default">
    <nav class="user-nav" v-if="users.length > 1">
      <transition-group name="list" appear>
        <button
          v-for="{ name, score, leader } in users"
          class="user-button"
          :class="name === selectedUser && 'user-button--active'"
          @click="changeUser(name)"
          :key="name"
        >
          <user-icon :user="name" :score="score" :leader="leader">
            <span :class="name === props.user && 'me'">{{ name }}</span>
          </user-icon>
        </button>
      </transition-group>
    </nav>

    <nav class="nav" v-if="observations.length">
      <a
        href="#bydate"
        class="nav-link"
        :class="{
          current: sort == 'bydate',
        }"
        @click.prevent="emitSort('bydate')"
        >Observationer <span class="nav-count">({{ observationsByUser.length }})</span></a
      >
      <a
        href="#byname"
        class="nav-link"
        :class="{
          current: sort == 'byname',
        }"
        @click.prevent="emitSort('byname')"
        >Arter <span class="nav-count">({{ Object.keys(speciesByUser).length }})</span></a
      >
    </nav>

    <section id="bydate" v-show="props.sort == 'bydate'" v-if="observations.length">
      <transition-group tag="ul" name="list" class="list">
        <observation-item
          v-for="obs in observationsByUser"
          :obs="obs"
          :key="obs.date"
          :selected="props.selected"
          :user="props.user"
          @select="emitSelect(obs)"
          @delete="emitDelete(id)"
          @edit="emitEdit(obs)"
        ></observation-item>
      </transition-group>
    </section>

    <section id="byname" v-show="props.sort == 'byname'" v-if="species.length">
      <transition-group tag="ol" name="list" class="list">
        <species-item v-for="obs in speciesByUser" :obs="obs" :key="obs[0].name"></species-item>
      </transition-group>
    </section>

    <section class="empty-list" v-if="user && !observations.length">
      <h3 class="center">Inga observerade 🐦</h3>
    </section>
  </slot>
</template>

<style>
.empty-list {
  display: flex;
  height: 70%;
  align-items: center;
  justify-content: center;
}

.list {
  position: relative;
  margin: 0.5rem 0 0;
}

.list li {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-top: 1px solid var(--color-background-dim);
  background: var(--color-background);
}

.list .obs {
  display: flex;
  flex: 1;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.6rem 1em;
  transition: 0.1s transform ease-out;
}

.date {
  color: var(--color-text-dim);
}

.name {
  margin-right: auto;
}

.name::first-letter {
  color: var(--color-background-dim);
  letter-spacing: 0.5ch;
}

.user-nav {
  position: sticky;
  top: 0;
  display: flex;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  overflow: auto;
  white-space: nowrap;
  box-shadow: rgb(17 17 26 / 10%) 0 6px 8px 0;
  z-index: 1;
}

.user-button {
  min-width: 7rem;
  width: 25%;
  margin: 0;
  padding: 5px 0 0;
  color: inherit;
  background: none;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-button .user {
  width: 2.5rem;
  height: 2.5rem;
}

.user-button .me::before {
  content: "Jag:";
  display: inline-block;
  position: absolute;
  left: 0.1em;
  font-style: italic;
  font-size: 0.8em;
}

.user-button--active .user {
  box-shadow: inset 0 0 0 2px var(--color-text);
}

.seen-by {
  margin: -0.2em 0 -0.2em 0.5em;
}
</style>
