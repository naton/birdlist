import { ref } from "vue";
import { getPublicListParticipants } from "@/helpers";
import { useListsStore } from "@/stores/lists.js";

function normalizeParticipants(values) {
  return [...new Set((values || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

export function useListParticipants(listRef) {
  const listsStore = useListsStore();
  const { isPublicList, getListMembers } = listsStore;

  const listParticipants = ref([]);
  let participantRequestId = 0;

  async function refreshListParticipants() {
    const list = listRef.value;
    const requestId = ++participantRequestId;
    if (!list?.id) {
      listParticipants.value = [];
      return;
    }

    if (isPublicList(list)) {
      const result = await getPublicListParticipants(list.id);
      if (requestId !== participantRequestId) {
        return;
      }
      listParticipants.value = normalizeParticipants(result?.success ? result.data?.participants : [list.owner]);
      return;
    }

    const members = await getListMembers(list.id);
    if (requestId !== participantRequestId) {
      return;
    }
    listParticipants.value = normalizeParticipants(members.map((member) => member.email || member.userId));
  }

  return {
    listParticipants,
    refreshListParticipants,
  };
}
