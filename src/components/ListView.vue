<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { db } from "../db";
import ObservationItem from "./ObservationItem.vue";
import UserIcon from "./UserIcon.vue";
import SpeciesItem from "./SpeciesItem.vue";
import CommentItem from "./CommentItem.vue";
import SvgChart from "./SvgChart.vue";
import { cssColor } from "../helpers";

const props = defineProps(["observations", "comments", "sort", "selected", "user"]);
const emit = defineEmits(["sort", "select", "delete", "edit", "newLeader"]);

const species = computed(() => [...new Set(props.observations.map((item) => item.name))].sort());
const listId = computed(() => {
  if (!props.comments) {
    return;
  }

  return location.hash.replace("#", "");
});

const svg = reactive({
  w: 0,
  h: 0
});

function resize() {
  if (users.value.length > 1) {
    const chart = document.querySelector('.chart-wrapper');
    svg.w = chart.offsetWidth;
    svg.h = 200;
  }
}

const users = computed(() => {
  const names = [...new Set(props.observations.map((item) => item.owner))].sort();
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

const selectedUser = ref(null);
const currentLeader = ref("");

function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    const key = (typeof obj[property] === "object") ? new Date(obj[property]).toISOString().slice(0, 10) : obj[property].toLowerCase();
    if (!acc[key]) {
      acc[key] = [];
    }
    // Add object to list for given key's value
    acc[key].push(obj);
    return sortObject(acc);
  }, {});
}

function sortObject(o) {
  return Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});
}

const observationsByUser = computed(() => {
  return selectedUser.value === null
    ? props.observations.sort((a, b) => b.date - a.date)
    : props.observations.filter((obs) => obs.owner === selectedUser.value).sort((a, b) => b.date - a.date);
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
    flattening: 0.05
  }
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
        currentValue += observationsByDate.value[obsDate].filter(obs => obs.owner === owner).length;
        values.push([days * graphWidthOfEachDay, currentValue]);
      }
      day.setDate(day.getDate() + 1);
    }

    return values;
  }

  users.value.forEach(user => {
    graphData.push({
      name: user.name,
      colors: {
        path: cssColor(user.name),
        circles: "var(--color-text-dim)"
      },
      values: createGraphData(user.name)
    });
  });

  datasets.value = graphData;
};

onMounted(() => {
  window.addEventListener("resize", resize);
  resize();
});

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

function emitSelect(obs) {
  emit("select", obs);
}

function emitDelete(id) {
  emit("delete", id);
}

function emitEdit(obs) {
  emit("edit", obs);
}

const comment = ref("");

/* Comments */
async function addComment() {
  await db.comments.add({
    comment: comment.value.trim(),
    userId: props.user,
    date: new Date(),
    listId: listId.value,
  });

  // Reset form field value
  comment.value = "";
}

watch(currentLeader, (newLeader) => {
  initGraph()
  // Announce new leader only if you’re not alone
  if (users.value.length > 1 && newLeader === props.user) {
    emit("newLeader");
  }
});
</script>

<template>
  <slot name="header" />

  <slot name="default">
    <nav class="user-nav" v-if="users.length > 1">
      <transition-group name="list" appear>
        <button
          v-for="{ name, score, leader } in users"
          class="user-button"
          :class="name === selectedUser && 'user-button--active'"
          @click="changeUser(name)"
          :key="name"
        >
          <user-icon :user="name" :score="score" :leader="leader">
            <span :class="name === props.user && 'me'">{{ name }}</span>
          </user-icon>
        </button>
      </transition-group>
    </nav>

    <div v-if="users.length > 1" class="chart-wrapper">
      <svg-chart :datasets="datasets" :options="options" :svg="svg" :user="selectedUser"></svg-chart>
    </div>

    <nav class="nav" v-if="observations.length">
      <a
        href="#bydate"
        class="nav-link"
        :class="{
          current: sort == 'bydate',
        }"
        @click.prevent="emitSort('bydate')"
        >Obsar <span class="nav-count">({{ observationsByUser.length }})</span></a
      >
      <a
        href="#byname"
        class="nav-link"
        :class="{
          current: sort == 'byname',
        }"
        @click.prevent="emitSort('byname')"
        >Arter <span class="nav-count">({{ Object.keys(speciesByUser).length }})</span></a
      >
      <a
        v-if="listId"
        href="#comments"
        class="nav-link"
        :class="{
          current: sort == 'comments',
        }"
        @click.prevent="emitSort('comments')"
      >💬</a>
    </nav>

    <section id="bydate" v-if="observations.length && props.sort == 'bydate'">
      <transition-group tag="ul" name="list" class="list">
        <observation-item
          v-for="obs in observationsByUser"
          :obs="obs"
          :key="obs.date"
          :selected="props.selected"
          :user="props.user"
          @select="emitSelect(obs)"
          @delete="emitDelete(id)"
          @edit="emitEdit(obs)"
        ></observation-item>
      </transition-group>
    </section>

    <section id="byname" v-if="species.length && props.sort == 'byname'">
      <transition-group tag="ol" name="list" class="list">
        <species-item v-for="obs in speciesByUser" :obs="obs" :key="obs[0].name"></species-item>
      </transition-group>
    </section>

    <section id="comments" v-if="listId && props.sort == 'comments'">
      <form>
        <div>
          <textarea v-model="comment" class="comment-input" placeholder="Skriv nåt trevligt till de andra på listan…"></textarea>
          <button class="comment-btn" @click.prevent="addComment">Skicka</button>
        </div>
      </form>
      <transition-group tag="ol" name="list" class="list">
        <comment-item v-for="comment in comments" :comment="comment" :key="id"></comment-item>
      </transition-group>
    </section>

    <section class="empty-list" v-if="user && !observations.length">
      <h3 class="center">Inga observerade 🐦</h3>
    </section>
  </slot>
</template>

<style>
.empty-list {
  display: flex;
  height: 70%;
  align-items: center;
  justify-content: center;
}

.list {
  position: relative;
  margin: 0.5rem 0 0;
}

.list li {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-top: 1px solid var(--color-background-dim);
  background: var(--color-background);
}

.list .obs {
  display: flex;
  flex: 1;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.6rem 1em;
  transition: 0.1s transform ease-out;
}

.date {
  color: var(--color-text-dim);
}

.name {
  margin-right: auto;
}

.name::first-letter {
  color: var(--color-background-dim);
  letter-spacing: 0.5ch;
}

.user-nav {
  position: sticky;
  top: 0;
  display: flex;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  overflow: auto;
  white-space: nowrap;
  box-shadow: rgb(17 17 26 / 10%) 0 6px 8px 0;
  z-index: 1;
}

.user-button {
  min-width: 7rem;
  width: 25%;
  margin: 0;
  padding: 5px 0 0;
  color: inherit;
  background: none;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-button .user {
  width: 2.5rem;
  height: 2.5rem;
}

.user-button .me::before {
  content: "Jag:";
  display: inline-block;
  position: absolute;
  left: 0.1em;
  font-style: italic;
  font-size: 0.8em;
}

.user-button--active .user {
  box-shadow: inset 0 0 0 2px var(--color-text);
}

.seen-by {
  margin: -0.2em 0 -0.2em 0.5em;
}

.comment-input {
  width: calc(100% - 2rem);
  height: 4rem;
  margin: 1rem 1rem 0;
  padding: 0.5rem;
  font-size: inherit;
}

.comment-btn {
  width: calc(100% - 2rem);
  margin: 0 1rem 1rem;
}
</style>
