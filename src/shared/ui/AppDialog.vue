<script setup>
import { ref, watch, onMounted, nextTick, useSlots } from "vue";

const props = defineProps({
  dialogClass: {
    type: [String, Array, Object],
    default: "",
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
});

const isOpen = defineModel("modelValue", { default: false });
const dialogRef = ref(null);
const slots = useSlots();

watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal) {
      nextTick(showModalInternal);
      return;
    }

    closeInternal();
  },
  { immediate: true }
);

function showModalInternal() {
  if (!dialogRef.value || dialogRef.value.open) {
    return;
  }

  try {
    dialogRef.value.showModal();

    const autofocusElement = dialogRef.value.querySelector("[autofocus]");
    if (autofocusElement) {
      setTimeout(() => {
        autofocusElement.focus();
      }, 50);
    }
  } catch (error) {
    console.error("Failed to show modal:", error);
  }
}

function closeInternal() {
  if (!dialogRef.value || !dialogRef.value.open) {
    return;
  }

  const dialog = dialogRef.value;
  setTimeout(() => {
    if (dialog && dialog.open) {
      dialog.close();
    }
  }, 300);
}

function handleCloseRequest(event) {
  event?.preventDefault();
  isOpen.value = false;
}

function handleDialogClick(event) {
  if (!props.closeOnBackdrop || event.target !== dialogRef.value) {
    return;
  }

  isOpen.value = false;
}

onMounted(() => {
  if (dialogRef.value && isOpen.value) {
    nextTick(showModalInternal);
  }
});

defineExpose({
  showModal: () => {
    isOpen.value = true;
  },
  close: () => {
    isOpen.value = false;
  },
});
</script>

<template>
  <transition name="dialog">
    <dialog
      v-if="isOpen"
      ref="dialogRef"
      :class="['dialog', props.dialogClass]"
      @cancel="handleCloseRequest"
      @click="handleDialogClick"
    >
      <header v-if="slots.header" class="dialog__header">
        <slot name="header" />
      </header>
      <section class="dialog__body">
        <slot />
      </section>
      <footer v-if="slots.footer" class="dialog__footer">
        <slot name="footer" />
      </footer>
    </dialog>
  </transition>
</template>
