import log from "electron-log";
import { defineStore } from "pinia";
import { ref } from "vue";
import { IpcMainSend, IpcRendererSend } from "../../main/events";
import { send, sendApi } from "../composable/useApi";
import Data from "../lib/data";
const console = log;

export const useSetting = defineStore("setting", () => {
  const loading = ref(true);
  const zoom = ref<number>(Data.getJSON("zoom") ?? 50);
  const saveZoom = (newZoom: number) => {
    zoom.value = newZoom;
    Data.setJSON("zoom", newZoom);
    console.log("zoom saved!", zoom.value);
  };
  const sources = ref<string[]>([]);
  const saveSources = (newSources: string[]) => {
    sources.value = newSources;
    send(IpcRendererSend.UpdateSetting, {
      sources: JSON.stringify(newSources),
      applySources: JSON.stringify(newSources),
    });
    console.log("sources saved!", sources.value);
  };
  const applySources = ref<string[]>([...sources.value]);
  const saveApplySources = (newApplySources: string[]) => {
    applySources.value = newApplySources;
    send(IpcRendererSend.UpdateSetting, {
      applySources: JSON.stringify(newApplySources),
    });
    console.log("applySources saved!", applySources.value);
  };
  const home = ref<{ showAll: boolean; showRecent: boolean }>(
    Data.getJSON("home") ?? { showAll: false, showRecent: true }
  );
  const saveHome = (newHome: { showAll: boolean; showRecent: boolean }) => {
    home.value = newHome;
    Data.setJSON("home", newHome);
    console.log("home saved!", home.value);
  };
  const changeThumbnailFolder = ref<[boolean, string]>([false, ""]);
  const saveChangeThumbnailFolder = (
    newChangeThumbnailFolder: [boolean, string]
  ) => {
    changeThumbnailFolder.value = newChangeThumbnailFolder;
    Data.setJSON("changeThumbnailFolder", newChangeThumbnailFolder);
    send(IpcRendererSend.UpdateSetting, {
      changeThumbnailFolder: !!newChangeThumbnailFolder[0],
      newThumbnailFolder: JSON.stringify(newChangeThumbnailFolder[1]),
    });
    console.log("changeThumbnailFolder saved!", changeThumbnailFolder.value);
  };
  const blur = ref<boolean>(Data.getJSON("blur") ?? false);
  const saveBlur = (newBlur: boolean) => {
    blur.value = newBlur;
    Data.setJSON("blur", newBlur);
    console.log("blur saved!", blur.value);
  };
  const dark = ref<boolean>(Data.getJSON("dark") ?? false);
  const saveDark = (newDark: boolean) => {
    dark.value = newDark;
    Data.setJSON("dark", newDark);
    console.log("dark saved!", dark.value);
  };
  const cookie = ref<string>("");
  const saveCookie = (newCookie: string) => {
    cookie.value = newCookie;
    Data.setJSON("cookie", newCookie);
    send(IpcRendererSend.UpdateSetting, {
      cookie: JSON.stringify(newCookie),
    });
    console.log("cookie saved!", cookie.value);
  };
  const exclude = ref<string[]>([]);
  const saveExclude = (newExclude: string[]) => {
    const removed = exclude.value.filter((v) => !newExclude.includes(v));
    exclude.value = newExclude;
    removed.forEach((path) => {
      send(IpcRendererSend.Hide, { path, isHidden: false });
    });
    console.log("exclude saved!", exclude.value);
  };
  const addExclude = (item: string) => {
    saveExclude([...exclude.value, item]);
  };
  const search = ref<[string, string]>(["", ""]);
  const saveSearch = (newSearch: [string, string]) => {
    search.value = newSearch;
    Data.setJSON("search", newSearch);
    send(IpcRendererSend.UpdateSetting, {
      search: JSON.stringify(newSearch),
    });
    console.log("search saved!", search.value);
  };
  const playExclude = ref<string[]>([
    "notification_helper",
    "UnityCrashHandler64",
  ]);
  const savePlayExclude = (newPlayExclude: string[]) => {
    playExclude.value = newPlayExclude;
    send(IpcRendererSend.UpdateSetting, {
      playExclude: JSON.stringify(newPlayExclude),
    });
    console.log("playExclude saved!", playExclude.value);
  };

  const init = async () => {
    loading.value = true;
    const [, settingData] = await sendApi(
      IpcRendererSend.LoadSetting,
      IpcMainSend.LoadedSetting
    );
    sources.value = settingData.sources;
    applySources.value = settingData.applySources;
    changeThumbnailFolder.value = [
      !!settingData.changeThumbnailFolder,
      settingData.newThumbnailFolder,
    ];
    cookie.value = settingData.cookie;
    const [, game] = await sendApi(
      IpcRendererSend.LoadList,
      IpcMainSend.LoadedList,
      { isHidden: true }
    );
    exclude.value = game.map((game) => game.path);
    search.value = settingData.search;
    playExclude.value = settingData.playExclude;

    loading.value = false;
  };

  const reset = () => {
    zoom.value = Data.getJSON("zoom") ?? 50;
    sources.value = [];
    applySources.value = Data.getJSON("applySources") ?? [...sources.value];
    home.value = Data.getJSON("home") ?? { showAll: false, showRecent: true };
    changeThumbnailFolder.value = Data.getJSON("changeThumbnailFolder") ?? [
      false,
      "",
    ];
    blur.value = Data.getJSON("blur") ?? false;
    dark.value = Data.getJSON("dark") ?? false;
    cookie.value = "";
    exclude.value = [];
    search.value = ["", ""];
    playExclude.value = ["notification_helper", "UnityCrashHandler64"];
    init();
  };

  return {
    loading,

    zoom,
    saveZoom,
    sources,
    saveSources,
    applySources,
    saveApplySources,
    home,
    saveHome,
    changeThumbnailFolder,
    saveChangeThumbnailFolder,
    blur,
    saveBlur,
    dark,
    saveDark,
    cookie,
    saveCookie,
    exclude,
    saveExclude,
    addExclude,
    search,
    saveSearch,
    playExclude,
    savePlayExclude,

    init,
    reset,
  };
});
