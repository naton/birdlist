<template>
    <transition name="dialog">
        <dialog 
            v-if="isOpen" 
            ref="dialogRef" 
            class="dialog" 
            closedby="any"
            @closerequest="handleCloseRequest"
            @cancel="handleCloseRequest"
        >
            <slot></slot>
        </dialog>
    </transition>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';

const isOpen = defineModel('modelValue', { default: false });
const dialogRef = ref(null);

// Watch for changes to isOpen
watch(() => isOpen.value, (newVal) => {
  if (newVal) {
    nextTick(showModalInternal);
  } else {
    closeInternal();
  }
}, { immediate: true });

function showModalInternal() {
  if (!dialogRef.value) return;
  
  // Only call showModal if the dialog is not already open
  if (!dialogRef.value.open) {
    try {
      dialogRef.value.showModal();
      
      // Remove autofocus after dialog is opened to prevent errors
      const autofocusElement = dialogRef.value.querySelector('[autofocus]');
      if (autofocusElement) {
        // Set focus after a small delay to avoid browser errors
        setTimeout(() => {
          autofocusElement.focus();
        }, 50);
      }
    } catch (e) {
      console.error('Failed to show modal:', e);
    }
  }
}

function closeInternal() {
  if (!dialogRef.value) return;
  
  // Only close if it's actually open
  if (dialogRef.value.open) {
    // Store a reference to the dialog element
    const dialog = dialogRef.value;
    
    // Wait for the animation to complete before actually closing
    setTimeout(() => {
      // Check if the dialog is still available and open before closing
      if (dialog && dialog.open) {
        dialog.close();
      }
    }, 300); // Match your CSS transition duration
  }
}

function handleCloseRequest() {
  // Update the model value when the dialog requests to be closed
  // This handles both the modern 'closerequest' event and the legacy 'cancel' event
  // (happens on Escape key or backdrop click when closedby="any")
  isOpen.value = false;
}

onMounted(() => {
  // If isOpen is true on mount, open the dialog
  if (dialogRef.value && isOpen.value) {
    nextTick(showModalInternal);
  }
});

// Expose methods for direct component manipulation
defineExpose({
  // Primary methods
  showModal: () => {
    isOpen.value = true;
  },
  close: () => {
    isOpen.value = false;
  }
});
</script>