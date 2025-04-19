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
    console.log("saved!", zoom.value);
  };
  const sources = ref<string[]>(Data.getJSON("sources") ?? []);
  const saveSources = (newSources: string[]) => {
    sources.value = newSources;
    Data.setJSON("sources", newSources);
    console.log("saved!", sources.value);
  };
  const applySources = ref<string[]>(
    Data.getJSON("applySources") ?? [...sources.value] ?? []
  );
  const saveApplySources = (newApplySources: string[]) => {
    applySources.value = newApplySources;
    Data.setJSON("applySources", newApplySources);
    console.log("saved!", applySources.value);
  };
  const blur = ref<boolean>(Data.getJSON("blur") ?? false);
  const saveBlur = (newBlur: boolean) => {
    blur.value = newBlur;
    Data.setJSON("blur", newBlur);
    console.log("saved!", blur.value);
  };
  const dark = ref<boolean>(Data.getJSON("dark") ?? false);
  const saveDark = (newDark: boolean) => {
    dark.value = newDark;
    Data.setJSON("dark", newDark);
    console.log("saved!", dark.value);
  };
  const cookie = ref<string>(Data.getJSON("cookie") ?? "");
  const saveCookie = (newCookie: string) => {
    cookie.value = newCookie;
    Data.setJSON("cookie", newCookie);
    console.log("saved!", cookie.value);
  };
  const exclude = ref<string[]>(Data.getJSON("exclude") ?? []);
  const saveExclude = (newExclude: string[]) => {
    exclude.value = newExclude;
    Data.setJSON("exclude", newExclude);
    console.log("saved!", exclude.value);
  };
  const addExclude = (item: string) => {
    saveExclude([...exclude.value, item]);
  };
  const search = ref<[string, string]>(Data.getJSON("search") ?? ["", ""]);
  const saveSearch = (newSearch: [string, string]) => {
    search.value = newSearch;
    Data.setJSON("search", newSearch);
    console.log("saved!", search.value);
  };

  return {
    zoom,
    saveZoom,
    sources,
    saveSources,
    applySources,
    saveApplySources,
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
