<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string[]): void }>();

const removeExclude = (index: number) => {
  const list = [...props.modelValue];
  list.splice(index, 1);
  emit("update:modelValue", list);
};
</script>

<template>
  <Card>
    <CardHeader class="flex justify-between items-center">
      <div class="text-lg">숨겨진 게임 목록</div>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <div v-if="modelValue.length === 0" class="text-muted-foreground text-sm">
        숨겨진 게임이 아직 없습니다.
      </div>
      <details v-else title="asdasd">
        <summary>펼치기</summary>
        <ul v-for="(path, index) in modelValue" :key="index" class="flex gap-2">
          <li
            class="flex gap-2 w-full rounded-sm hover:bg-slate-300 px-2 py-1 transition-colors items-center"
          >
            <div class="w-full">{{ path }}</div>
            <Button
              size="icon"
              variant="destructive"
              class="shrink-0"
              @click="removeExclude(index)"
            >
              <Icon icon="solar:trash-bin-minimalistic-2-bold-duotone" />
            </Button>
          </li>
        </ul>
      </details>
    </CardContent>
  </Card>
</template>
