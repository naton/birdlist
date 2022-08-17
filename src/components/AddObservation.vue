<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['change'])
</script>

<template>
    <div id="addbird">
        <input type="text" list="birds" @change="emit('add', $event)" autocomplete="off"/>
    </div>
</template>