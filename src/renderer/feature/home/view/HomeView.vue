<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
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
import { useWindowEvent } from "../../../composable/useWindowEvent";
import Data from "../../../lib/data";
import { cn } from "../../../lib/utils";
import { useGame } from "../../../store/game-store";
import { useSearch } from "../../../store/search-store";
import { useSetting } from "../../../store/setting-store";
import GameCard from "../components/GameCard.vue";

const setting = useSetting();
const game = useGame();
const memoData = ref<Record<string, string>>(Data.getJSON("memo") ?? {});

const searchOpen = ref(false);
const { searchWord } = storeToRefs(useSearch());

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

useWindowEvent("keydown", (e) => {
  if (e.key.toLowerCase() === "f" && e.ctrlKey) {
    searchOpen.value = !searchOpen.value;
  }
  if (searchOpen.value && e.key === "Enter") {
    searchOpen.value = false;
  }
});

useWindowEvent("focus", () => {
  game.loadList();
});

const gameExist = computed(
  () => !(setting.sources.length === 0 || game.list.length === 0)
);
</script>

<template>
  <main class="flex flex-col gap-4">
    <PageTitle class="flex justify-between items-center">
      <p>
        게임 목록
        <span class="text-sm text-muted-foreground"
          >총 {{ game.list.length }}개</span
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
        <span v-else-if="game.loading">
          <Icon icon="svg-spinners:ring-resize" class="m-8 size-20" />
        </span>
        <span v-else-if="game.list.length === 0">
          지정한 경로에서 게임을 찾지 못했습니다.
        </span>
      </div>

      <template v-else>
        <div
          v-if="
            setting.home.showRecent && game.searchFilteredList.recent.length > 0
          "
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
                {
                  path,
                  title,
                  thumbnail,
                  category,
                  createdAt,
                  isClear,
                  isCompressFile,
                  isHidden,
                  isRecent,
                  memo,
                  makerName,
                  publishDate,
                  rjCode,
                  tags,
                  updatedAt,
                },
                index
              ) in game.searchFilteredList.recent"
              class="shrink-0"
              :key="path + index"
              :path="path"
              :title="title"
              :thumbnail="thumbnail"
              :category="category"
              :isClear="isClear"
              :isCompressFile="isCompressFile"
              :isHidden="isHidden"
              :isRecent="isRecent"
              :created-at="createdAt"
              :memo="memo"
              :makerName="makerName"
              :publishDate="publishDate"
              :rjCode="rjCode"
              :tags="tags"
              :updatedAt="updatedAt"
              @view-thumbnail="viewGameCard"
              @write-memo="viewGameMemo"
            />
          </div>
        </div>
        <GameCard
          v-for="(
            {
              path,
              title,
              thumbnail,
              category,
              createdAt,
              isClear,
              isCompressFile,
              isHidden,
              isRecent,
              memo,
              makerName,
              publishDate,
              rjCode,
              tags,
              updatedAt,
            },
            index
          ) in game.searchFilteredList.games"
          :key="path + index"
          :path="path"
          :title="title"
          :thumbnail="thumbnail"
          :category="category"
          :isClear="isClear"
          :isCompressFile="isCompressFile"
          :isHidden="isHidden"
          :isRecent="isRecent"
          :created-at="createdAt"
          :memo="memo"
          :makerName="makerName"
          :publishDate="publishDate"
          :rjCode="rjCode"
          :tags="tags"
          :updatedAt="updatedAt"
          @view-thumbnail="viewGameCard"
          @write-memo="viewGameMemo"
        />

        <div
          v-if="
            game.searchFilteredList.recent.length +
              game.searchFilteredList.games.length >=
            game.showCount
          "
          class="w-full flex justify-center items-center gap-4"
          :style="{ zoom: 1 / (setting.zoom * 0.02) }"
        >
          <Button variant="outline" @click="game.moreLoad(20)"
            >더 불러오기 (20개)</Button
          >
          <Button variant="outline" @click="game.moreLoad(game.list.length)"
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
          game.searchFilteredList.games.length === 0 &&
          game.searchFilteredList.recent.length === 0
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
