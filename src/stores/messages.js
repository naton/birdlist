import { ref } from "vue";
import { defineStore } from "pinia";

export const useMessagesStore = defineStore("messages", () => {
    let id = 0;
    let timer;
    const messages = ref([]);

    function addMessage(message) {
        id++;
        // default to an estimated reading speed of 25 letters per second, or minimum 1.5 sec.
        const delay = Math.max(message.length / 25 * 1000, 1500); 
        timer = setTimeout(() => triggerClose(id), delay);
        messages.value.push({ id, message, timer });
    }

    function removeMessage(id) {
        messages.value = messages.value.filter((m) => m.id !== id);
    }

    function triggerClose(id) {
        clearTimeout(timer);
        removeMessage(id);
    }

    return {
        messages,
        addMessage,
        removeMessage,
    };
});