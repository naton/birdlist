<script setup>
import ItemComponent from "./ItemComponent.vue";

const props = defineProps({
  obs: {
    type: Object,
    required: true,
  },
  user: {
    type: String,
    default: "",
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
    :user="props.user"
    :selected="props.selected"
    @edit="handleEdit"
  />
</template>
