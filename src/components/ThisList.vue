<script setup>
import { computed } from "vue";
import ObservationItem from "./ObservationItem.vue";

const props = defineProps(["observations", "month", "sort", "selected"]);
const emit = defineEmits(["sort", "select", "delete"]);

const species = computed(() =>
  [...new Set(props.observations.map((item) => item.name))].sort()
);

function emitSort(value) {
  emit("sort", value);
}

function emitSelect(id) {
  emit("select", id);
}

function emitDelete(id) {
  emit("delete", id);
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
      <ul>
        <observation-item
          v-for="item in observations"
          :item="item"
          :key="item.id"
          :show_date="true"
          :selected_id="props.selected"
          @select="emitSelect(item.id)"
          @delete="emitDelete(item.id)"
        ></observation-item>
      </ul>
    </section>

    <section id="byname" v-show="props.sort == 'byname'" v-if="species.length">
      <h3 class="center">{{ species.length }} olika arter</h3>
      <ol>
        <observation-item
          v-for="item in species"
          :item="item"
          :key="item"
        ></observation-item>
      </ol>
    </section>

    <section class="empty-list" v-else>
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
</style>
