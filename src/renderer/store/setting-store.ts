import log from "electron-log";
import { defineStore } from "pinia";
import { ref } from "vue";
import Data from "../lib/data";
const console = log;

export const useSetting = defineStore("setting", () => {
  const zoom = ref<number>(Data.getJSON("zoom") ?? 50);
  const saveZoom = (newZoom: number) => {
    zoom.value = newZoom;
    Data.setJSON("zoom", newZoom);
    console.log("zoom saved!", zoom.value);
  };
  const sources = ref<string[]>(Data.getJSON("sources") ?? []);
  const saveSources = (newSources: string[]) => {
    sources.value = newSources;
    Data.setJSON("sources", newSources);
    console.log("sources saved!", sources.value);
  };
  const applySources = ref<string[]>(
    Data.getJSON("applySources") ?? [...sources.value] ?? []
  );
  const saveApplySources = (newApplySources: string[]) => {
    applySources.value = newApplySources;
    Data.setJSON("applySources", newApplySources);
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
  const changeThumbnailFolder = ref<[boolean, string]>(
    Data.getJSON("changeThumbnailFolder") ?? [false, ""]
  );
  const saveChangeThumbnailFolder = (
    newChangeThumbnailFolder: [boolean, string]
  ) => {
    changeThumbnailFolder.value = newChangeThumbnailFolder;
    Data.setJSON("changeThumbnailFolder", newChangeThumbnailFolder);
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
  const cookie = ref<string>(Data.getJSON("cookie") ?? "");
  const saveCookie = (newCookie: string) => {
    cookie.value = newCookie;
    Data.setJSON("cookie", newCookie);
    console.log("cookie saved!", cookie.value);
  };
  const exclude = ref<string[]>(Data.getJSON("exclude") ?? []);
  const saveExclude = (newExclude: string[]) => {
    exclude.value = newExclude;
    Data.setJSON("exclude", newExclude);
    console.log("exclude saved!", exclude.value);
  };
  const addExclude = (item: string) => {
    saveExclude([...exclude.value, item]);
  };
  const search = ref<[string, string]>(Data.getJSON("search") ?? ["", ""]);
  const saveSearch = (newSearch: [string, string]) => {
    search.value = newSearch;
    Data.setJSON("search", newSearch);
    console.log("search saved!", search.value);
  };

  return {
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
  };
});
