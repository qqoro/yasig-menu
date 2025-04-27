<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useApi } from "../../../composable/useApi";
import { IpcRendererSend } from "../../../events";

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const api = useApi();

const add = () => {
  emit("update:modelValue", [...props.modelValue, ""]);
};

const openFolder = (path: string) => {
  api.send(IpcRendererSend.OpenFolder, path);
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
      <Button size="icon" variant="outline" @click="add">
        <Icon icon="solar:add-folder-bold-duotone" />
      </Button>
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
        <Button
          size="icon"
          variant="outline"
          @click="openFolder(modelValue[index])"
        >
          <Icon icon="solar:move-to-folder-bold-duotone" />
        </Button>
        <Button size="icon" variant="destructive" @click="deleteSource(index)">
          <Icon icon="solar:trash-bin-minimalistic-2-bold-duotone" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
