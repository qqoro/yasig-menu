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
