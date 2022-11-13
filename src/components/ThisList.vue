<script setup>
import { ref, computed } from "vue";
import ObservationItem from "./ObservationItem.vue";
import UserIcon from "./UserIcon.vue";
import SpeciesItem from "./SpeciesItem.vue";

const props = defineProps(["observations", "sort", "selected", "user"]);
const emit = defineEmits(["sort", "select", "delete", "edit"]);

const species = computed(() =>
  [...new Set(props.observations.map((item) => item.name))].sort()
);

const users = computed(() =>
  [...new Set(props.observations.map((item) => item.owner))].sort()
);

const selectedUser = ref(props.user);

function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    const key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    // Add object to list for given key's value
    acc[key].push(obj);
    return acc;
  }, {});
}

const observationsByUser = computed(() => {
  return selectedUser.value === null
    ? props.observations
    : props.observations.filter((obs) => obs.owner === selectedUser.value);
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
    <nav class="nav" v-if="observations.length">
      <a
        href="#bydate"
        class="nav-link"
        :class="{
          current: sort == 'bydate',
        }"
        @click.prevent="emitSort('bydate')"
        >Observationer</a
      >
      <a
        href="#byname"
        class="nav-link"
        :class="{
          current: sort == 'byname',
        }"
        @click.prevent="emitSort('byname')"
        >Arter</a
      >
    </nav>

    <nav class="user-nav">
      <button
        v-for="user in users"
        class="user-button"
        :class="user === selectedUser && 'user-button--active'"
        @click="changeUser(user)"
        :key="user"
      >
        <user-icon :user="user">
          <span :class="user === props.user && 'me'">{{
            user.substring(0, 8) + "…"
          }}</span>
        </user-icon>
      </button>
    </nav>

    <section
      id="bydate"
      v-show="props.sort == 'bydate'"
      v-if="observations.length"
    >
      <h3 class="center">{{ observations.length }} observationer</h3>
      <ul class="list">
        <observation-item
          v-for="obs in observationsByUser"
          :obs="obs"
          :key="obs.id"
          :show_date="true"
          :selected="props.selected"
          :user="props.user"
          @select="emitSelect(obs)"
          @delete="emitDelete(id)"
          @edit="emitEdit(obs)"
        ></observation-item>
      </ul>
    </section>

    <section id="byname" v-show="props.sort == 'byname'" v-if="species.length">
      <h3 class="center">{{ species.length }} olika arter</h3>

      <ol class="list">
        <species-item
          v-for="obs in speciesByUser"
          :obs="obs"
          :key="obs.id"
        ></species-item>
      </ol>
    </section>

    <section class="empty-list" v-if="!observations.length">
      <h3 class="center">Inga observationer</h3>
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

.list li {
  overflow: hidden;
}

.list li:first-child {
  border-top: 1px solid var(--color-background-dim);
}

.list .obs {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 1em;
  border-bottom: 1px solid var(--color-background-dim);
  background: var(--color-background);
  transition: 0.1s transform ease-out;
  text-align: left;
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
  padding: 1rem;
  overflow: auto;
  white-space: nowrap;
}

.user-button {
  margin: 0;
  padding: 0;
  color: inherit;
  background: none;
}

.user-button .user {
  width: 2.5rem;
  height: 2.5rem;
}

.user-button .me {
  font-weight: bold;
}

.user-button--active .user {
  border: 3px solid var(--color-text);
}

.seen-by {
  margin: -0.2em 0 -0.2em 0.5em;
}
</style>
