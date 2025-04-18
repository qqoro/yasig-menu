<script setup lang="ts">
import logo from "@/assets/logo.png";
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import { toast } from "vue-sonner";
import { useApi } from "../../composable/useApi";
import { useEvent } from "../../composable/useEvent";
import { IpcMainSend, IpcRendererSend } from "../../events";
import { cn } from "../../lib/utils";
import { useSetting } from "../../store/setting-store";
import { Toaster } from "../ui/sonner";

const route = useRoute();
const api = useApi();
const setting = useSetting();
const isMaximized = ref(false);

const zoomIn = () => {
  if (setting.zoom + 5 <= 100) {
    setting.saveZoom(setting.zoom + 5);
  }
};

const zoomOut = () => {
  if (setting.zoom - 5 > 0) {
    setting.saveZoom(setting.zoom - 5);
  }
};

useEvent(
  IpcMainSend.Message,
  (
    _,
    {
      type,
      message,
      description,
    }: {
      type: "info" | "warning" | "error" | "success";
      message: string;
      description?: string;
    }
  ) => {
    toast[type](message, { description });
  }
);
useEvent(IpcMainSend.WindowStatusChange, (e, isMax) => {
  isMaximized.value = isMax;
});
</script>

<template>
  <header
    class="flex flex-row justify-between w-full bg-slate-200/50 backdrop-blur-sm z-10 py-2 px-4 sticky top-0 title-bar h-14"
  >
    <RouterLink
      to="/"
      class="flex gap-2 shrink-0 justify-center items-center text-3xl"
    >
      <img :src="logo" alt="Logo" style="height: 24px" />
      <div class="font-semibold text-lg">야식메뉴판</div>
    </RouterLink>
    <div class="flex button-group">
      <button
        class="hover:bg-slate-600 transition-colors px-4 hover:text-background"
        @click="api.send(IpcRendererSend.WindowMinimize)"
      >
        <Icon icon="material-symbols:chrome-minimize-rounded" />
      </button>
      <button
        class="hover:bg-slate-600 transition-colors px-4 hover:text-background"
        @click="api.send(IpcRendererSend.WindowMaximizeToggle)"
      >
        <Icon
          v-if="!isMaximized"
          icon="material-symbols:chrome-maximize-outline"
        />
        <Icon v-else icon="material-symbols:chrome-restore-outline-rounded" />
      </button>
      <button
        class="hover:bg-red-600 transition-colors px-4 hover:text-background"
        @click="api.send(IpcRendererSend.WindowClose)"
      >
        <Icon icon="material-symbols:close-rounded" />
      </button>
    </div>
  </header>
  <nav
    class="flex text-sm items-center bg-slate-100/50 backdrop-blur-sm sticky top-14 z-10"
  >
    <RouterLink
      to="/"
      :class="
        cn('px-4 py-2 transition-colors hover:bg-slate-300', {
          'font-bold': route.path === '/',
        })
      "
      >Home</RouterLink
    >
    <RouterLink
      to="/setting"
      :class="
        cn('px-4 py-2 transition-colors hover:bg-slate-300', {
          'font-bold': route.path === '/setting',
        })
      "
      >Setting</RouterLink
    >
    <div class="flex justify-end w-full gap-1 pr-4 items-center">
      <button
        class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
        @click="zoomIn"
      >
        <Icon icon="solar:magnifer-zoom-in-outline" />
      </button>
      카드 크기 변경
      <button
        class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
        @click="zoomOut"
      >
        <Icon icon="solar:magnifer-zoom-out-outline" />
      </button>
    </div>
  </nav>
  <RouterView #default="{ Component }">
    <component :is="Component" class="py-2 px-4 pb-6" />
  </RouterView>
  <Toaster rich-colors close-button />
</template>

<style scoped>
.title-bar {
  -webkit-app-region: drag;
}
.button-group {
  -webkit-app-region: no-drag;
}
</style>
