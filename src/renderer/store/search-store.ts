import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { Sort } from "../constants";

export const useSearch = defineStore("search", () => {
  const searchWord = ref("");
  const makerName = ref("");
  const tagIds = reactive(new Set<string>());
  const sort = ref(Sort.Title);

  const reset = () => {
    searchWord.value = "";
    makerName.value = "";
    tagIds.clear();
    sort.value = Sort.Title;
  };

  return {
    searchWord,
    makerName,
    tagIds,
    sort,

    reset,
  };
});
