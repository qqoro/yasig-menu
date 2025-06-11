<script setup lang="ts">
import { Icon } from "@iconify/vue";
import semver from "semver";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { IpcMainSend, IpcRendererSend } from "../main/events";
import Changelog from "./components/Changelog.vue";
import { send } from "./composable/useApi";
import { useEvent } from "./composable/useEvent";
import { useWindowEvent } from "./composable/useWindowEvent";
import { useGame } from "./store/game-store";

const game = useGame();

const open = ref(false);
const migrationLoading = ref(false);

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
});
useEvent(IpcMainSend.VersionChecked, (e, id, version) => {
  const appLatestVersion = localStorage.getItem("version");
  if (appLatestVersion === version) {
    return;
  }

  open.value = true;
  localStorage.setItem("version", version);
});
useEvent(IpcMainSend.NeedMigration, (e, id, version) => {
  const appLatestVersion = localStorage.getItem("version");
  if (!appLatestVersion) {
    return;
  }

  if (semver.gte(version, "2.0.0") && semver.lt(version, "3.0.0")) {
    migrationLoading.value = true;
  }

  send(IpcRendererSend.MigrationData, { ...localStorage });
});
useEvent(IpcMainSend.MigrationDone, (e, id, version) => {
  migrationLoading.value = true;
  toast.success("업그레이드 마이그레이션이 완료되었습니다!");
});
</script>

<template>
  <div
    v-if="migrationLoading"
    class="w-screen h-screen flex justify-center items-center flex-col gap-4"
  >
    <Icon icon="svg-spinners:ring-resize" class="size-40" />
    <div>업그레이드중입니다.. 잠시만 기다려주세요</div>
  </div>
  <template v-else>
    <Suspense>
      <RouterView />
    </Suspense>
    <Changelog v-model:open="open" />
  </template>
</template>
