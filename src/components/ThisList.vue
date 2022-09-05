<script setup>
import { computed } from "vue";
import ObservationItem from "./ObservationItem.vue";
import SpeciesItem from "./SpeciesItem.vue";

const props = defineProps(["observations", "sort", "selected"]);
const emit = defineEmits(["sort", "select", "delete", "edit"]);

const species = computed(() =>
  [...new Set(props.observations.map((item) => item.name))].sort()
);

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
        @click.prevent="emitSort('bydate')"
        :class="{
          current: sort == 'bydate',
        }"
        >Observationer</a
      >
      <a
        href="#byname"
        @click.prevent="emitSort('byname')"
        :class="{
          current: sort == 'byname',
        }"
        >Arter</a
      >
    </nav>

    <section
      id="bydate"
      v-show="props.sort == 'bydate'"
      v-if="observations.length"
    >
      <h3 class="center">{{ observations.length }} observationer</h3>
      <ul class="list">
        <observation-item
          v-for="obs in observations"
          :obs="obs"
          :key="obs.id"
          :show_date="true"
          :selected="props.selected"
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
          v-for="bird in species"
          :bird="bird"
          :key="bird"
        ></species-item>
      </ol>
    </section>

    <section class="empty-list" v-if="!observations.length">
      <h3 class="center">Inga observationer</h3>
    </section>
  </slot>
</template>

<style>
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

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
</style>
