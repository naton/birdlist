<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { db } from "../db";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useCommentsStore } from "@/stores/comments.js";
import { useMessagesStore } from "@/stores/messages.js";
import { groupBy } from "@/helpers";
import { getBirdKey } from "@/birdNames.js";
import ItemComponent from "./ItemComponent.vue";
import ObservationsIcon from "./icons/ObservationsIcon.vue";
import BirdsIcon from "./icons/BirdsIcon.vue";
import CommentsIcon from "./icons/CommentsIcon.vue";
import UserNav from "./UserNav.vue";
import CommentItem from "./CommentItem.vue";
import SvgChart from "./SvgChart.vue";
import HomeIllustration from '../components/illustrations/HomeIllustration.vue';

const emit = defineEmits(["delete", "edit", "newLeader"]);
const props = defineProps({
  list: Object,
  comments: Array,
  observations: {
    type: Array,
    default: () => [],
  },
  participants: {
    type: Array,
    default: () => [],
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const settingsStore = useSettingsStore();
const { t, firstVisit } = settingsStore;
const { currentUser, isUserLoggedIn, selectedUser } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { sortBy } = listsStore;
const { currentList, currentSort } = storeToRefs(listsStore);

const commentsStore = useCommentsStore();
const { addComment } = commentsStore;
const messagesStore = useMessagesStore();
const { addMessage } = messagesStore;

const species = computed(() => [...new Set(props.observations?.map((item) => getBirdKey(item)))].sort());
const selectedObservation = defineModel();

const currentLeader = ref("");
const users = computed(() => {
  const names = [
    ...new Set([
      ...(props.participants || []),
      ...(props.observations || []).map((obs) => obs.owner),
    ].map((name) => String(name || "").trim()).filter(Boolean)),
  ].sort();
  let users = [];
  let highestScore = 0;

  names.forEach((name) => {
    const score = Object.keys(
      groupBy(
        props.observations.filter((obs) => obs.owner === name),
        (obs) => getBirdKey(obs)
      )
    ).length;
    highestScore = score > highestScore ? score : highestScore;
    users.push({
      name,
      score,
      leader: false,
    });
  });

  currentLeader.value = "";
  users.forEach((user) => {
    if (highestScore > 0 && user.score === highestScore) {
      user.leader = true;
      currentLeader.value = user.name;
    }
  });

  return users.sort((a, b) => b.score - a.score);
});

const observationsByUser = computed(() => {
  let obses = [...props.observations];
  if (selectedUser.value === null) {
    return obses.sort((a, b) => b.date - a.date);
  } else {
    return obses.filter((obs) => obs.owner === selectedUser.value).sort((a, b) => b.date - a.date);
  }
});

const speciesByUser = computed(() => {
  return selectedUser.value === null
    ? groupBy(props.observations, (obs) => getBirdKey(obs))
    : groupBy(
      props.observations.filter((obs) => obs.owner === selectedUser.value),
      (obs) => getBirdKey(obs)
    );
});

function emitEdit(obs) {
  emit("edit", obs);
}

function emitNewLeader() {
  emit("newLeader");
}

const comment = ref("");

function addNewComment() {
  if (props.readOnly) {
    addMessage(t("List_Is_Read_Only_For_You"));
    return;
  }

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

function getObservationKey(obs) {
  return obs.id || `${obs.owner || ""}:${obs.listId || ""}:${obs.date?.getTime?.() || obs.date}:${getBirdKey(obs)}`;
}

function getSpeciesGroupKey(obsGroup) {
  return getBirdKey(obsGroup?.[0]);
}

</script>

<template>
  <slot name="header"></slot>
  <slot name="default">
    <user-nav
      :users="users"
      v-model:selectedUser="selectedUser" />

    <svg-chart v-if="props.observations.length && users?.length > 1"
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
    <p v-if="props.readOnly" class="center margin-bottom">{{ t("List_Is_Read_Only_For_You") }}</p>

    <section class="empty-list" v-if="!props.observations.length">
      <div class="center">
        <home-illustration />
      </div>

      <h3 class="center">{{ t("No_Observations") }}</h3>
      <details v-if="firstVisit && !isUserLoggedIn" class="help">
        <summary>{{ t("First_Time_Here") }}</summary>
        <p class="margin-top">
          <span v-html="t('First_Time_Description')"></span>
          <a href="/settings" @click.prevent="db.cloud.login()">{{ t("Enter_An_Email_Address").toLowerCase() }}</a>.</p>
      </details>
      <details v-else-if="!isUserLoggedIn" class="help" open>
        <summary>{{ t("Have_You_Been_Here_Before") }}</summary>
        <p class="margin-top"><a href="/settings" @click.prevent="db.cloud.login()">{{ t("Login") }}</a> {{ t("To_Access_Your_Observations") }}</p>
      </details>
    </section>

    <section id="bydate" v-if="props.observations.length && currentSort === 'bydate'">
      <transition-group tag="ul" name="list" class="list">
        <item-component v-for="obs in observationsByUser"
          mode="observation"
          :obs="obs"
          :key="getObservationKey(obs)"
          :user="currentUser.name"
          v-model="selectedObservation"
          @edit="emitEdit"></item-component>
      </transition-group>
    </section>

    <section id="byname" v-if="species.length && currentSort === 'byname'">
      <transition-group tag="ol" name="list" class="list">
        <item-component v-for="obs in speciesByUser"
          mode="species"
          :obs="obs"
          :key="getSpeciesGroupKey(obs)"
          :user="currentUser.name"
          v-model="selectedObservation"
          @edit="emitEdit"></item-component>
      </transition-group>
    </section>

    <section id="comments" v-if="props.observations.length && currentList && currentSort === 'comments'">
      <form>
        <div class="comment-form">
          <textarea v-model="comment" class="comment-input" :placeholder="props.readOnly ? t('Join_To_Contribute') : t('Write_Something_To_The_Others')" :disabled="props.readOnly"></textarea>
          <button class="comment-btn" @click.prevent="addNewComment" :disabled="props.readOnly">{{ t("Submit") }}</button>
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
