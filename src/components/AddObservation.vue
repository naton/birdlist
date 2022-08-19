<script setup>
const emit = defineEmits(["change"]);

function shrinkViewport() {
  document.querySelector("#app").style.height = "auto";
  document.querySelector(".body").classList.add("keyboard-visible");
  setTimeout(function () {
    window.scrollTo(0, 0);
    document
      .querySelector(".body")
      .scrollTo(0, document.querySelector(".body").scrollHeight);
  }, 600);
}

function resetViewport() {
  document.querySelector("#app").style.height = "";
  document.querySelector(".body").classList.remove("keyboard-visible");
}
</script>

<template>
  <div class="add">
    <input
      type="text"
      list="birds"
      @focus="shrinkViewport"
      @blur="resetViewport"
      @change="emit('add', $event)"
      autocomplete="off"
      placeholder="Enter bird name…"
    />
  </div>
</template>

<style scoped>
.add {
  padding: 1rem;
}

input {
  width: 100%;
  padding: 0.3em;
  border: 1px solid var(--color-border);
  box-sizing: border-box;
  background: none;
  font-size: 1.2rem;
  appearance: none;
}

input::placeholder {
  color: var(--color-text);
}
</style>
