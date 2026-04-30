<script setup>
import ItemComponent from "./ItemComponent.vue";

const props = defineProps({
  obs: {
    type: Object,
    required: true,
  },
  selected: {
    type: [Object, String, Number, Boolean, null],
    default: null,
  },
});
const emit = defineEmits(["edit"]);

function handleEdit(observation) {
  emit("edit", observation);
}
</script>

<template>
  <item-component
    mode="observation"
    :obs="props.obs"
    :selected="props.selected"
    @edit="handleEdit"
  />
</template>
