<script setup lang="ts">
import { onMounted, ref } from "vue";
import Changelog from "./components/Changelog.vue";
import { useApi } from "./composable/useApi";
import { useEvent } from "./composable/useEvent";
import { useWindowEvent } from "./composable/useWindowEvent";
import { IpcMainSend, IpcRendererSend } from "./events";

const api = useApi();
const open = ref(false);

useWindowEvent("keyup", (event) => {
  switch (true) {
    // 창 종료
    case event.key.toLowerCase() === "w" && event.ctrlKey:
      window.close();
      break;
    // 새로고침
    case event.key.toLowerCase() === "r" && event.ctrlKey:
      location.reload();
      break;
  }
});

onMounted(() => {
  api.send(IpcRendererSend.VersionCheck);
});
useEvent(IpcMainSend.VersionChecked, (e, version) => {
  const appLatestVersion = localStorage.getItem("version");
  if (appLatestVersion === version) {
    return;
  }

  open.value = true;
  localStorage.setItem("version", version);
});
</script>

<template>
  <RouterView />
  <Changelog v-model:open="open" />
</template>
