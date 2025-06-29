<template>
  <div class="dialog-container">
    <transition name="dialog">
      <dialog 
        v-if="modelValue || isOpenViaMethod" 
        ref="dialogRef" 
        class="dialog" 
        :closedby="closeOnBackdrop ? 'backdrop' : null"
        @cancel="emitClose"
      >
        <slot></slot>
      </dialog>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
});

const isOpenViaMethod = ref(false);
const emit = defineEmits(['update:modelValue']);
const dialogRef = ref(null);

// Watch for changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(openModalInternal);
  } else {
    closeModalInternal();
  }
}, { immediate: true });

// Watch for method-triggered changes
watch(() => isOpenViaMethod.value, (newVal) => {
  if (newVal) {
    nextTick(openModalInternal);
  } else {
    closeModalInternal();
  }
}, { immediate: true });

function openModalInternal() {
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

function closeModalInternal() {
  if (!dialogRef.value) return;
  
  // Only close if it's actually open
  if (dialogRef.value.open) {
    dialogRef.value.close();
  }
}

// Handle backdrop clicks
function handleBackdropClick(event) {
  if (!dialogRef.value || !props.closeOnBackdrop) return;
  
  // Check if the click was directly on the dialog element (backdrop) and not on its children
  if (event.target === dialogRef.value) {
    // Native backdrop click behavior is handled by the closedby attribute
    // This emitClose is for our custom state handling
    emitClose();
  }
}

function emitClose() {
  emit('update:modelValue', false);
  isOpenViaMethod.value = false;
}

onMounted(() => {
  if (dialogRef.value) {
    dialogRef.value.addEventListener('click', handleBackdropClick);
    
    // If modelValue or isOpenViaMethod is true on mount, open the dialog
    if (props.modelValue || isOpenViaMethod.value) {
      nextTick(openModalInternal);
    }
  }
});

onBeforeUnmount(() => {
  if (dialogRef.value) {
    dialogRef.value.removeEventListener('click', handleBackdropClick);
  }
});

// Expose methods for direct component manipulation
defineExpose({
  showModal: () => {
    isOpenViaMethod.value = true;
  },
  close: () => {
    isOpenViaMethod.value = false;
  },
  // Adding these aliases to support the existing API
  openModal: () => {
    isOpenViaMethod.value = true;
  },
  closeModal: () => {
    isOpenViaMethod.value = false;
  }
});
</script>

<style scoped>
.dialog-container {
  position: relative;
}
</style>
