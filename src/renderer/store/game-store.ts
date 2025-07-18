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

export const useGame = defineStore("game", () => {
  const loading = ref(true);
  const list = ref<Game[]>([]);
  const showCount = ref(20);

  const showAll = ref(false);
  const showRecent = ref(false);

  const moreLoad = (count: number) => {
    showCount.value += count;
  };

  const { searchWord, makerName, tagIds, sort } = storeToRefs(useSearch());
  const sortedList = computed(() => {
    return [...list.value].sort((a, b) => {
      // 1. 즐겨찾기 여부 먼저 비교 (즐겨찾기(true)가 앞에 오도록)
      if (!!a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && !!b.isFavorite) return 1;

      if (!!a.isClear && !b.isClear) return 1;
      if (!a.isClear && !!b.isClear) return -1;

      // 2. 즐겨찾기 여부가 같으면 sort.value에 따른 정렬
      switch (sort.value) {
        case Sort.Title:
          return a.title.localeCompare(b.title);
        case Sort.TitleDesc:
          return b.title.localeCompare(a.title);
        case Sort.RJCode:
          return sortRJCode(a.title, b.title);
        case Sort.RJCodeDesc:
          return sortRJCode(b.title, a.title, true);
        default:
          return 0;
      }
    });
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

    const hasTags = tagIds.value.size > 0;
    const selectedTags = [...tagIds.value.values()];

    for (const item of sortedList.value) {
      // 숨김게임 패스
      if (item.isHidden) {
        continue;
      }
      // 검색 정규식 있는 경우 체크 후 건너뛰기
      if (regex && !regex.test(item.title.replaceAll(" ", ""))) {
        continue;
      }
      // 검색 제작자 있는 경우 체크
      if (makerName.value && item.makerName !== makerName.value) {
        continue;
      }
      // 검색 태그 있는 경우 체크
      const itemTags = item.tagIds?.split(",") ?? [];
      if (
        // 게임에 태그 없거나
        (hasTags && !item.tagIds) ||
        // 태그는 있지만 지정 태그가 모두 있지는 않은 경우
        (hasTags && !selectedTags.every((tagId) => itemTags.includes(tagId)))
      ) {
        continue;
      }

      // 최근 목록 사용 + 검색어 없을때만 표시
      if (showRecent.value && item.isRecent && !regex) {
        // 개수 제한이 있거나, 아직 recent 목록이 showCount 미만일 때만 추가
        if (showAll.value || recent.length < showCount.value) {
          recent.push(item);
        }
      } else {
        // 개수 제한이 있거나, 아직 games 목록이 showCount 미만일 때만 추가
        if (showAll.value || games.length < showCount.value) {
          games.push(item);
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
