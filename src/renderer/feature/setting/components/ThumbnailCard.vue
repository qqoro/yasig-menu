<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { IpcRendererSend } from "../../../../main/events";
import PopOverButton from "../../../components/PopOverButton.vue";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { send } from "../../../composable/useApi";

defineProps<{
  modelValue: [boolean, string];
  blur: boolean;
  dark: boolean;
  deleteThumbnailFile: boolean;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: [boolean, string]): void;
  (e: "update:blur", value: boolean): void;
  (e: "update:dark", value: boolean): void;
  (e: "update:deleteThumbnailFile", value: boolean): void;
}>();

const openFolder = (path: string) => {
  send(IpcRendererSend.OpenFolder, path);
};
</script>

<template>
  <Card>
    <CardHeader class="flex flex-col gap-2">
      <div class="text-lg">썸네일 설정</div>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <div class="flex flex-col gap-2">
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:modelValue', [!modelValue[0], modelValue[1]])"
        >
          <div class="flex justify-center items-center gap-1">
            저장 경로 변경하기
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Icon icon="solar:question-circle-outline" />
                </TooltipTrigger>
                <TooltipContent class="max-w-48 text-pretty" align="start">
                  <p>
                    썸네일이 저장되는 경로를 변경합니다. 해당 값 적용 시 기존의
                    썸네일이 이동되지는 않으므로 직접 옮겨주거나 다시 다운로드
                    받아야 합니다.
                  </p>
                  <p class="text-muted-foreground">
                    기본 값은 각 게임 경로 폴더입니다.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch :model-value="modelValue[0]" />
        </Button>
        <div
          v-if="modelValue[0]"
          class="flex justify-center items-center gap-2"
        >
          <Input
            :model-value="modelValue[1]"
            @update:model-value="(v) => emit('update:modelValue', [modelValue[0], v as string])"
            placeholder="새로운 저장 경로를 입력하세요."
          />
          <PopOverButton
            icon="solar:move-to-folder-bold-duotone"
            message="폴더 열기"
            @click="openFolder(modelValue[1])"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:blur', !blur)"
        >
          <div>썸네일 블러 켜기</div>
          <Switch :model-value="blur" @update.stop />
        </Button>
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:dark', !dark)"
        >
          <div>썸네일 숨김 켜기</div>
          <Switch :model-value="dark" @update.stop />
        </Button>
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:deleteThumbnailFile', !deleteThumbnailFile)"
        >
          <div class="flex justify-center items-center gap-1">
            목록에 없는 썸네일 파일 삭제
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Icon icon="solar:question-circle-outline" />
                </TooltipTrigger>
                <TooltipContent class="max-w-48 text-pretty" align="start">
                  <p>
                    게임 목록 새로고침 시, 더 이상 존재하지 않는 게임의 썸네일
                    파일을 물리적으로 삭제합니다.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch :model-value="deleteThumbnailFile" @update.stop />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
