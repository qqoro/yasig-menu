<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { useApi } from "../../composable/useApi";
import { useEvent } from "../../composable/useEvent";
import { useWindowEvent } from "../../composable/useWindowEvent";
import { IpcMainSend, IpcRendererSend } from "../../events";
import { searchFuzzy } from "../../lib/search";
import { cn } from "../../lib/utils";
import { useSetting } from "../../store/setting-store";
import GameCard from "../GameCard.vue";
import PageTitle from "../PageTitle.vue";

const api = useApi();
const setting = useSetting();
const loading = ref(true);
const list = ref<{ path: string; title: string; thumbnail?: string }[]>([]);
const searchOpen = ref(false);
const searchWord = ref("");
const searchFilteredList = computed(() => {
  if (searchWord.value === "") {
    return list.value;
  }
  const regexp = searchFuzzy(searchWord.value);
  return list.value.filter(({ title }) => {
    const trimmed = title.replace(" ", "");
    return regexp.some((r) => r.test(trimmed));
  });
});

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

useWindowEvent("keydown", (e) => {
  if (e.key.toLowerCase() === "f" && e.ctrlKey) {
    searchOpen.value = !searchOpen.value;
  }
  if (searchOpen.value && e.key === "Enter") {
    searchOpen.value = false;
  }
});

const gameExist = computed(
  () => !(setting.sources.length === 0 || list.value.length === 0)
);
</script>

<template>
  <main class="flex flex-col gap-4">
    <PageTitle
      >게임 목록
      <span
        v-if="searchWord.length > 0"
        class="text-muted-foreground text-sm italic"
        >(검색어 : {{ searchWord }})</span
      ></PageTitle
    >
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
        v-for="({ path, title, thumbnail }, index) in searchFilteredList"
        :key="path + index"
        :path="path"
        :title="title"
        :thumbnail="thumbnail"
      />

      <div
        v-if="gameExist && searchFilteredList.length === 0"
        class="flex justify-center items-center w-full h-full py-10"
      >
        <span>
          검색 된 게임이 없습니다. 다른 검색어로 게임을 검색해보세요.
        </span>
      </div>

      <Dialog
        :open="searchOpen"
        :modal="false"
        @update:open="(newOpen) => (searchOpen = newOpen)"
      >
        <DialogContent class="p-0" variant="min">
          <DialogHeader class="sr-only">
            <DialogTitle>검색</DialogTitle>
            <DialogDescription>검색</DialogDescription>
          </DialogHeader>
          <div class="flex flex-row justify-center items-center gap-1 relative">
            <Icon icon="solar:magnifer-linear" class="absolute left-2" />
            <Input
              class="pl-8"
              placeholder="검색어 입력..."
              v-model="searchWord"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </main>
</template>
