<script setup>
import { computed } from "vue";
import { db } from "../db";
import UserIcon from "./UserIcon.vue";
import { formatDate } from "../helpers";

const props = defineProps(["comment", "user"]);

const isCommentAuthor = computed(() => props.comment.owner == props.user);

async function deleteComment(id) {
  db.comments.delete(id);
}
</script>

<template>
  <li>
    <div class="comment">
      <span class="meta">
        <user-icon :user="props.comment.owner"></user-icon> skrev
        {{ formatDate(props.comment.date) }}:
      </span>
      <p>{{ props.comment.comment }}</p>
      <button v-if="isCommentAuthor" class="delete-button" @click="deleteComment(props.comment.id)">
        <svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-miterlimit="10">
            <path stroke-linecap="square" d="M20 9v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"/>
            <path stroke-linecap="square" d="M1 5h22"/>
            <path stroke-linecap="square" d="M12 12v6m-4-6v6m8-6v6"/>
            <path d="M8 5V1h8v4"/>
          </g>
        </svg>
      </button>
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

.comment .delete-button {
  width: 32px;
  position: absolute;
  right: 1rem;
}

.meta {
  font-size: 0.9rem;
}
</style>