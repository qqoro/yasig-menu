import log from "electron-log";
import { defineStore, storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Game } from "../../main/db/db";
import { IpcMainSend } from "../../main/events";
import { useEvent } from "../composable/useEvent";
import { Sort } from "../constants";
import { getGameList } from "../db/game";
import { getSetting } from "../db/setting";
import { searchFuzzy, sortRJCode } from "../lib/search";
import { useSearch } from "./search-store";
const console = log;

export const useGame = defineStore("game", () => {
  const loading = ref(true);
  const list = ref<Game[]>([]);
  const showCount = ref(20);

  const showAll = ref(false);
  const showRecent = ref(false);

  const moreLoad = (count: number) => {
    showCount.value += count;
  };

  const { searchWord, sort } = storeToRefs(useSearch());
  const sortedList = computed(() => {
    switch (sort.value) {
      case Sort.Title:
        return [...list.value].sort((a, b) => a.title.localeCompare(b.title));
      case Sort.TitleDesc:
        return [...list.value].sort((a, b) => b.title.localeCompare(a.title));
      case Sort.RJCode:
        return [...list.value].sort((a, b) => sortRJCode(a.title, b.title));
      case Sort.RJCodeDesc:
        return [...list.value].sort((a, b) =>
          sortRJCode(b.title, a.title, true)
        );
    }
  });

  const searchRegex = computed(() => {
    if (!searchWord.value) {
      return null;
    }

    return searchFuzzy(searchWord.value);
  });

  const searchFilteredList = computed(() => {
    const recent: Game[] = [];
    const games: Game[] = [];
    const regex = searchRegex.value; // 메모이제이션된 정규식 사용

    for (const item of sortedList.value) {
      // 숨김게임 패스
      if (item.isHidden) {
        continue;
      }
      // 검색 정규식 있는 경우 체크 후 건너뛰기
      if (regex && !regex.test(item.title.replaceAll(" ", ""))) {
        continue;
      }

      const gameData = {
        ...item,
      };

      // 최근 목록 사용 + 검색어 없을때만 표시
      if (showRecent.value && gameData.isRecent && !regex) {
        // 개수 제한이 있거나, 아직 recent 목록이 showCount 미만일 때만 추가
        if (showAll.value || recent.length < showCount.value) {
          recent.push(gameData);
        }
      } else {
        // 개수 제한이 있거나, 아직 games 목록이 showCount 미만일 때만 추가
        if (showAll.value || games.length < showCount.value) {
          games.push(gameData);
        }
      }
    }

    return { recent, games };
  });

  const loadList = async () => {
    const data = await getGameList({ isHidden: false });
    // console.info("게임 목록 로드", data);
    loading.value = false;
    // 데이터 동일한 경우 캐싱된 computed값 재사용 위해 변경하지 않음
    if (JSON.stringify(list.value) === JSON.stringify(data)) {
      return;
    }

    list.value = data;
  };

  useEvent(IpcMainSend.ThumbnailDone, () => {
    loadList();
  });

  // 경로 변경 시 최대 조회개수 초기화
  const route = useRoute();
  watch(route, async () => {
    showCount.value = 20;
    const setting = await getSetting();
    showAll.value = setting.showAll;
    showRecent.value = setting.showRecent;
  });

  loadList();

  return {
    loading,
    showCount,
    moreLoad,
    list,
    searchFilteredList,
    loadList,
  };
});
