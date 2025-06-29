<template>
    <transition name="dialog">
        <dialog 
            v-if="modelValue || isOpenViaMethod" 
            ref="dialogRef" 
            class="dialog" 
            closedby="any"
            @cancel="emitClose"
        >
            <slot></slot>
        </dialog>
    </transition>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
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

function emitClose() {
  emit('update:modelValue', false);
  isOpenViaMethod.value = false;
}

onMounted(() => {
  // If modelValue or isOpenViaMethod is true on mount, open the dialog
  if (dialogRef.value && (props.modelValue || isOpenViaMethod.value)) {
    nextTick(openModalInternal);
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