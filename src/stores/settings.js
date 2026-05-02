import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import { useObservable } from "@vueuse/rxjs";
import { db } from "../db";

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "sv", "de"];
export const DEFAULT_REGION = "en-GB";
export const SUPPORTED_REGIONS = ["en-US", "en-GB", "sv-SE"];
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 24;

function getNavigatorLanguage() {
  return globalThis.navigator?.language || DEFAULT_LANGUAGE;
}

function clampFontSize(value) {
  const numericValue = Number.parseFloat(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(numericValue)));
}

function getDefaultFontSize() {
  if (!globalThis.document?.documentElement) {
    return 16;
  }

  return clampFontSize(getComputedStyle(document.documentElement).fontSize) || 16;
}

export function normalizeLanguage(value) {
  const language = String(value || "")
    .split("-")[0]
    .toLowerCase();

  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

export function normalizeRegion(value) {
  const regionCode = String(value || "").trim();

  if (SUPPORTED_REGIONS.includes(regionCode)) {
    return regionCode;
  }

  const language = regionCode.split("-")[0].toLowerCase();
  const country = regionCode.split("-")[1]?.toUpperCase();

  if (language === "sv") {
    return "sv-SE";
  }

  if (language === "en" && country === "US") {
    return "en-US";
  }

  return DEFAULT_REGION;
}

export const useSettingsStore = defineStore("settings", () => {
    const browserLanguage = getNavigatorLanguage();
    const locale = ref(normalizeRegion(browserLanguage));
    const lang = ref(normalizeLanguage(browserLanguage));
    const hue = ref("45");
    const fontSize = ref(getDefaultFontSize());
    const texts = ref({});
    const currentUser = useObservable(db.cloud.currentUser);
    const selectedUser = ref(null);
    const isUserLoggedIn = computed(() => currentUser.value.userId !== 'unauthorized');
    const firstVisit = !localStorage.getItem('birdlist-observations');
    const isPremiumUser = computed(() => currentUser.value.license?.type === 'prod');
    const currentYear = ref(new Date().getFullYear());
    const currentMonth = ref(new Date().getMonth());

    // Reset month to current month on app initialization
    function resetMonthToCurrentMonth() {
      const now = new Date();
      currentYear.value = now.getFullYear();
      currentMonth.value = now.getMonth();
    }

    function t(l10n_key, ...args) {
      const l10n = texts.value[l10n_key];

      if (args && typeof l10n === "function") {
        return l10n(...args);
      } else {
        return l10n ? l10n : `⚠️ ${l10n_key}`;
      }
    }

    async function loadTexts(language = lang.value) {
      const normalizedLanguage = normalizeLanguage(language);

      if (lang.value !== normalizedLanguage) {
        lang.value = normalizedLanguage;
      }

      try {
        texts.value = (await import(`@/assets/texts_${normalizedLanguage}.json`)).default[0];
      } catch (error) {
        if (normalizedLanguage !== DEFAULT_LANGUAGE) {
          lang.value = DEFAULT_LANGUAGE;
          texts.value = (await import("@/assets/texts_en.json")).default[0];
          return texts.value;
        }

        throw error;
      }

      return texts.value;
    }

    function getThemeColor() {
      const elm = document.querySelector(".nav-link.router-link-active") || document.querySelector(".body-nav");
      if (!elm) {
        return 'transparent';
      }

      return getComputedStyle(elm).backgroundColor;
    }

    function setThemeColor() {
      document.querySelector('meta[name="theme-color"]').content =
      document.querySelector('meta[name="msapplication-TileColor"]').content = getThemeColor();
    }

    function prevMonth() {
      if (currentMonth.value === 0) {
        currentYear.value--;
        currentMonth.value = 11;
      } else {
        currentMonth.value--;
      }
    }
    
    function nextMonth() {
      if (currentMonth.value === 11) {
        currentYear.value++;
        currentMonth.value = 0;
      } else {
        currentMonth.value++;
      }
    }

    const currentMonthFormatted = computed(() => {
      // Create a new Date on the 1st day of the month to avoid rollover issues
      // Always use day 1 to prevent issues with month rollovers (e.g., Feb 30 -> Mar 2)
      const date = new Date(currentYear.value, currentMonth.value, 1);
      return new Intl.DateTimeFormat(normalizeLanguage(lang.value), {
        year: "numeric",
        month: "long",
      }).format(date);
    });

    watch(locale, (newLocale) => {
      const normalizedRegion = normalizeRegion(newLocale);

      if (newLocale !== normalizedRegion) {
        locale.value = normalizedRegion;
      }
    }, { immediate: true });

    watch(lang, (newLang) => {
      const normalizedLanguage = normalizeLanguage(newLang);

      if (newLang !== normalizedLanguage) {
        lang.value = normalizedLanguage;
        return;
      }

      if (globalThis.document?.documentElement) {
        document.documentElement.lang = normalizedLanguage;
      }
      loadTexts(normalizedLanguage);
    }, { immediate: true });

    watch(hue, (newHue) => {
      document.documentElement.style.setProperty("--hue", newHue);
      if (document.querySelector(".router-link-active")) {
        setThemeColor();
      }
    }, { immediate: true });

    watch(fontSize, (newFontSize) => {
      const normalizedFontSize = clampFontSize(newFontSize) || getDefaultFontSize();

      if (newFontSize !== normalizedFontSize) {
        fontSize.value = normalizedFontSize;
        return;
      }

      document.documentElement.style.setProperty("font-size", `${normalizedFontSize}px`);
    }, { immediate: true });

    var matchMediaDark = window.matchMedia("(prefers-color-scheme: dark)");
    var matchMediaLight = window.matchMedia("(prefers-color-scheme: light)");

    matchMediaDark.addEventListener("change", () => setThemeColor());
    matchMediaLight.addEventListener("change", () => setThemeColor());

    return {
      locale,
      lang,
      hue,
      fontSize,
      texts,
      firstVisit,
      currentUser,
      selectedUser,
      isUserLoggedIn,
      isPremiumUser,
      currentYear,
      currentMonth,
      currentMonthFormatted,
      t,
      loadTexts,
      normalizeLanguage,
      normalizeRegion,
      clampFontSize,
      setThemeColor,
      prevMonth,
      nextMonth,
      resetMonthToCurrentMonth,
    };
  },
  {
    persist: {
      key: "birdlist-settings",
      paths: ["locale", "lang", "hue", "fontSize"],
    },
  }
);
