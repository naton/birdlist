import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import FriendsView from "../views/FriendsView.vue";
import SettingsView from "../views/SettingsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      children: [
        {
          path: "lists",
          name: "lists",
          component: () => import("../views/ListsView.vue"),
        },
        {
          path: "/list/:id",
          name: "list",
          component: () => import("../views/SingleList.vue"),
          props: true,
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
