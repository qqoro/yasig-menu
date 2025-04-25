import log from "electron-log";
import { defineStore } from "pinia";
import { ref } from "vue";
const console = log;

export const useSearch = defineStore("search", () => {
  const searchWord = ref("");

  return {
    searchWord,
  };
});
