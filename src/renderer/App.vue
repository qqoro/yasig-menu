<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IpcMainSend, IpcRendererSend } from "../main/events";
import Changelog from "./components/Changelog.vue";
import { send } from "./composable/useApi";
import { useEvent } from "./composable/useEvent";
import { useWindowEvent } from "./composable/useWindowEvent";
import { useGame } from "./store/game-store";
import { useSetting } from "./store/setting-store";

const game = useGame();
const setting = useSetting();

const open = ref(false);

useWindowEvent("keydown", (event) => {
  switch (true) {
    // 창 종료
    case event.key.toLowerCase() === "w" && event.ctrlKey:
      window.close();
      break;
    // 새로고침
    case event.key.toLowerCase() === "r" && event.ctrlKey:
      location.reload();
      break;
    case event.key.toLowerCase() === "f12":
      send(IpcRendererSend.ToggleDevTools);
      break;
  }
});

onMounted(() => {
  send(IpcRendererSend.VersionCheck);
  game.loadList();
  setting.init();
});
useEvent(IpcMainSend.VersionChecked, (e, id, version) => {
  const appLatestVersion = localStorage.getItem("version");
  if (appLatestVersion === version) {
    return;
  }

  open.value = true;
  localStorage.setItem("version", version);
});
</script>

<template>
  <Suspense>
    <RouterView />
  </Suspense>
  <Changelog v-model:open="open" />
</template>
