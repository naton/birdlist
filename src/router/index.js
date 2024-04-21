import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import MonthlyList from "../views/lists/MonthlyList.vue";
import ListsView from "../views/ListsView.vue";
import FriendsView from "../views/FriendsView.vue";
import SettingsView from "../views/SettingsView.vue";
import AboutView from "../views/AboutView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/home",
      name: "home",
      component: HomeView,
      children: [
        {
          path: "/lists",
          name: "lists",
          component: ListsView,
          children: [
            {
              path: "/lists/:id",
              name: "list",
              component: () => import("../views/lists/SingleList.vue"),
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
          component: () => import("../views/lists/YearlyList.vue"),
        },
      ],
    },
    {
      path: "/friends",
      name: "friends",
      component: FriendsView,
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
    },
    {
      path: "/about",
      name: "about",
      component: AboutView,
    },
  ],
});

export default router;
