<script setup>
import UserIcon from "./UserIcon.vue";
import { formatDate } from "../helpers";

defineProps(["comment", "user"]);
</script>

<template>
  <li>
    <div class="comment">
      <span class="meta">
        <user-icon :user="comment.owner"></user-icon> skrev
        {{ formatDate(comment.date) }}:
      </span>
      <p>{{ comment.comment }}</p>
    </div>
  </li>
</template>

<style>
.comment {
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  padding: 0.5rem;
  justify-content: space-between;
}

.comment p {
  margin: 0.5rem 1.75rem;
}

.meta {
  font-size: 0.9rem;
}
</style>