import { ref } from "vue";
import { defineStore } from "pinia";

export const useMessagesStore = defineStore("messages", () => {
    const messages = ref([]);

    function addMessage(text) {
        messages.value.push({
            id: Date.now(),
            text: text,
            timeout: true,
        });
    }

    function removeMessage(id) {
        messages.value = messages.value.filter((m) => m.id !== id);
    }

    return {
        messages,
        addMessage,
        removeMessage,
    };
});