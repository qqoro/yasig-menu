import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import WindowLayout from "./components/layout/WindowLayout.vue";
import HomeView from "./components/view/HomeView.vue";
import SettingView from "./components/view/SettingView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "",
    component: WindowLayout,
    children: [
      { path: "", component: HomeView },
      { path: "setting", component: SettingView },
    ],
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
