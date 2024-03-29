<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { db } from "../db";
import { useSettingsStore } from "@/stores/settings.js";
import { useObservationsStore } from "@/stores/observations.js";
import ObservationItem from "./ObservationItem.vue";
import UserIcon from "./icons/UserIcon.vue";
import SpeciesItem from "./SpeciesItem.vue";
import CommentItem from "./CommentItem.vue";
import SvgChart from "./SvgChart.vue";
import { cssColor } from "@/helpers";

const props = defineProps(["list", "comments", "sort", "observations"]);
const emit = defineEmits(["sort", "delete", "edit", "newLeader"]);

const settingsStore = useSettingsStore();
const { t } = settingsStore;
const { currentUser } = storeToRefs(settingsStore);

const observationsStore = useObservationsStore();
const { selectObservation } = observationsStore;

const species = computed(() => [...new Set(props.observations.map((item) => item.name))].sort());

const svg = reactive({
  w: 0,
  h: 0,
});

function resize() {
  if (users.value.length > 1) {
    const chart = document.querySelector(".chart-wrapper");
    svg.w = chart.offsetWidth;
    svg.h = 200;
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

const selectedUser = ref(null);
const currentLeader = ref("");

function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    const key =
      typeof obj[property] === "object"
        ? new Date(obj[property]).toISOString().slice(0, 10)
        : obj[property].toLowerCase();
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
}

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
  selectObservation(obs);
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
    userId: currentUser.value.name,
    date: new Date(),
    listId: props.list.listId,
  });

  // Reset form field value
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
</script>

<template>
  <slot name="header" />

  <slot name="default">
    <nav class="user-nav" v-if="users?.length > 1">
      <transition-group name="list" appear>
        <button v-for="{ name, score, leader } in users" class="user-button" :class="name === selectedUser && 'user-button--active'" @click="changeUser(name)" :key="name">
          <user-icon :user="name" :score="score" :leader="leader">
            <span :class="name === props.user && 'me'">{{ name }}</span>
          </user-icon>
        </button>
      </transition-group>
    </nav>

    <div class="chart-wrapper">
      <svg-chart v-if="users?.length > 1" :datasets="datasets" :options="options" :svg="svg" :user="selectedUser"></svg-chart>
    </div>

    <nav class="nav" v-if="props.observations.length">
      <a href="#bydate" class="nav-link" :class="{ current: sort == 'bydate', }" @click.prevent="emitSort('bydate')" :title="t('Observations')"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 16 16"><g transform="translate(0, 0)"><path fill="currentColor" d="M15.2,7.7L15.2,7.7c-0.8-1.1-2.9-3.9-3.7-5l0,0C11.1,2.3,10.6,2,10,2C8.9,2,8,2.9,8,4c0-1.1-0.9-2-2-2 C5.4,2,4.9,2.3,4.5,2.7l0,0c-0.8,1-2.9,3.8-3.7,5l0,0C0.3,8.3,0,9.1,0,10c0,2.2,1.8,4,4,4s4-1.8,4-4c0,2.2,1.8,4,4,4s4-1.8,4-4 C16,9.1,15.7,8.3,15.2,7.7z M4,12c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S5.1,12,4,12z M12,12c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2 S13.1,12,12,12z"></path></g></svg> <span class="nav-count">({{ observationsByUser.length }})</span></a>
      <a href="#byname" class="nav-link" :class="{ current: sort == 'byname', }" @click.prevent="emitSort('byname')" :title="t('Species')"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 16 16"><g transform="translate(0, 0)"><path fill="currentColor" d="M14.128,7.084c-.443-.946-.861-1.841-.878-3.483-.019-1.888-1.447-3.465-3.25-3.592-.568-.04-1.116,.054-1.633,.277-.233,.102-.5,.102-.734,0C7.116,.062,6.569-.03,6,.009c-1.803,.127-3.231,1.704-3.25,3.592-.017,1.643-.435,2.537-.878,3.483-.429,.916-.872,1.862-.872,3.416,0,3.032,2.467,5.5,5.5,5.5h3c3.033,0,5.5-2.468,5.5-5.501,0-1.553-.443-2.5-.872-3.415ZM5,3.5c.551,0,1,.448,1,1s-.449,1-1,1-1-.448-1-1,.449-1,1-1Zm6.972,9.211c-.047,.134-.149,.242-.28,.297l-1.197,.498c-.792,.329-1.644,.494-2.495,.494s-1.702-.165-2.495-.494l-1.197-.498c-.131-.055-.233-.163-.28-.297s-.034-.282,.034-.406l1.419-2.573,.558-2.578c.179-.927,1.005-1.607,1.961-1.607,.944,0,1.768,.67,1.959,1.594l.56,2.592,1.419,2.573c.068,.124,.081,.272,.034,.406Zm-.972-7.211c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1Z"></path></g></svg> <span class="nav-count">({{ Object.keys(speciesByUser).length }})</span></a>
      <a v-if="props.comments" href="#comments" class="nav-link" :class="{ current: sort == 'comments', }" @click.prevent="emitSort('comments')" :title="t('Comments')"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 16 16"><g transform="translate(0, 0)"><path fill="currentColor" d="M14.853,6.861c-.729,3.487-4.193,6.139-8.353,6.139-.102,0-.201-.016-.302-.019,1.035,.637,2.359,1.019,3.802,1.019,.51,0,1.003-.053,1.476-.143l2.724,2.043c.088,.066,.193,.1,.3,.1,.076,0,.153-.018,.224-.053,.169-.085,.276-.258,.276-.447v-3.515c.631-.712,1-1.566,1-2.485,0-.987-.429-1.897-1.147-2.639Z"></path><path d="M6.5,0C2.91,0,0,2.462,0,5.5c0,1.075,.37,2.074,1,2.922v3.078c0,.189,.107,.362,.276,.447,.07,.035,.147,.053,.224,.053,.106,0,.212-.034,.3-.1l1.915-1.436c.845,.34,1.787,.536,2.785,.536,3.59,0,6.5-2.462,6.5-5.5S10.09,0,6.5,0Z"></path></g></svg> <span class="nav-count">({{ noOfComments() }})</span></a>
    </nav>

    <section id="bydate" v-if="props.observations.length && props.sort == 'bydate'">
      <transition-group tag="ul" name="list" class="list">
        <observation-item v-for="obs in observationsByUser" :obs="obs" :key="obs.date" :user="currentUser.name" @select="emitSelect(obs)" @delete="emitDelete(id)" @edit="emitEdit"></observation-item>
      </transition-group>
    </section>

    <section id="byname" v-if="species.length && props.sort == 'byname'">
      <transition-group tag="ol" name="list" class="list">
        <species-item v-for="obs in speciesByUser" :obs="obs" :key="obs[0].name"></species-item>
      </transition-group>
    </section>

    <section id="comments" v-if="props.list && props.sort == 'comments'">
      <form>
        <div>
          <textarea v-model="comment" class="comment-input" :placeholder="t('Write_Something_To_The_Others')"></textarea>
          <button class="comment-btn" @click.prevent="addComment">{{ t("Submit") }}</button>
        </div>
      </form>
      <transition-group tag="ol" name="list" class="list">
        <comment-item v-for="comment in props.comments" :comment="comment" :user="currentUser.name" :key="comment.id"></comment-item>
      </transition-group>
    </section>

    <section class="empty-list" v-if="currentUser.name && !props.observations.length">
      <h3 class="center">{{ t("No_Observations") }}</h3>
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
