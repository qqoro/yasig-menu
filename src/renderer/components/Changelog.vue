<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

defineProps<{ open: boolean }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const changelog = [
  ["1.0.4", ["RJ코드 DL사이트 지원"]],
  ["1.0.5", ["자동 업데이트 지원"]],
  [
    "1.0.6",
    [
      "자동 업데이트 강화",
      `단축키 추가`,
      `설정에 로그 폴더 열기 추가`,
      `확대/축소 기능 추가`,
    ],
  ],
  [
    "1.0.7",
    [
      `검색기능 추가`,
      `썸네일 폴더 변경 기능 추가`,
      `소스 필터링 추가`,
      `업데이트 확인 개선`,
    ],
  ],
  ["1.0.8", [`홈화면 썸네일 비율 변경`, `썸네일 일괄 다운로드 추가`]],
  ["1.0.9", [`검색 버튼 추가`, `업데이트 다운로드 표시기 수정`]],
  ["1.0.10", [`버그 수정`]],
  [
    "1.0.11",
    [
      `압축파일인 경우 실행 아이콘이 압축 아이콘으로 변경`,
      `썸네일 일괄 처리를 최대 3개까지 동시 진행하게 변경`,
      `폴더 명에 RJ코드가 있는 경우 DL로 갈 수 있는 메뉴를 추가`,
    ],
  ],
].toReversed() as [string, string[]][];
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh]">
      <DialogHeader>
        <DialogTitle>업데이트 내역</DialogTitle>
        <DialogDescription class="hidden"></DialogDescription>
      </DialogHeader>
      <div class="grid overflow-y-auto gap-4 pr-4">
        <div v-for="change in changelog" :key="change[0]">
          <h3 class="text-xl border-b-slate-400 border-b mb-2 py-1">
            v{{ change[0] }}
          </h3>
          <ul class="text-sm space-y-1">
            <li v-for="item in change[1]">- {{ item }}</li>
          </ul>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
