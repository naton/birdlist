import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import FriendsView from "../views/FriendsView.vue";
import SettingsView from "../views/SettingsView.vue";

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
          component: () => import("../views/ListsView.vue"),
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
          component: () => import("../views/lists/MonthlyList.vue"),
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
      component: () => import("../views/AboutView.vue"),
    },
  ],
});

export default router;
