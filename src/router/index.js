import { createRouter, createWebHistory } from "vue-router";
import ObservationLayout from "../views/ObservationLayout.vue";
import ListsRouteShell from "../features/lists/components/ListsRouteShell.vue";
import MonthlyList from "../views/lists/MonthlyList.vue";

const loadListsView = () => import("../views/ListsView.vue");
const loadSingleListView = () => import("../views/lists/SingleList.vue");
const loadYearlyListView = () => import("../views/lists/YearlyList.vue");
const loadFriendsView = () => import("../views/FriendsView.vue");
const loadSettingsView = () => import("../views/SettingsView.vue");
const loadAboutView = () => import("../views/AboutView.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/home",
      name: "home",
      component: ObservationLayout,
      children: [
        {
          path: "/lists",
          name: "lists",
          component: ListsRouteShell,
          children: [
            {
              path: "/lists/:id",
              name: "list",
              component: loadSingleListView,
            },
          ],
        },
        {
          alias: "/",
          path: "/monthly",
          name: "monthly",
          component: MonthlyList,
        },
        {
          path: "/yearly",
          name: "yearly",
          component: loadYearlyListView,
        },
      ],
    },
    {
      path: "/friends",
      name: "friends",
      component: loadFriendsView,
    },
    {
      path: "/settings",
      name: "settings",
      component: loadSettingsView,
    },
    {
      path: "/about",
      name: "about",
      component: loadAboutView,
    },
  ],
});

const routePrefetchLoaders = [
  loadListsView,
  loadSingleListView,
  loadYearlyListView,
  loadFriendsView,
  loadSettingsView,
  loadAboutView,
];

export { routePrefetchLoaders };
export { loadListsView };
export default router;
