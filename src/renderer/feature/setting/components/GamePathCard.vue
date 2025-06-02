<script setup lang="ts">
import { IpcRendererSend } from "../../../../main/events";
import PopOverButton from "../../../components/PopOverButton.vue";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { send } from "../../../composable/useApi";

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const add = () => {
  emit("update:modelValue", [...props.modelValue, ""]);
};

const openFolder = (path: string) => {
  send(IpcRendererSend.OpenFolder, path);
};

const deleteSource = (index: number) => {
  const list = [...props.modelValue];
  list.splice(index, 1);
  emit("update:modelValue", list);
};

const updateInputValue = (index: number, value: string) => {
  const list = [...props.modelValue];
  list[index] = value;
  emit("update:modelValue", list);
};
</script>

<template>
  <Card>
    <CardHeader class="flex justify-between items-center">
      <div class="text-lg">게임 경로 설정</div>
      <PopOverButton
        icon="solar:add-folder-bold-duotone"
        message="경로 추가"
        @click="add"
      />
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <div
        v-for="(_, index) in modelValue.length"
        :key="index"
        class="flex gap-2"
      >
        <Input
          v-model="modelValue[index]"
          @update:model-value="(v) => updateInputValue(index, v as string)"
          placeholder="경로"
        />
        <PopOverButton
          icon="solar:move-to-folder-bold-duotone"
          message="경로 열기"
          @click="openFolder(modelValue[index])"
        />
        <PopOverButton
          variant="destructive"
          icon="solar:trash-bin-minimalistic-2-bold-duotone"
          message="경로 삭제"
          @click="deleteSource(index)"
        />
      </div>
      <div v-if="modelValue.length === 0" class="text-muted-foreground text-sm">
        아직 등록된 경로가 없습니다.
      </div>
    </CardContent>
  </Card>
</template>
