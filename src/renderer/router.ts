import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import WindowLayout from "./components/layout/WindowLayout.vue";
import HomeView from "./feature/home/view/HomeView.vue";
import SettingView from "./feature/setting/view/SettingView.vue";

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
