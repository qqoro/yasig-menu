<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useApi } from "../../composable/useApi";
import { useEvent } from "../../composable/useEvent";
import { useWindowEvent } from "../../composable/useWindowEvent";
import { IpcMainSend, IpcRendererSend } from "../../events";
import { cn } from "../../lib/utils";
import { useSetting } from "../../store/setting-store";
import GameCard from "../GameCard.vue";
import PageTitle from "../PageTitle.vue";

const api = useApi();
const setting = useSetting();
const loading = ref(true);
const list = ref<{ path: string; title: string; thumbnail?: string }[]>([]);

useEvent(
  IpcMainSend.LoadedList,
  (e, data: { path: string; title: string; thumbnail?: string }[]) => {
    loading.value = false;
    list.value = data;
  }
);

useEvent(IpcMainSend.ThumbnailDone, () => {
  console.warn("called done!");
  const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.LoadList, {
    sources: [...setting.applySources],
    exclude: [...setting.exclude],
    thumbnailFolder: isChange ? thumbnailFolder : undefined,
  });
});

onMounted(() => {
  loading.value = true;
  console.warn("mount!", IpcRendererSend.LoadList);
  const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.LoadList, {
    sources: [...setting.applySources],
    exclude: [...setting.exclude],
    thumbnailFolder: isChange ? thumbnailFolder : undefined,
  });
});

useWindowEvent("focus", () => {
  console.warn("focus!", IpcRendererSend.LoadList);
  const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.LoadList, {
    sources: [...setting.applySources],
    exclude: [...setting.exclude],
    thumbnailFolder: isChange ? thumbnailFolder : undefined,
  });
});

useWindowEvent("keyup", (e) => {
  if (e.key.toLowerCase() === "f" && e.ctrlKey) {
    console.log("i will search!");
  }
});

const gameExist = computed(
  () => !(setting.sources.length === 0 || list.value.length === 0)
);
</script>

<template>
  <main class="flex flex-col gap-4">
    <PageTitle>게임 목록</PageTitle>
    <div
      :class="
        cn({
          'inline-flex gap-4 mx-auto w-fit flex-wrap justify-center  items-start':
            gameExist,
          'flex justify-center items-center h-[calc(100dvh-200px)]': !gameExist,
        })
      "
      :style="{ zoom: setting.zoom * 0.02 }"
    >
      <div
        v-if="!gameExist"
        class="flex justify-center items-center w-full h-full py-10"
      >
        <span v-if="setting.sources.length === 0">
          게임 폴더 경로가 설정되지 않았습니다! 설정에서 경로를 지정해주세요.
        </span>
        <span v-else-if="loading">
          <Icon icon="svg-spinners:ring-resize" class="m-8 size-20" />
        </span>
        <span v-else-if="list.length === 0">
          지정한 경로에서 게임을 찾지 못했습니다.
        </span>
      </div>

      <GameCard
        v-else
        v-for="({ path, title, thumbnail }, index) in list"
        :key="path + index"
        :path="path"
        :title="title"
        :thumbnail="thumbnail"
      />
    </div>
  </main>
</template>
