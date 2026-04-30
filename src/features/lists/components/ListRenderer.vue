<script setup>
import { computed } from "vue";
import BirdstreakList from "@/components/BirdstreakList.vue";
import CheckList from "@/components/CheckList.vue";
import BingoList from "@/components/BingoList.vue";
import NormalList from "@/components/NormalList.vue";

const props = defineProps({
  list: {
    type: Object,
    required: true,
  },
  observations: {
    type: Array,
    default: () => [],
  },
  comments: {
    type: Array,
    default: () => [],
  },
  participants: {
    type: Array,
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "newLeader"]);

const listRenderers = {
  birdstreak: BirdstreakList,
  checklist: CheckList,
  bingo: BingoList,
  normal: NormalList,
};

const renderer = computed(() => listRenderers[props.list?.type] || NormalList);
const rendererKey = computed(() => {
  if (props.list?.type === "bingo") {
    return `${props.list.id}-${props.list.bingoSize}-bingo`;
  }

  return `${props.list.id}-${props.list?.type || "normal"}`;
});

const listProps = computed(() => ({
  observations: props.observations,
  list: props.list,
  readOnly: props.readOnly,
  comments: props.comments,
  participants: props.participants,
}));
</script>

<template>
  <component
    :is="renderer"
    :key="rendererKey"
    v-bind="listProps"
    @edit="emit('edit', $event)"
    @newLeader="emit('newLeader')"
  />
</template>
