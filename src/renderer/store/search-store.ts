import log from "electron-log";
import { defineStore } from "pinia";
import { ref } from "vue";
import { Sort } from "../constants";
const console = log;

export const useSearch = defineStore("search", () => {
  const searchWord = ref("");
  const sort = ref(Sort.Title);

  const reset = () => {
    searchWord.value = "";
    sort.value = Sort.Title;
  };

  return {
    searchWord,
    sort,

    reset,
  };
});
