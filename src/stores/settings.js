import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import { useObservable } from "@vueuse/rxjs";
import { db } from "../db";

export const useSettingsStore = defineStore("settings", () => {
    const locale = ref(navigator.language);
    const lang = ref(navigator.language.split("-")[0]);
    const hue = ref("45");
    const texts = ref({});
    const currentUser = useObservable(db.cloud.currentUser);
    const selectedUser = ref(null);
    const isUserLoggedIn = computed(() => currentUser.value.userId !== 'unauthorized');
    const isPremiumUser = computed(() => currentUser.value.license?.type === 'prod');
    const currentYear = ref(new Date().getFullYear());
    const currentMonth = ref(new Date().getMonth());

    function t(l10n_key, ...args) {
      const l10n = texts.value[l10n_key];

      if (args && typeof l10n === "function") {
        return l10n(...args);
      } else {
        return l10n ? l10n : `⚠️ ${l10n_key}`;
      }
    }

    async function loadTexts(locale) {
      const lang = locale.split("-")[0];
      texts.value = (await import(`@/assets/texts_${lang}.json`)).default[0];
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
      const date = new Date().setFullYear(currentYear.value, currentMonth.value);
      return new Intl.DateTimeFormat("sv", {
        year: "numeric",
        month: "long",
      }).format(date);
    });

    watch(locale, (newLocale) => {
      loadTexts(newLocale);
    });

    watch(hue, (newHue) => {
      document.documentElement.style = `--hue: ${newHue}`;
      if (document.querySelector(".router-link-active")) {
        setThemeColor();
      }
    });

    var matchMediaDark = window.matchMedia("(prefers-color-scheme: dark)");
    var matchMediaLight = window.matchMedia("(prefers-color-scheme: light)");

    matchMediaDark.addEventListener("change", () => setThemeColor());
    matchMediaLight.addEventListener("change", () => setThemeColor());

    return {
      locale,
      lang,
      hue,
      texts,
      currentUser,
      selectedUser,
      isUserLoggedIn,
      isPremiumUser,
      currentYear,
      currentMonth,
      currentMonthFormatted,
      t,
      loadTexts,
      setThemeColor,
      prevMonth,
      nextMonth,
    };
  },
  {
    persist: {
      key: "birdlist-settings",
      paths: ["locale", "lang", "hue"],
    },
  }
);
