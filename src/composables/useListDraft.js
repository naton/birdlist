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

function validateListDraft(listDraft) {
  const errors = {};
  const draft = listDraft || {};
  const title = (draft.title || "").trim();
  const type = draft.type || "normal";

  if (!title) {
    errors.title = "Validation_Title_Required";
  }

  if (type === "bingo") {
    const bingoSize = Number(draft.bingoSize);
    if (![3, 4, 5].includes(bingoSize)) {
      errors.bingoSize = "Validation_Bingo_Size";
    }
  }

  if (type === "birdstreak") {
    const startDate = new Date(draft.startDate);
    const endDate = new Date(draft.endDate);

    if (Number.isNaN(startDate.getTime())) {
      errors.startDate = "Validation_Start_Date_Invalid";
    }
    if (Number.isNaN(endDate.getTime())) {
      errors.endDate = "Validation_End_Date_Invalid";
    }
    if (!errors.startDate && !errors.endDate && endDate < startDate) {
      errors.endDate = "Validation_End_Before_Start";
    }

    const reportInterval = Number(draft.reportInterval);
    if (![1, 2, 3, 7].includes(reportInterval)) {
      errors.reportInterval = "Validation_Report_Interval_Invalid";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export {
  createDefaultListDraft,
  createEditableListDraft,
  normalizeListDraftForSave,
  buildCreateListPayload,
  validateListDraft,
};
