<script setup>
import { ref, computed, defineModel } from "vue";
import { storeToRefs } from "pinia";
import { db } from "../db";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useCommentsStore } from "@/stores/comments.js";
import { groupBy } from "@/helpers";
import ObservationItem from "./ObservationItem.vue";
import ObservationsIcon from "./icons/ObservationsIcon.vue";
import BirdsIcon from "./icons/BirdsIcon.vue";
import CommentsIcon from "./icons/CommentsIcon.vue";
import UserNav from "./UserNav.vue";
import SpeciesItem from "./SpeciesItem.vue";
import CommentItem from "./CommentItem.vue";
import SvgChart from "./SvgChart.vue";
import HomeIllustration from '../components/illustrations/HomeIllustration.vue';

const emit = defineEmits(["delete", "edit", "newLeader"]);
const props = defineProps(["list", "comments", "observations"]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser, isUserLoggedIn, selectedUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentList, currentSort } = storeToRefs(listsStore);

const commentsStore = useCommentsStore();
const { addComment } = commentsStore;

const species = computed(() => [...new Set(props.observations?.map((item) => item.name))].sort());
const selectedObservation = defineModel();

const currentLeader = ref("");
const users = computed(() => {
  const names = [...new Set(props.observations?.map((obs) => obs.owner))].sort();
  let users = [];
  let highestScore = 0;
  let leader = false;

  names.forEach((name) => {
    const score = Object.keys(
      groupBy(
        props.observations.filter((obs) => obs.owner === name),
        "name"
      )
    ).length;
    highestScore = score > highestScore ? score : highestScore;
    users.push({
      name,
      score,
      leader,
    });
  });

  users.forEach((user) => {
    if (user.score === highestScore) {
      user.leader = true;
      currentLeader.value = user.name;
    }
  });

  return users.sort((a, b) => b.score - a.score);
});

const observationsByUser = computed(() => {
  let obses = props.observations;
  if (selectedUser.value === null) {
    return obses.sort((a, b) => b.date - a.date);
  } else {
    return obses.filter((obs) => obs.owner === selectedUser.value).sort((a, b) => b.date - a.date);
  }
});

const speciesByUser = computed(() => {
  return selectedUser.value === null
    ? groupBy(props.observations, "name")
    : groupBy(
      props.observations.filter((obs) => obs.owner === selectedUser.value),
      "name"
    );
});

function emitDelete(id) {
  emit("delete", id);
}

function emitEdit(obs) {
  emit("edit", obs);
}

function emitNewLeader() {
  emit("newLeader");
}

const comment = ref("");

function selectObservation(obs) {
  selectedObservation.value = selectedObservation.value == obs ? null : obs;
}

function addNewComment() {
  if (comment.value) {
    addComment({
      listId: currentList.value.id,
      comment: comment.value.trim(),
      user: currentUser.value.name,
    });
    resetForm();
  }
}

function resetForm() {
  comment.value = "";
}

function noOfComments() {
  return props.comments ? Object.keys(props.comments).length : "0"
}
</script>

<template>
  <slot name="header"></slot>
  <slot name="default">
    <user-nav
      :users="users"
      :selectedUser="selectedUser" />

    <svg-chart v-if="users?.length > 1"
      :observations="props.observations"
      :users="users"
      :selectedUser="selectedUser"
      :currentLeader="currentLeader"
      @newLeader="emitNewLeader"></svg-chart>

    <nav class="nav margin-top margin-bottom" v-if="props.observations.length">
      <a href="#bydate" class="nav-link" :class="{ current: currentSort === 'bydate', }" @click.prevent="sortBy('bydate')">
        <observations-icon />
        {{ t("Observations") }}
        <span class="nav-count">({{ observationsByUser.length }})</span>
      </a>
      <a href="#byname" class="nav-link" :class="{ current: currentSort === 'byname', }" @click.prevent="sortBy('byname')">
        <birds-icon />
        {{ t("Species") }}
        <span class="nav-count">({{ Object.keys(speciesByUser).length }})</span>
      </a>
      <a v-if="props.comments" href="#comments" class="nav-link" :class="{ current: currentSort === 'comments', }" @click.prevent="sortBy('comments')">
        <comments-icon />
        {{ t("Chat") }}
        <span class="nav-count">({{ noOfComments() }})</span>
      </a>
    </nav>

    <section class="empty-list" v-if="!props.observations.length">
      <div class="center">
        <home-illustration />
      </div>

      <h3 class="center">{{ t("No_Observations") }}</h3>
      <details v-if="!isUserLoggedIn" class="help" open>
        <summary>{{ t("Have_You_Been_Here_Before") }}</summary>
        <p class="margin-top"><a href="/settings" @click.prevent="db.cloud.login()">{{ t("Login") }}</a> {{ t("To_Access_Your_Observations") }}</p>
      </details>
    </section>

    <section id="bydate" v-if="props.observations.length && currentSort === 'bydate'">
      <transition-group tag="ul" name="list" class="list">
        <observation-item v-for="obs in observationsByUser"
          :obs="obs"
          :key="obs.date"
          :user="currentUser.name"
          :selected="selectedObservation == obs"
          @click="selectObservation(obs)"
          @delete="emitDelete(id)"
          @edit="emitEdit"></observation-item>
      </transition-group>
    </section>

    <section id="byname" v-if="species.length && currentSort === 'byname'">
      <transition-group tag="ol" name="list" class="list">
        <species-item v-for="obs in speciesByUser"
          :obs="obs"
          :key="obs[0].name"></species-item>
      </transition-group>
    </section>

    <section id="comments" v-if="props.observations.length && currentList && currentSort === 'comments'">
      <form>
        <div class="comment-form">
          <textarea v-model="comment" class="comment-input" :placeholder="t('Write_Something_To_The_Others')"></textarea>
          <button class="comment-btn" @click.prevent="addNewComment">{{ t("Submit") }}</button>
        </div>
      </form>
      <transition-group tag="ol" name="list" class="list">
        <comment-item v-for="comment in props.comments" :comment="comment" :user="currentUser.name" :key="comment.id"></comment-item>
      </transition-group>
    </section>
  </slot>
</template>

<style>
.date {
  color: var(--color-text-dim);
}

.name {
  margin-right: auto;
  padding-left: 20px;
  background: url('/x.svg') no-repeat 0 50%;
  background-size: 12px auto;
}

.seen-by {
  margin: -0.2em 0 -0.2em 0.5em;
}

.comment-form {
  display: grid;
  grid-template-columns: 3fr 1fr;
}

.comment-input {
  margin: 1rem 0 1rem 1rem;
  padding: 0.5rem;
  border: none;
  border-top-left-radius: var(--radius);
  border-bottom-left-radius: var(--radius);
  color: var(--color-text);
  background: var(--color-background-dim);
  font-size: inherit;
  font-family: inherit;
}

.comment-btn {
  margin: 1rem 1rem 1rem 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
