<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['click'])
const props = defineProps(['item'])
</script>

<template>
    <li>
        {{ item.name || item }}
        <button type="button" @click.prevent="emit('delete', item.id)" v-if="$attrs.onDelete">x</button>
    </li>
</template>
