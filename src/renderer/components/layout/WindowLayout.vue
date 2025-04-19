<script setup lang="ts">
import logo from "@/assets/logo.png";
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { toast } from "vue-sonner";
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
const updateDownloadProgress = ref(0);
const updateDialogOpen = ref(false);

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
  api.send(IpcRendererSend.Restart);
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
watch(applySources, () => {
  const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.LoadList, {
    sources: [...setting.applySources],
    exclude: [...setting.exclude],
    thumbnailFolder: isChange ? thumbnailFolder : undefined,
  });
});

useEvent(IpcMainSend.Message, (_, { type, message, description }) => {
  toast[type](message, { description });
});
useEvent(IpcMainSend.WindowStatusChange, (e, isMax) => {
  isMaximized.value = isMax;
});
useEvent(IpcMainSend.UpdateDownloadProgress, (e, percent) => {
  updateDownloadProgress.value = percent;
  if (percent === 1) {
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
      <Progress
        v-if="updateDownloadProgress !== 0 && updateDownloadProgress !== 1"
        style="width: 100px"
        :model-value="updateDownloadProgress * 100"
      />
      <template v-if="route.path === '/'">
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

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="transition-colors hover:bg-slate-300 size-7 rounded-sm flex justify-center items-center"
            >
              <Icon icon="solar:filter-outline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel>소스 필터 적용</DropdownMenuLabel>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </div>
  </nav>
  <RouterView #default="{ Component }">
    <component :is="Component" class="py-2 px-4 pb-6" />
  </RouterView>
  <Toaster rich-colors close-button />
  <AlertDialog>
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
