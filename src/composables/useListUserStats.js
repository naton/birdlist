import { computed, ref } from "vue";
import { groupBy } from "@/helpers";
import { getBirdKey } from "@/birdNames.js";

function normalizeNames(values = []) {
  return [...new Set(values.map((name) => String(name || "").trim()).filter(Boolean))].sort();
}

function getUniqueBirdCount(observations = []) {
  return Object.keys(groupBy(observations, (obs) => getBirdKey(obs))).length;
}

export function useListUserStats(
  observationsRef,
  selectedUserRef = null,
  participantsRef = null,
  options = {}
) {
  const currentLeader = ref("");
  const scoreForUser =
    typeof options.scoreForUser === "function"
      ? options.scoreForUser
      : (name, observations) => getUniqueBirdCount(observations.filter((obs) => obs.owner === name));

  const users = computed(() => {
    const observationOwners = (observationsRef.value || []).map((obs) => obs.owner);
    const participants = participantsRef?.value || [];
    const names = normalizeNames([...participants, ...observationOwners]);

    let highestScore = 0;
    const listUsers = names.map((name) => {
      const score = scoreForUser(name, observationsRef.value || []);
      highestScore = Math.max(highestScore, score);
      return {
        name,
        score,
        leader: false,
      };
    });

    currentLeader.value = "";
    listUsers.forEach((user) => {
      if (highestScore > 0 && user.score === highestScore) {
        user.leader = true;
        currentLeader.value = user.name;
      }
    });

    return listUsers.sort((a, b) => b.score - a.score);
  });

  const observationsByUser = computed(() => {
    const observations = [...(observationsRef.value || [])];
    if (!selectedUserRef || selectedUserRef.value === null) {
      return observations.sort((a, b) => b.date - a.date);
    }

    return observations
      .filter((obs) => obs.owner === selectedUserRef.value)
      .sort((a, b) => b.date - a.date);
  });

  const speciesByUser = computed(() => {
    if (!selectedUserRef || selectedUserRef.value === null) {
      return groupBy(observationsRef.value || [], (obs) => getBirdKey(obs));
    }

    return groupBy(
      (observationsRef.value || []).filter((obs) => obs.owner === selectedUserRef.value),
      (obs) => getBirdKey(obs)
    );
  });

  const species = computed(() => Object.keys(speciesByUser.value));

  function getObservationKey(obs) {
    return obs.id || `${obs.owner || ""}:${obs.listId || ""}:${obs.date?.getTime?.() || obs.date}:${getBirdKey(obs)}`;
  }

  function getSpeciesGroupKey(obsGroup) {
    return getBirdKey(obsGroup?.[0]);
  }

  return {
    currentLeader,
    users,
    observationsByUser,
    speciesByUser,
    species,
    getObservationKey,
    getSpeciesGroupKey,
  };
}
