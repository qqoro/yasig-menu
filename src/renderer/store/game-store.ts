import log from "electron-log";
import { defineStore, storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { IpcMainSend, IpcRendererSend } from "../../main/events";
import { useApi } from "../composable/useApi";
import { useEvent } from "../composable/useEvent";
import { Sort } from "../constants";
import { searchFuzzy, sortRJCode } from "../lib/search";
import { GameData } from "../typings/local";
import { useGameHistory } from "./game-history-store";
import { useSearch } from "./search-store";
import { useSetting } from "./setting-store";
const console = log;

export const useGame = defineStore("game", () => {
  const loading = ref(true);
  const hideZipFile = ref(false);
  const list = ref<{ path: string; title: string; thumbnail?: string }[]>([]);
  const showCount = ref(20);
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
    const setting = useSetting();
    const game = useGameHistory();

    const recent: GameData[] = [];
    const games: GameData[] = [];
    const regex = searchRegex.value; // 메모이제이션된 정규식 사용

    for (const item of sortedList.value) {
      // 검색 정규식 있는 경우 체크 후 건너뛰기
      if (regex && !regex.test(item.title.replaceAll(" ", ""))) {
        continue;
      }

      const isRecent =
        game.recentGame.includes(item.path) && setting.home.showRecent;
      const gameData = {
        ...item,
        cleared: game.clearGame.includes(item.path),
      };

      // 최근 목록 사용 + 검색어 없을때만 표시
      if (isRecent && !regex) {
        // 개수 제한이 있거나, 아직 recent 목록이 showCount 미만일 때만 추가
        if (setting.home.showAll || recent.length < showCount.value) {
          recent.push(gameData);
        }
      } else {
        // 개수 제한이 있거나, 아직 games 목록이 showCount 미만일 때만 추가
        if (setting.home.showAll || games.length < showCount.value) {
          games.push(gameData);
        }
      }
    }

    return { recent, games };
  });

  const api = useApi();
  const loadList = () => {
    const setting = useSetting();
    const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
    api.send(IpcRendererSend.LoadList, {
      sources: [...setting.applySources],
      exclude: [...setting.exclude],
      thumbnailFolder: isChange ? thumbnailFolder : undefined,
      hideZipFile: hideZipFile.value,
    });
  };

  useEvent(
    IpcMainSend.LoadedList,
    (e, data: { path: string; title: string; thumbnail?: string }[]) => {
      // 데이터 동일한 경우 캐싱된 computed값 재사용 위해 변경하지 않음
      if (JSON.stringify(list.value) === JSON.stringify(data)) {
        return;
      }

      list.value = data;
      loading.value = false;
    }
  );
  useEvent(IpcMainSend.ThumbnailDone, () => {
    loadList();
  });

  // 경로 변경 시 최대 조회개수 초기화
  const route = useRoute();
  watch(route, () => {
    showCount.value = 20;
  });

  loadList();

  return {
    loading,
    hideZipFile,
    showCount,
    moreLoad,
    list,
    searchFilteredList,
    loadList,
  };
});
