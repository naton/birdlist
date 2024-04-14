<script setup>
import { storeToRefs } from "pinia";
import { useMessagesStore } from "@/stores/messages.js";

const messagesStore = useMessagesStore();
const { removeMessage } = messagesStore;
const { messages } = storeToRefs(messagesStore);
</script>

<template>
    <div v-if="messages.length" class="app-messages">
        <transition-group name="fade-in">
            <div v-for="{ id, message } in messages" :key="id" class="message" @click="removeMessage(id)">
                <p>{{ message }}</p>
            </div>
        </transition-group>
    </div>
</template>

<style>
.app-messages {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    pointer-events: none;
}

.app-messages .message {
    display: flex;
    padding: 1rem;
    border-radius: var(--radius);
    color: var(--color-text);
    background-color: var(--color-background);
    box-shadow: 0 0 1.5rem rgba(0, 0, 0, 0.25);
    cursor: pointer;
}
</style>