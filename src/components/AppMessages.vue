<script setup>
import { storeToRefs } from "pinia";
import { useMessagesStore } from "@/stores/messages.js";
import AppMessage from "./AppMessage.vue";

const messagesStore = useMessagesStore();
const { messages } = storeToRefs(messagesStore);
</script>

<template>
    <div v-if="messages.length" class="app-messages">
        <transition-group name="fade-in" appear>
            <app-message v-for="msg in messages" :key="msg.id" :message="msg" />
        </transition-group>
    </div>
</template>

<style>
.app-messages {
    position: fixed;
    top: 0.5rem;
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
    padding: 1rem 1.5rem;
    border-radius: var(--radius);
    border: 2px solid var(--color-border);
    color: var(--color-text);
    background-color: var(--color-background);
    font-size: 1.4rem;
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.3);
    cursor: pointer;
}
</style>