<script setup>
import { computed } from "vue";
import { inputDate } from "@/helpers";
import { useSettingsStore } from "../stores/settings.js";
import NormalIcon from "@/components/icons/NormalIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import BingoIcon from "@/components/icons/BingoIcon.vue";
import StreakIcon from "@/components/icons/StreakIcon.vue";

const emit = defineEmits(["esc"]);

const draft = defineModel({ required: true });

defineProps({
  disableTypeSelection: {
    type: Boolean,
    default: false,
  },
  requireDates: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

const settingsStore = useSettingsStore();
const { t } = settingsStore;

const showBingoOptions = computed(() => draft.value?.type === "bingo");
const showBirdstreakOptions = computed(() => draft.value?.type === "birdstreak");

function updateStartDate(value) {
  draft.value.startDate = value ? new Date(value) : null;
}

function updateEndDate(value) {
  draft.value.endDate = value ? new Date(value) : null;
}

function emitEsc(event) {
  emit("esc", event);
}
</script>

<template>
  <label for="list-title">{{ t("List_Name") }}:</label>
  <input
    id="list-title"
    type="text"
    v-model="draft.title"
    @keyup.esc="emitEsc"
    :placeholder="t('Enter_The_Name_Of_The_List')"
    required />
  <small v-if="errors.title" class="field-error">{{ t(errors.title) }}</small>

  <label for="list-description">{{ t("Description") }}:</label>
  <textarea
    id="list-description"
    v-model="draft.description"
    cols="30"
    rows="5"
    :placeholder="t('List_Rules_Etc')"></textarea>

  <label for="list-type">{{ t("Type_Of_List") }}:</label>
  <div id="list-type" class="flex">
    <label class="radio">
      <normal-icon />
      <input v-model="draft.type" type="radio" value="normal" :disabled="disableTypeSelection" />{{ t("Normal") }}
    </label>
    <label class="radio">
      <check-icon />
      <input v-model="draft.type" type="radio" value="checklist" :disabled="disableTypeSelection" />{{ t("Checklist") }}
    </label>
    <label class="radio">
      <bingo-icon />
      <input v-model="draft.type" type="radio" value="bingo" :disabled="disableTypeSelection" />{{ t("Bingo") }}
    </label>
    <label class="radio">
      <streak-icon />
      <input v-model="draft.type" type="radio" value="birdstreak" :disabled="disableTypeSelection" />{{ t("Birdstreak") }}
    </label>
  </div>

  <template v-if="showBingoOptions">
    <fieldset class="flex margin-top">
      <legend>{{ t("Size") }}</legend>
      <label class="radio">
        <bingo-icon />
        <input type="radio" value="3" v-model="draft.bingoSize" />3 x 3
      </label>
      <label class="radio">
        <bingo-icon />
        <input type="radio" value="4" v-model="draft.bingoSize" />4 x 4
      </label>
      <label class="radio">
        <bingo-icon />
        <input type="radio" value="5" v-model="draft.bingoSize" />5 x 5
      </label>
    </fieldset>
    <small v-if="errors.bingoSize" class="field-error">{{ t(errors.bingoSize) }}</small>
  </template>

  <template v-if="showBirdstreakOptions">
    <div class="margin-bottom">
      <div class="flex">
        <div class="half">
          <label for="start-date">{{ t("Start_Date") }}:</label>
          <input
            id="start-date"
            type="date"
            @input="updateStartDate($event.target.value)"
            :value="inputDate(draft.startDate)"
            :required="requireDates" />
          <small v-if="errors.startDate" class="field-error">{{ t(errors.startDate) }}</small>
        </div>
        <div class="half">
          <label for="end-date">{{ t("End_Date") }}:</label>
          <input
            id="end-date"
            type="date"
            @input="updateEndDate($event.target.value)"
            :value="inputDate(draft.endDate)"
            :required="requireDates" />
          <small v-if="errors.endDate" class="field-error">{{ t(errors.endDate) }}</small>
        </div>
      </div>
      <label for="day-interval">{{ t("Report_Interval") }}:</label>
      <select id="day-interval" v-model.number="draft.reportInterval">
        <option value="1">{{ t("Every_Day") }}</option>
        <option value="2">{{ t("Every_Other_Day") }}</option>
        <option value="3">{{ t("Every_Third_Day") }}</option>
        <option value="7">{{ t("Every_Week") }}</option>
      </select>
      <small v-if="errors.reportInterval" class="field-error">{{ t(errors.reportInterval) }}</small>
    </div>
  </template>
</template>

<style scoped>
.flex > .half {
  width: 50%;
}

.flex:has(.radio) {
  justify-content: space-between;
}

label.radio {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: center;
  align-items: center;
  margin-top: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-border);
  font-weight: normal;
}

label.radio input {
  display: none;
}

label.radio:has(:checked) {
  box-shadow: inset 0 0 0 2px var(--color-border);
  color: var(--color-text);
  background: var(--color-background-dim);
}

.field-error {
  display: block;
  color: #b42318;
  margin-top: 0.25rem;
}
</style>
