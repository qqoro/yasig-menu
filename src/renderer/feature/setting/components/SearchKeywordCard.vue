<script setup lang="ts">
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

const props = defineProps<{ modelValue: [string, string] }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: [string, string]): void;
}>();

const updateValue = (index: number, value: string) => {
  const list = [...props.modelValue] as [string, string];
  list[index] = value;
  emit("update:modelValue", list);
};
</script>

<template>
  <Card>
    <CardHeader class="flex flex-col gap-2">
      <div class="text-lg flex justify-between items-center w-full">
        검색어 설정
      </div>
      <div class="text-muted-foreground text-sm">
        썸네일 다운로드 시 검색어를 게임 이름의 앞/뒤로 추가할 수 있습니다.
      </div>
    </CardHeader>
    <CardContent class="flex gap-2 justify-center items-center">
      <Input
        v-model="modelValue[0]"
        @update:model-value="(v) => updateValue(0, v as string)"
        placeholder="앞에 추가할 검색어"
      />
      <div class="shrink-0">게임 이름</div>
      <Input
        v-model="modelValue[1]"
        @update:model-value="(v) => updateValue(1, v as string)"
        placeholder="뒤에 추가할 검색어"
      />
    </CardContent>
  </Card>
</template>
