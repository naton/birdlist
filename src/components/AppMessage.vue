<script setup>
import { useMessagesStore } from "@/stores/messages.js";

const messagesStore = useMessagesStore();
const { removeMessage } = messagesStore;

const props = defineProps(["message"]);
</script>

<template>
    <div class="message" @click="removeMessage(props.message.id)">
        <p>{{ props.message.message }}</p>
    </div>
</template>