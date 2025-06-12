<script setup lang="ts">
import PopOverButton from "../../../components/PopOverButton.vue";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const add = () => {
  emit("update:modelValue", [...props.modelValue, ""]);
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
    <CardHeader>
      <div class="flex justify-between items-center">
        <div class="text-lg">게임 실행 시 제외할 파일</div>
        <PopOverButton
          icon="solar:add-folder-bold-duotone"
          message="제외할 실행 파일 이름 추가"
          @click="add"
        />
      </div>
      <div class="text-muted-foreground text-sm">
        <p>
          게임 실행 시 제외할 파일을 지정할 수 있습니다. 홈에서 게임 실행 시에는
          폴더 내부의 exe파일을 탐색하는데, 간혹 게임 실행파일이 아닌 다른
          파일이 실행되는 경우가 있습니다. 이 때에는 실행 시 노출되는 메시지에
          어떤 파일을 실행하는지 나타나는데, 해당 이름을 복사해서 추가해주세요.
        </p>
        <p>
          추가시에는 확장자 제외하고 파일 이름만 입력해야 하고 대소문자는
          구분하지 않습니다.
        </p>
      </div>
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
          placeholder="제외 파일 이름"
        />
        <PopOverButton
          variant="destructive"
          icon="solar:trash-bin-minimalistic-2-bold-duotone"
          message="제외 파일 삭제"
          @click="deleteSource(index)"
        />
      </div>
      <div v-if="modelValue.length === 0" class="text-muted-foreground text-sm">
        제외한 파일이 아직 없습니다.
      </div>
    </CardContent>
  </Card>
</template>
