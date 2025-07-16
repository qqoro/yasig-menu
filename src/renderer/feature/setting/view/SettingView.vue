<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { IpcMainSend, IpcRendererSend } from "../../../../main/events";
import Changelog from "../../../components/Changelog.vue";
import PageTitle from "../../../components/PageTitle.vue";
import { Button } from "../../../components/ui/button";
import { send, sendApi } from "../../../composable/useApi";
import { useEvent } from "../../../composable/useEvent";
import { getGameList } from "../../../db/game";
import { getSetting, updateSetting } from "../../../db/setting";
import AppInfoCard from "../components/AppInfoCard.vue";
import CookieCard from "../components/CookieCard.vue";
import ExcludeGameCard from "../components/ExcludeGameCard.vue";
import GamePathCard from "../components/GamePathCard.vue";
import HomeCard from "../components/HomeCard.vue";
import PlayExcludeCard from "../components/PlayExcludeCard.vue";
import SearchKeywordCard from "../components/SearchKeywordCard.vue";
import ThumbnailCard from "../components/ThumbnailCard.vue";

import log from "electron-log";
const console = log;

const games = await getGameList({ isHidden: true });
const setting = await getSetting();

const sources = ref([...setting.sources]);
const showAll = ref(setting.showAll);
const showRecent = ref(setting.showRecent);
const changeThumbnailFolder = ref<[boolean, string]>([
  !!setting.changeThumbnailFolder,
  setting.newThumbnailFolder,
]);
const blur = ref(setting.blur);
const dark = ref(setting.dark);
const cookie = ref(setting.cookie);
const exclude = ref(games.map((game) => game.path));
const search = ref(setting.search);
const playExclude = ref(setting.playExclude);
const deleteThumbnailFile = ref(setting.deleteThumbnailFile);
const showCollectorTitle = ref(setting.showCollectorTitle);

const appVersion = ref("");
const reloadGameInfoLoading = ref(false);

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

  const gamePaths = games.map((gameData) => gameData.path);
  const removedGames = gamePaths.filter(
    (game) => !exclude.value.includes(game),
  );

  removedGames.forEach((path) => {
    send(IpcRendererSend.Hide, { path, isHidden: false });
  });
  updateSetting({
    sources: JSON.stringify(sources.value.map((source) => source.trim())),
    applySources: JSON.stringify(sources.value.map((source) => source.trim())),
    blur: blur.value,
    changeThumbnailFolder: changeThumbnailFolder.value[0],
    newThumbnailFolder: JSON.stringify(changeThumbnailFolder.value[1]),
    dark: dark.value,
    cookie: JSON.stringify(cookie.value),
    playExclude: JSON.stringify(playExclude.value.map((v) => v.trim())),
    search: JSON.stringify(search.value),
    showAll: showAll.value,
    showRecent: showRecent.value,
    deleteThumbnailFile: deleteThumbnailFile.value,
    showCollectorTitle: showCollectorTitle.value,
  });
  toast.success("설정을 저장했습니다.");
};

const updateCheck = () => {
  send(IpcRendererSend.UpdateCheck);
};

const openLogFolder = () => {
  send(IpcRendererSend.OpenLogFolder);
};

const openChangelog = () => {
  open.value = !open.value;
};

const reloadAllGameInfo = async () => {
  reloadGameInfoLoading.value = true;
  await sendApi(IpcRendererSend.ReloadAllGameInfo, IpcMainSend.Message);
  reloadGameInfoLoading.value = false;
};

// const resetSetting = () => {
//   localStorage.clear();
//   setting.reset();
//   useSearch().reset();

//   sources.value = setting.sources;
//   home.value = setting.home;
//   changeThumbnailFolder.value = setting.changeThumbnailFolder;
//   blur.value = setting.blur;
//   dark.value = setting.dark;
//   cookie.value = setting.cookie;
//   exclude.value = setting.exclude;
//   search.value = setting.search;
//   playExclude.value = setting.playExclude;
//   if (appVersion.value) {
//     Data.set("version", appVersion.value);
//   }
// };

onMounted(async () => {
  send(IpcRendererSend.VersionCheck);
});
useEvent(IpcMainSend.VersionChecked, (e, id, version) => {
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

    <template v-if="false">
      <div class="w-full h-full flex justify-center items-center">
        <Icon icon="svg-spinners:ring-resize" class="m-8 size-20" />
      </div>
    </template>
    <template v-else>
      <GamePathCard v-model="sources" />
      <HomeCard
        v-model:all="showAll"
        v-model:recent="showRecent"
        v-model:collector-title="showCollectorTitle"
      />
      <ThumbnailCard
        v-model="changeThumbnailFolder"
        v-model:blur="blur"
        v-model:dark="dark"
        v-model:deleteThumbnailFile="deleteThumbnailFile"
      />
      <CookieCard v-model="cookie" />
      <SearchKeywordCard v-model="search" />
      <ExcludeGameCard v-model="exclude" />
      <PlayExcludeCard v-model="playExclude" />
      <AppInfoCard
        :appVersion="appVersion"
        :reloadGameInfoLoading="reloadGameInfoLoading"
        @updateCheck="updateCheck"
        @openLogFolder="openLogFolder"
        @openChangelog="openChangelog"
        @toggleDevTools="send(IpcRendererSend.ToggleDevTools)"
        @reloadAllGameInfo="reloadAllGameInfo"
      />
    </template>

    <!-- <div class="flex justify-center items-center gap-4">
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
            <Icon icon="solar:siren-bold-duotone" />
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
    </div> -->
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
