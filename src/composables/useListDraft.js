function deepClone(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }

  const clone = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      clone[key] = deepClone(value[key]);
    }
  }
  return clone;
}

function toValidDate(value, fallbackDate) {
  const candidate = value ? new Date(value) : null;
  if (!candidate || Number.isNaN(candidate.getTime())) {
    return fallbackDate;
  }
  return candidate;
}

function createDefaultListDraft() {
  const startDate = new Date();
  const endDate = new Date(new Date().setDate(new Date().getDate() + 30));

  return {
    title: "",
    description: "",
    type: "normal",
    startDate,
    endDate,
    reportInterval: 2,
    bingoSize: 3,
  };
}

function normalizeListDraftForSave(listDraft) {
  const fallback = createDefaultListDraft();
  const draft = deepClone(listDraft || fallback);

  draft.title = (draft.title || "").trim();
  draft.description = (draft.description || "").trim();
  draft.type = draft.type || "normal";
  draft.updated = new Date();

  if (draft.type === "bingo") {
    draft.bingoSize = Number(draft.bingoSize) || 3;
  }

  if (draft.type === "birdstreak") {
    draft.startDate = toValidDate(draft.startDate, fallback.startDate);
    draft.endDate = toValidDate(draft.endDate, fallback.endDate);
    draft.reportInterval = Number(draft.reportInterval) || 2;
  }

  return draft;
}

function buildCreateListPayload(listDraft) {
  const normalized = normalizeListDraftForSave(listDraft);
  const payload = {
    title: normalized.title,
    updated: normalized.updated,
    description: normalized.description,
    type: normalized.type,
  };

  if (normalized.type === "bingo") {
    payload.bingoSize = normalized.bingoSize;
  } else if (normalized.type === "birdstreak") {
    payload.startDate = normalized.startDate;
    payload.endDate = normalized.endDate;
    payload.reportInterval = normalized.reportInterval;
  }

  return payload;
}

function createEditableListDraft(list) {
  const fallback = createDefaultListDraft();
  const draft = deepClone(list || fallback);
  draft.type = draft.type || "normal";
  draft.bingoSize = Number(draft.bingoSize) || 3;
  draft.reportInterval = Number(draft.reportInterval) || 2;
  draft.startDate = toValidDate(draft.startDate, fallback.startDate);
  draft.endDate = toValidDate(draft.endDate, fallback.endDate);
  return draft;
}

export {
  createDefaultListDraft,
  createEditableListDraft,
  normalizeListDraftForSave,
  buildCreateListPayload,
};
