<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import Changelog from "../../../components/Changelog.vue";
import PageTitle from "../../../components/PageTitle.vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import { Button } from "../../../components/ui/button";
import { useApi } from "../../../composable/useApi";
import { useEvent } from "../../../composable/useEvent";
import { IpcMainSend, IpcRendererSend } from "../../../events";
import Data from "../../../lib/data";
import { useGame } from "../../../store/game-store";
import { useSearch } from "../../../store/search-store";
import { useSetting } from "../../../store/setting-store";
import { GameHistoryData, SettingData } from "../../../typings/local";
import AppInfoCard from "../components/AppInfoCard.vue";
import CookieCard from "../components/CookieCard.vue";
import ExcludeGameCard from "../components/ExcludeGameCard.vue";
import GamePathCard from "../components/GamePathCard.vue";
import HomeCard from "../components/HomeCard.vue";
import SearchKeywordCard from "../components/SearchKeywordCard.vue";
import ThumbnailCard from "../components/ThumbnailCard.vue";

import log from "electron-log";
const console = log;

const setting = useSetting();
const game = useGame();
const api = useApi();

const sources = ref([...setting.sources]);
const home = ref({ ...setting.home });
const changeThumbnailFolder = ref<[boolean, string]>([
  ...setting.changeThumbnailFolder,
]);
const blur = ref(setting.blur);
const dark = ref(setting.dark);
const cookie = ref(setting.cookie);
const exclude = ref(setting.exclude);
const search = ref(setting.search);
const appVersion = ref("");

const open = ref(false);

const save = () => {
  const set = new Set();
  for (const source of sources.value) {
    if (set.has(source)) {
      return toast.error("중복된 게임 경로가 있어요");
    }
    if (source.length === 0) {
      return toast.warning("게임 경로를 입력해주세요");
    }
    set.add(source);
  }

  const compareA: string[] = (Data.getJSON("sources") ?? []).sort();
  const compareB = sources.value.map((source) => source.trim()).sort();
  for (
    let index = 0;
    index < Math.max(compareA.length, compareB.length);
    index++
  ) {
    // 정렬 후 인덱스 검사하여 변경되었는지 체크
    if (compareA[index] === compareB[index]) {
      continue;
    }
    // 소스 폴더가 변경됨 > 적용폴더 초기화 / 제외폴더 정리
    setting.saveApplySources(compareB);
    exclude.value = exclude.value.filter((path) =>
      compareB.some((source) => path.startsWith(source))
    );
    break;
  }

  setting.saveSources(sources.value.map((source) => source.trim()));
  setting.saveHome(home.value);
  setting.saveChangeThumbnailFolder(changeThumbnailFolder.value);
  setting.saveBlur(blur.value);
  setting.saveDark(dark.value);
  setting.saveCookie(cookie.value);
  setting.saveExclude(exclude.value);
  setting.saveSearch(search.value);
  toast.success("설정을 저장했습니다.");
};
const updateCheck = () => {
  api.send(IpcRendererSend.UpdateCheck);
};

const openLogFolder = () => {
  api.send(IpcRendererSend.OpenLogFolder);
};

const openChangelog = () => {
  open.value = !open.value;
};

const exportSetting = async () => {
  const data = {
    zoom: setting.zoom,
    sources: setting.sources,
    applySources: setting.applySources,
    home: setting.home,
    changeThumbnailFolder: setting.changeThumbnailFolder,
    blur: setting.blur,
    dark: setting.dark,
    cookie: setting.cookie,
    exclude: setting.exclude,
    search: setting.search,
    clearGame: game.clearGame,
    recentGame: game.recentGame,
  } satisfies SettingData & GameHistoryData;
  await window.navigator.clipboard.writeText(JSON.stringify(data, null, 4));
  toast.success("설정이 클립보드에 복사되었습니다.");
};

const importSetting = async () => {
  try {
    const dataText = await window.navigator.clipboard.readText();
    const data = JSON.parse(dataText) as Partial<SettingData & GameHistoryData>;

    if (data.zoom !== undefined) {
      setting.saveZoom(data.zoom);
    }
    if (data.sources !== undefined) {
      sources.value = data.sources;
      setting.saveSources(data.sources);
    }
    if (data.applySources !== undefined) {
      setting.saveApplySources(data.applySources);
    }
    if (data.home !== undefined) {
      home.value = data.home;
      setting.saveHome(data.home);
    }
    if (data.changeThumbnailFolder !== undefined) {
      changeThumbnailFolder.value = data.changeThumbnailFolder;
      setting.saveChangeThumbnailFolder(data.changeThumbnailFolder);
    }
    if (data.blur !== undefined) {
      blur.value = data.blur;
      setting.saveBlur(data.blur);
    }
    if (data.dark !== undefined) {
      dark.value = data.dark;
      setting.saveDark(data.dark);
    }
    if (data.cookie !== undefined) {
      cookie.value = data.cookie;
      setting.saveCookie(data.cookie);
    }
    if (data.exclude !== undefined) {
      exclude.value = data.exclude;
      setting.saveExclude(data.exclude);
    }
    if (data.search !== undefined) {
      search.value = data.search;
      setting.saveSearch(data.search);
    }

    if (data.clearGame !== undefined) {
      game.saveClearGame(data.clearGame);
    }
    if (data.recentGame !== undefined) {
      game.saveRecentGame(data.recentGame);
    }

    console.log("설정 데이터", data);
    toast.success("설정이 클립보드에 복원되었습니다.");
  } catch (error) {
    if ((error as Error).message.endsWith("is not valid JSON")) {
      toast.error(
        "클립보드의 값이 JSON 데이터가 아닙니다. 설정을 불러오지 못했습니다.",
        {
          description: (error as Error).stack,
        }
      );
    } else {
      toast.error(
        "알 수 없는 오류가 발생했습니다. 설정을 불러오지 못했습니다.",
        {
          description: [(error as Error).message, (error as Error).stack].join(
            "\n"
          ),
        }
      );
    }
  }
};

const resetSetting = () => {
  localStorage.clear();
  setting.reset();
  game.reset();
  useSearch().reset();

  sources.value = setting.sources;
  home.value = setting.home;
  changeThumbnailFolder.value = setting.changeThumbnailFolder;
  blur.value = setting.blur;
  dark.value = setting.dark;
  cookie.value = setting.cookie;
  exclude.value = setting.exclude;
  search.value = setting.search;
  if (appVersion.value) {
    Data.set("version", appVersion.value);
  }
};

onMounted(() => {
  api.send(IpcRendererSend.VersionCheck);
});
useEvent(IpcMainSend.VersionChecked, (e, version: string) => {
  appVersion.value = version;
});

watch(blur, () => {
  console.log("change blur!", blur.value);
});
</script>

<template>
  <main class="flex flex-col gap-4">
    <PageTitle class="flex justify-between items-center">
      <div>설정</div>
    </PageTitle>

    <GamePathCard v-model="sources" />
    <HomeCard v-model:all="home.showAll" v-model:recent="home.showRecent" />
    <ThumbnailCard
      v-model="changeThumbnailFolder"
      v-model:blur="blur"
      v-model:dark="dark"
    />
    <CookieCard v-model="cookie" />
    <SearchKeywordCard v-model="search" />
    <ExcludeGameCard v-model="exclude" />
    <AppInfoCard
      :appVersion="appVersion"
      @updateCheck="updateCheck"
      @openLogFolder="openLogFolder"
      @openChangelog="openChangelog"
      @toggleDevTools="api.send(IpcRendererSend.ToggleDevTools)"
    />

    <div class="flex justify-center items-center gap-4">
      <Button variant="outline" @click="exportSetting">
        <Icon icon="solar:export-bold-duotone" />
        JSON으로 내보내기
      </Button>
      <Button variant="outline" @click="importSetting">
        <Icon icon="solar:import-bold-duotone" />
        JSON으로 불러오기
      </Button>
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="outline">
            <Icon icon="solar:export-bold-duotone" />
            앱 데이터 초기화
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              >정말로 앱을 초기화 하시겠습니까?</AlertDialogTitle
            >
            <AlertDialogDescription>
              <p>
                설정된 설정, 게임 메모, 클리어 기록 등 앱 내부에 저장된 데이터를
                전부 초기화합니다. 저장된 게임이나 썸네일은 삭제되지 않습니다.
              </p>
              <p>
                정말로 앱을 초기화 하시겠습니까?
                <span class="font-bold">이 작업은 되돌릴 수 없습니다.</span>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              class="text-red-800 bg-red-200 hover:bg-red-300"
              @click="resetSetting"
            >
              초기화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <Button class="sticky bottom-2 right-0 save-button-shadow" @click="save">
      <Icon icon="solar:diskette-bold-duotone" />
      저장
    </Button>

    <Changelog v-model:open="open" />
  </main>
</template>

<style scoped>
.save-button-shadow {
  box-shadow: 0px 15px 40px 5px rgba(56, 56, 56, 0.6);
}
</style>
