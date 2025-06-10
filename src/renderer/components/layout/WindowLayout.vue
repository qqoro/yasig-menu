<script setup lang="ts">
import logo from "@/assets/logo.png";
import { Icon } from "@iconify/vue";
import { IpcRendererEvent } from "electron";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { toast } from "vue-sonner";
import { Game } from "../../../main/db/db";
import { IpcMainSend, IpcRendererSend } from "../../../main/events";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Progress } from "../../components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { off, on, send, sendApi } from "../../composable/useApi";
import { useEvent } from "../../composable/useEvent";
import { Sort } from "../../constants";
import { cn, wait } from "../../lib/utils";
import { useGame } from "../../store/game-store";
import { useSearch } from "../../store/search-store";
import { useSetting } from "../../store/setting-store";
import { Toaster } from "../ui/sonner";

const route = useRoute();
const setting = useSetting();
const game = useGame();
const search = useSearch();
const isMaximized = ref(false);
const updateDownloadProgress = ref(0);
const updateDialogOpen = ref(false);

const selectRandomGame = async () => {
  const [, list] = await sendApi(
    IpcRendererSend.LoadList,
    IpcMainSend.LoadedList,
    { hideZipFile: game.hideZipFile, isHidden: false }
  );
  const data = list[Math.floor(list.length * Math.random())];
  search.searchWord = data.title;
};

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

const restart = () => {
  send(IpcRendererSend.Restart);
};

const { sort } = storeToRefs(useSearch());
const sortName: Record<Sort, string> = {
  [Sort.Title]: "제목 정렬",
  [Sort.TitleDesc]: "제목 역순 정렬",
  [Sort.RJCode]: "RJ코드 정렬",
  [Sort.RJCodeDesc]: "RJ코드 역순 정렬",
};

const allToggleApplySource = (e: Event) => {
  e?.preventDefault();
  if (setting.applySources.length === 0) {
    setting.saveApplySources([...setting.sources]);
  } else {
    setting.saveApplySources([]);
  }
};

const toggleApplySource = (e: Event, path: string, isExclude: boolean) => {
  e?.preventDefault();
  const list = [...setting.applySources];
  if (isExclude) {
    list.push(path);
  } else {
    list.splice(list.indexOf(path), 1);
  }
  setting.saveApplySources(list);
};

const applySources = storeToRefs(setting).applySources;
const hideZipFile = storeToRefs(game).hideZipFile;
watch([applySources, hideZipFile], () => {
  game.loadList();
});

const processQueue = ref<Game[]>([]);
const batchProcessing = ref(false);
const thumbnailBatchDownload = async () => {
  if (batchProcessing.value) {
    return;
  }

  batchProcessing.value = true;
  const thumbnailFolder = setting.changeThumbnailFolder[0]
    ? setting.changeThumbnailFolder[1]
    : undefined;
  const [, list] = await sendApi(
    IpcRendererSend.LoadList,
    IpcMainSend.LoadedList,
    { hideZipFile: game.hideZipFile, isHidden: false }
  );
  processQueue.value = list.filter((item) => item.thumbnail === undefined);

  try {
    let list: Game[] = [];
    const totalCount = processQueue.value.length;
    const process = new Promise<void>((resolve) => {
      const callback = (e: IpcRendererEvent, id: string, path: string) => {
        processQueue.value = processQueue.value.filter(
          (item) => item.path !== path
        );
        list = list.filter((item) => item.path !== path);
        if (processQueue.value.length === 0) {
          off(IpcMainSend.ThumbnailDone, callback);
          resolve();
        }
        toast.info(
          `다운로드 진행중... (${
            totalCount - processQueue.value.length
          }/${totalCount})`
        );
      };
      on(IpcMainSend.ThumbnailDone, callback);
    });
    toast.promise(process, {
      loading: `썸네일을 다운로드하고 있어요... (${totalCount}개)`,
    });

    // TODO: 코드 개선 필요...
    for (const item of processQueue.value) {
      while (list.length >= 3) {
        await wait(200);
      }
      thumbnailDownload(item.path);
      list.push(item);
    }

    await process;
    toast.success("썸네일 일괄 다운로드가 완료되었습니다!");
  } catch (error) {
    toast.error("알 수 없는 오류가 발생했습니다!", {
      description: [(error as Error).message, (error as Error).stack].join(
        "\n"
      ),
    });
  } finally {
    batchProcessing.value = false;
  }
};
const thumbnailBatchDelete = () => {
  if (batchProcessing.value) {
    return;
  }
};

useEvent(IpcMainSend.Message, (e, id, { type, message, ...args }) => {
  toast[type](message, { ...args });
});
useEvent(IpcMainSend.WindowStatusChange, (e, id, isMax) => {
  isMaximized.value = isMax;
});
useEvent(IpcMainSend.UpdateDownloadProgress, (e, id, percent) => {
  updateDownloadProgress.value = percent;
  if (percent === 100) {
    updateDialogOpen.value = true;
  }
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
        @click="send(IpcRendererSend.WindowMinimize)"
      >
        <Icon icon="material-symbols:chrome-minimize-rounded" />
      </button>
      <button
        class="hover:bg-slate-600 transition-colors px-4 hover:text-background"
        @click="send(IpcRendererSend.WindowMaximizeToggle)"
      >
        <Icon
          v-if="!isMaximized"
          icon="material-symbols:chrome-maximize-outline"
        />
        <Icon v-else icon="material-symbols:chrome-restore-outline-rounded" />
      </button>
      <button
        class="hover:bg-red-600 transition-colors px-4 hover:text-background"
        @click="send(IpcRendererSend.WindowClose)"
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
      <template
        v-if="updateDownloadProgress !== 0 && updateDownloadProgress !== 100"
      >
        <span class="text-xs">업데이트 다운로드중...</span>
        <Progress
          style="width: 100px"
          class="ml-1"
          v-model="updateDownloadProgress"
        />
      </template>
      <template v-if="route.path === '/'">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
                @click="selectRandomGame"
              >
                <Icon icon="solar:rocket-2-outline" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>랜덤</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
                @click="zoomIn"
              >
                <Icon icon="solar:magnifer-zoom-in-outline" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>확대</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
                @click="zoomOut"
              >
                <Icon icon="solar:magnifer-zoom-out-outline" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>축소</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <!-- 정렬 -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
            >
              <Icon icon="solar:round-sort-vertical-outline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-44" align="end">
            <DropdownMenuLabel>정렬</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup v-model="sort">
              <DropdownMenuRadioItem
                v-for="item in Sort"
                :value="item"
                :key="item"
              >
                {{ sortName[item] }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <!-- 소스 필터 -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
            >
              <Icon icon="solar:filter-outline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel>필터</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem
                v-for="(source, index) in setting.sources"
                :key="index + source"
                :model-value="setting.applySources.includes(source)"
                @select="
                  (e) =>
                    toggleApplySource(
                      e,
                      source,
                      !setting.applySources.includes(source)
                    )
                "
              >
                <span>{{
                  source.substring(
                    Math.max(
                      source.lastIndexOf("/"),
                      source.lastIndexOf("\\")
                    ) + 1
                  )
                }}</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem @select="allToggleApplySource">
                <Icon icon="solar:checklist-outline" />
                전부
                {{
                  setting.applySources.length === 0 ? "켜기" : "끄기"
                }}</DropdownMenuItem
              >
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem v-model="hideZipFile" @select.prevent>
                <span>압축파일 제외</span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
            >
              <Icon icon="solar:menu-dots-outline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-48" align="end">
            <DropdownMenuItem
              @select="thumbnailBatchDownload"
              :disabled="batchProcessing"
            >
              <Icon icon="solar:download-bold-duotone" />
              썸네일 일괄 다운로드
            </DropdownMenuItem>
            <!-- <DropdownMenuItem
              variant="destructive"
              @select="thumbnailBatchDelete"
            >
              <Icon icon="solar:trash-bin-2-bold-duotone" />
              썸네일 일괄 삭제
            </DropdownMenuItem> -->
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </div>
  </nav>
  <RouterView #default="{ Component }">
    <component :is="Component" class="py-2 px-4 pb-6" />
  </RouterView>
  <Toaster rich-colors close-button />
  <AlertDialog v-model:open="updateDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>업데이트 준비가 완료되었습니다.</AlertDialogTitle>
        <AlertDialogDescription>
          업데이트 준비가 완료되어 앱을 재시작 하면 업데이트됩니다. 지금 바로
          재시작하겠습니까?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>나중에</AlertDialogCancel>
        <AlertDialogAction @click="restart">재시작</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped>
.title-bar {
  -webkit-app-region: drag;
}
.button-group {
  -webkit-app-region: no-drag;
}
</style>
