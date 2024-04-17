<script setup>
import { ref, reactive, computed, onMounted, watch, defineModel } from "vue";
import { storeToRefs } from "pinia";
import { db } from "../db";
import { useSettingsStore } from "@/stores/settings.js";
import { useListsStore } from "@/stores/lists.js";
import { useCommentsStore } from "@/stores/comments.js";
import ObservationItem from "./ObservationItem.vue";
import ObservationsIcon from "./icons/ObservationsIcon.vue";
import BirdsIcon from "./icons/BirdsIcon.vue";
import CommentsIcon from "./icons/CommentsIcon.vue";
import UserNav from "./UserNav.vue";
import SpeciesItem from "./SpeciesItem.vue";
import CommentItem from "./CommentItem.vue";
import SvgChart from "./SvgChart.vue";
import { cssColor, groupBy } from "@/helpers";

const props = defineProps(["list", "comments", "sort", "observations"]);
const emit = defineEmits(["sort", "delete", "edit", "newLeader"]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser, isUserLoggedIn } = storeToRefs(settingsStore);

const listsStore = useListsStore();
const { currentList } = storeToRefs(listsStore);

const commentsStore = useCommentsStore();
const { addComment } = commentsStore;

const species = computed(() => [...new Set(props.observations.map((item) => item.name))].sort());

const svg = reactive({
  w: 300,
  h: 200,
});

function resize() {
  if (users.value.length > 1) {
    const chart = document.querySelector(".chart-wrapper");
    svg.w = chart.offsetWidth;
  }
}

const users = computed(() => {
  const names = [...new Set(props.observations.map((obs) => obs.owner))].sort();
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

const selectedObservation = defineModel();
const selectedUser = ref(null);
const currentLeader = ref("");

const observationsByUser = computed(() => {
  let obses = props.observations;
  if (selectedUser.value === null) {
    return obses.sort((a, b) => b.date - a.date);
  } else {
    return obses.filter((obs) => obs.owner === selectedUser.value).sort((a, b) => b.date - a.date);
  }
});

const observationsByDate = computed(() => {
  return groupBy(props.observations, "date");
});

let options = reactive({
  xMin: 0,
  xMax: window.screen.availWidth,
  yMin: 0,
  yMax: 10,
  line: {
    smoothing: 0.05,
    flattening: 0.05,
  },
});

const datasets = ref([]);

function initGraph() {
  if (!props.observations) {
    return;
  }

  options.yMax = users.value[0].score;
  const firstObsDate = new Date(props.observations[props.observations.length - 1].date);
  const lastObsDate = new Date(props.observations[0].date);
  const datesDiff = parseInt((lastObsDate - firstObsDate) / (1000 * 60 * 60 * 24), 10);
  const graphWidthOfEachDay = Math.ceil(options.xMax / datesDiff);
  const datesWithObservations = Object.keys(observationsByDate.value);
  let graphData = [];

  function createGraphData(owner) {
    let values = [];
    let currentValue = 0;
    let day = new Date(firstObsDate);

    for (let days = 0; days <= datesDiff; days++) {
      const obsDate = day.toISOString().slice(0, 10);
      if (datesWithObservations.includes(obsDate)) {
        currentValue += observationsByDate.value[obsDate].filter((obs) => obs.owner === owner).length;
        values.push([days * graphWidthOfEachDay, currentValue]);
      }
      day.setDate(day.getDate() + 1);
    }

    return values;
  }

  users.value.forEach((user) => {
    graphData.push({
      name: user.name,
      colors: {
        path: cssColor(user.name),
        circles: "var(--color-text-dim)",
      },
      values: createGraphData(user.name),
    });
  });

  datasets.value = graphData;
  resize();
}

const speciesByUser = computed(() => {
  return selectedUser.value === null
    ? groupBy(props.observations, "name")
    : groupBy(
      props.observations.filter((obs) => obs.owner === selectedUser.value),
      "name"
    );
});

function changeUser(user) {
  selectedUser.value = user === selectedUser.value ? null : user;
}

function emitSort(value) {
  emit("sort", value);
}

function emitDelete(id) {
  emit("delete", id);
}

function emitEdit(obs) {
  emit("edit", obs);
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

watch(currentLeader, (newLeader) => {
  initGraph();
  // Announce new leader only if you’re not alone
  if (users.value.length > 1 && newLeader === currentUser.value?.name) {
    emit("newLeader");
  }
});

onMounted(() => {
  window.addEventListener("resize", resize);
});
</script>

<template>
  <slot name="header" />
  <slot name="default">
    <user-nav :users="users" :selectedUser="selectedUser" @changeUser="changeUser" />

    <svg-chart v-if="users?.length > 1" :datasets="datasets" :options="options" :svg="svg" :user="selectedUser"></svg-chart>

    <nav class="nav margin-top margin-bottom" v-if="props.observations.length">
      <a href="#bydate" class="nav-link" :class="{ current: sort == 'bydate', }" @click.prevent="emitSort('bydate')">
        <observations-icon />
        {{ t("Observations") }}
        <span class="nav-count">({{ observationsByUser.length }})</span>
      </a>
      <a href="#byname" class="nav-link" :class="{ current: sort == 'byname', }" @click.prevent="emitSort('byname')">
        <birds-icon />
        {{ t("Species") }}
        <span class="nav-count">({{ Object.keys(speciesByUser).length }})</span>
      </a>
      <a v-if="props.comments" href="#comments" class="nav-link" :class="{ current: sort == 'comments', }" @click.prevent="emitSort('comments')">
        <comments-icon />
        {{ t("Chat") }}
        <span class="nav-count">({{ noOfComments() }})</span>
      </a>
    </nav>

    <section class="empty-list" v-if="currentUser.name && !props.observations.length">
      <h3 class="center">{{ t("No_Observations") }}</h3>
      <div v-if="!isUserLoggedIn" class="center">
        {{ t("Have_You_Logged_In_Before") }}<br>
        <a href="/settings" @click.prevent="db.cloud.login()">{{ t("Login") }}</a> {{ t("Here_And_Now_To_Access_Your_Observations") }}
      </div>
    </section>

    <section id="bydate" v-if="props.observations.length && props.sort == 'bydate'">
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

    <section id="byname" v-if="species.length && props.sort == 'byname'">
      <transition-group tag="ol" name="list" class="list">
        <species-item v-for="obs in speciesByUser"
          :obs="obs"
          :key="obs[0].name"></species-item>
      </transition-group>
    </section>

    <section id="comments" v-if="props.observations.length && currentList && props.sort == 'comments'">
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