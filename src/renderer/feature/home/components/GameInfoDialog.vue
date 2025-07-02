<template>
  <Dialog :open="modelValue" @update:open="(v) => emit('update:modelValue', v)">
    <DialogContent class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh]">
      <DialogHeader>
        <DialogTitle>게임 정보 수정</DialogTitle>
        <DialogDescription>게임 정보를 수정합니다.</DialogDescription>
      </DialogHeader>

      <div class="flex w-full flex-col col gap-2 overflow-y-auto p-1">
        <div class="w-full flex flex-col gap-1">
          <div class="w-full">게임 이름</div>
          <Input type="text" class="w-full" v-model="title" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">발매일</div>
          <DatePicker v-model="publishDate" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">제작자</div>
          <Input type="text" class="w-full" v-model="makerName" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">카테고리</div>
          <Input type="text" class="w-full" v-model="category" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">태그</div>
          <Input type="text" class="w-full" v-model="tags" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">메모</div>
          <Textarea type="text" class="w-full" v-model="memo" />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="secondary"
          @click="handleRefresh"
          :disabled="loading || refreshing"
        >
          {{ refreshing ? "다시 가져오기 중..." : "게임 정보 다시 가져오기" }}
        </Button>
        <Button @click="handleSave" :disabled="loading || refreshing">
          {{ loading ? "저장 중..." : "저장" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { DateValue, parseDate } from "@internationalized/date";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { Game } from "../../../../main/db/db";
import { IpcMainSend, IpcRendererSend } from "../../../../main/events";
import { Button } from "../../../components/ui/button";
import DatePicker from "../../../components/ui/date-picker/date-picker.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { sendApi } from "../../../composable/useApi";
import { updateGame } from "../../../db/game";
import { useGame } from "../../../store/game-store";

const props = defineProps<
  {
    modelValue: boolean;
    path: string;
  } & Pick<
    Game,
    "title" | "publishDate" | "makerName" | "category" | "tags" | "memo"
  >
>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const gameStore = useGame();
const loading = ref(false);
const refreshing = ref(false);

const title = ref(props.title);
const publishDate = ref<DateValue>();
const makerName = ref(props.makerName ?? "");
const category = ref(props.category ?? "");
const tags = ref(props.tags ?? "");
const memo = ref(props.memo ?? "");

const handlePublishDate = (newPublishDate: any) => {
  if (newPublishDate) {
    try {
      const date = new Date(newPublishDate as any);
      if (!isNaN(date.getTime())) {
        publishDate.value = parseDate(date.toISOString().split("T")[0]);
      } else {
        publishDate.value = undefined;
      }
    } catch (error) {
      console.warn("발매일 파싱 오류:", error);
      publishDate.value = undefined;
    }
  } else {
    publishDate.value = undefined;
  }
};

const handleRefresh = async () => {
  try {
    refreshing.value = true;
    const [, game] = await sendApi(
      IpcRendererSend.GameInfoReload,
      IpcMainSend.GameInfoReloaded,
      {
        path: props.path,
      },
    );
    if (game) {
      title.value = game.title;
      handlePublishDate(game.publishDate);
      makerName.value = game.makerName ?? "";
      category.value = game.category ?? "";
      tags.value = game.tags ?? "";
      memo.value = game.memo ?? "";
    } else {
      throw new Error("RJ코드가 없어 다시 정보를 불러오지 못했습니다.");
    }

    await gameStore.loadList();
    toast.success("게임 정보를 다시 가져왔습니다.");
  } catch (err) {
    toast.error((err as Error).message);
  } finally {
    refreshing.value = false;
  }
};

const handleSave = async () => {
  try {
    loading.value = true;

    // 데이터 검증
    if (!title.value || title.value.trim() === "") {
      toast.error("게임 이름을 입력해주세요.");
      return;
    }

    // 날짜 처리 개선
    let processedDate = null;
    if (publishDate.value) {
      try {
        // DateValue를 Date 객체로 변환
        processedDate = publishDate.value.toDate("UTC");

        // 날짜 유효성 검사
        if (isNaN(processedDate.getTime())) {
          processedDate = null;
        }
      } catch (error) {
        console.warn("날짜 변환 오류:", error);
        processedDate = null;
      }
    }

    const gameData = {
      title: title.value.trim(),
      publishDate: processedDate,
      makerName: makerName.value?.trim() || null,
      category: category.value?.trim() || null,
      tags: tags.value?.trim() || null,
      memo: memo.value?.trim() || null,
    };

    const result = await updateGame(props.path, gameData);

    if (result.type === "success") {
      // 게임 목록 다시 가져오기
      await gameStore.loadList();

      // 다이얼로그 닫기
      emit("update:modelValue", false);
    } else {
      toast.error(result.message);
      if (result.description) {
        console.error("게임 정보 저장 오류 상세:", result.description);
      }
    }
  } catch (error) {
    console.error("게임 정보 저장 실패:", error);
    toast.error("게임 정보 저장 중 예기치 못한 오류가 발생했습니다.");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  handlePublishDate(props.publishDate);
});
</script>
