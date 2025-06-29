<script setup>
import ItemComponent from "./ItemComponent.vue";

const props = defineProps(["obs", "user", "selected"]);
const emit = defineEmits(["edit"]);

function handleEdit(observation) {
  emit("edit", observation);
}
</script>

<template>
  <item-component
    mode="observation"
    :obs="props.obs"
    :user="props.user"
    :selected="props.selected"
    @edit="handleEdit"
  />
</template>
