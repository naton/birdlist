<script setup>
import { onMounted } from "vue";
import { useMessagesStore } from "@/stores/messages.js";

const props = defineProps(["message"]);

const messagesStore = useMessagesStore();
const { removeMessage } = messagesStore;

let timer;

function triggerClose(id) {
    clearTimeout(timer);
    removeMessage(id);
}

onMounted(() => {
    const delay = Math.max(props.message.text.length / 25 * 1000, 1500);
    if (props.message.timeout) {
        timer = setTimeout(() => {
            triggerClose(props.message.id)
        }, delay);
    }
});
</script>

<template>
    <div class="message" @click="triggerClose(props.message.id)">
        <p v-html="props.message.text"></p>
    </div>
</template>