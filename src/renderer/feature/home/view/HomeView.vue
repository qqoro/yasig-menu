<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import PageTitle from "../../../components/PageTitle.vue";
import Button from "../../../components/ui/button/Button.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { useApi } from "../../../composable/useApi";
import { useEvent } from "../../../composable/useEvent";
import { useWindowEvent } from "../../../composable/useWindowEvent";
import { Sort } from "../../../constants";
import { IpcMainSend, IpcRendererSend } from "../../../events";
import Data from "../../../lib/data";
import { searchFuzzy, sortRJCode } from "../../../lib/search";
import { cn } from "../../../lib/utils";
import { useGame } from "../../../store/game-store";
import { useSearch } from "../../../store/search-store";
import { useSetting } from "../../../store/setting-store";
import { GameData } from "../../../typings/local";
import GameCard from "../components/GameCard.vue";

const api = useApi();
const setting = useSetting();
const { sort } = storeToRefs(useSearch());
const game = useGame();
const list = ref<{ path: string; title: string; thumbnail?: string }[]>([]);
const loading = ref(true);
const memoData = ref<Record<string, string>>(Data.getJSON("memo") ?? {});

const showCount = ref(20);
const moreLoad = (count: number) => {
  showCount.value += count;
};

const searchOpen = ref(false);
const { searchWord } = storeToRefs(useSearch());
const searchFilteredList = computed(() => {
  let recent: GameData[] = [];
  let games: GameData[] = [];

  let sorted: { path: string; title: string; thumbnail?: string }[];
  switch (sort.value) {
    case Sort.Title:
      sorted = [...list.value].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case Sort.TitleDesc:
      sorted = [...list.value].sort((a, b) => b.title.localeCompare(a.title));
      break;
    case Sort.RJCode:
      sorted = [...list.value].sort((a, b) => sortRJCode(a.title, b.title));
      break;
    case Sort.RJCodeDesc:
      sorted = [...list.value].sort((a, b) =>
        sortRJCode(b.title, a.title, true)
      );
      break;
  }

  for (const item of sorted) {
    const gameData = {
      ...item,
      cleared: game.clearGame.includes(item.path),
    };
    if (game.recentGame.includes(item.path) && setting.home.showRecent) {
      recent.push(gameData);
    } else {
      games.push(gameData);
    }
  }

  // 검색어 없는 경우 바로 리턴
  if (searchWord.value === "") {
    // 초기 조회개수 설정
    if (!setting.home.showAll) {
      recent.length = Math.min(recent.length, showCount.value);
      games.length = Math.min(games.length, showCount.value);
    }
    return { recent, games };
  }

  const regexp = searchFuzzy(searchWord.value);
  recent = recent.filter(({ title }) => regexp.test(title.replace(/\s/g, "")));
  games = games.filter(({ title }) => regexp.test(title.replace(/\s/g, "")));
  // 초기 조회개수 설정
  if (!setting.home.showAll) {
    recent.length = Math.min(recent.length, showCount.value);
    games.length = Math.min(games.length, showCount.value);
  }
  return {
    recent,
    games,
  };
});

const gameCardData = ref<{ title: string; thumbnail: string } | undefined>();
const viewGameCard = (title: string, thumbnail: string) => {
  gameCardData.value = { title, thumbnail };
};

const memoModel = ref("");
const gameMemoData = ref<{ path: string; title: string } | undefined>();
const viewGameMemo = (path: string, title: string) => {
  memoModel.value = Data.getJSON("memo")?.[path] ?? "";
  gameMemoData.value = { path, title };
};
const updateViewGameMemo = (open: boolean) => {
  if (!gameMemoData.value) {
    return;
  }

  if (!open) {
    const data = Data.getJSON("memo") ?? {};
    data[gameMemoData.value.path] = memoModel.value;
    Data.setJSON("memo", data);
    memoModel.value = "";
    gameMemoData.value = undefined;

    memoData.value = Data.getJSON("memo") ?? {};
  }
};

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
    <PageTitle class="flex justify-between items-center">
      <p>
        게임 목록
        <span class="text-sm text-muted-foreground"
          >총 {{ list.length }}개</span
        >
      </p>
      <div class="flex justify-center items-center gap-2 max-w-[50dvw]">
        <template v-if="searchWord.length > 0">
          <span
            class="text-sm font-normal text-ellipsis overflow-hidden text-nowrap"
          >
            검색어 : {{ searchWord }}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  size="sm"
                  class="aspect-square"
                  variant="outline"
                  @click="searchWord = ''"
                >
                  <Icon icon="solar:close-circle-outline" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>검색어 초기화</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </template>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon" @click="searchOpen = !searchOpen">
                <Icon icon="solar:magnifer-linear" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div class="flex justify-center items-center gap-0.5">
                <span>Ctrl</span>
                <span>+</span>
                <span>F</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </PageTitle>

    <div
      :class="
        cn({
          'inline-flex gap-4 mx-auto w-fit flex-wrap justify-center items-start max-w-full':
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

      <template v-else>
        <div
          v-if="setting.home.showRecent && searchFilteredList.recent.length > 0"
          class="w-full flex flex-col mb-4"
        >
          <h2 :style="{ zoom: (1 / (setting.zoom * 0.02)) * 1.2 }">
            최근 플레이
          </h2>
          <div
            class="max-w-full overflow-x-auto flex flex-row items-center gap-4"
          >
            <GameCard
              v-for="(
                { path, title, thumbnail, cleared }, index
              ) in searchFilteredList.recent"
              class="shrink-0"
              :key="path + index"
              :path="path"
              :title="title"
              :thumbnail="thumbnail"
              :cleared="cleared"
              :recent="true"
              :memo="
                memoData[path] ? '메모 내용:\n' + memoData[path] : undefined
              "
              @view-thumbnail="viewGameCard"
              @write-memo="viewGameMemo"
            />
          </div>
        </div>
        <GameCard
          v-for="(
            { path, title, thumbnail, cleared }, index
          ) in searchFilteredList.games"
          :key="path + index"
          :path="path"
          :title="title"
          :thumbnail="thumbnail"
          :cleared="cleared"
          :memo="memoData[path] ? '메모 내용:\n' + memoData[path] : undefined"
          @view-thumbnail="viewGameCard"
          @write-memo="viewGameMemo"
        />

        <div
          v-if="
            searchFilteredList.recent.length +
              searchFilteredList.games.length >=
            showCount
          "
          class="w-full flex justify-center items-center gap-4"
          :style="{ zoom: 1 / (setting.zoom * 0.02) }"
        >
          <Button variant="outline" @click="moreLoad(20)"
            >더 불러오기 (20개)</Button
          >
          <Button variant="outline" @click="moreLoad(list.length)"
            >전부 불러오기</Button
          >
        </div>
      </template>

      <Dialog
        :open="!!gameCardData"
        @update:open="(v) => (v === false ? (gameCardData = undefined) : null)"
      >
        <DialogContent
          class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh]"
        >
          <DialogHeader>
            <DialogTitle>{{ gameCardData?.title }}</DialogTitle>
            <DialogDescription class="sr-only">썸네일 뷰어</DialogDescription>
          </DialogHeader>
          <div class="overflow-y-auto">
            <img
              class="w-full object-cover cursor-zoom-out"
              @click="gameCardData = undefined"
              :src="gameCardData?.thumbnail.replaceAll('#', '%23')"
              :alt="gameCardData?.title"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog :open="!!gameMemoData" @update:open="updateViewGameMemo">
        <DialogContent
          class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh]"
        >
          <DialogHeader>
            <DialogTitle>{{ gameMemoData?.title }} 메모 작성하기</DialogTitle>
            <DialogDescription>
              메모를 작성하세요. 해당 창을 닫을 때 자동 저장됩니다.
            </DialogDescription>
          </DialogHeader>
          <div class="overflow-y-auto">
            <Textarea v-model="memoModel">하이</Textarea>
          </div>
        </DialogContent>
      </Dialog>

      <div
        v-if="
          gameExist &&
          searchFilteredList.games.length === 0 &&
          searchFilteredList.recent.length === 0
        "
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
