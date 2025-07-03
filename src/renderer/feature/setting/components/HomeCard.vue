<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";

defineProps<{
  all: boolean;
  recent: boolean;
  collectorTitle: boolean;
}>();
const emit = defineEmits<{
  (e: "update:all", value: boolean): void;
  (e: "update:recent", value: boolean): void;
  (e: "update:collectorTitle", value: boolean): void;
}>();
</script>

<template>
  <Card>
    <CardHeader class="flex flex-col gap-2">
      <div class="text-lg">홈화면 설정</div>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <div class="flex flex-col gap-2">
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:all', !all)"
        >
          <div>첫 진입 시 모든 게임 표시 (비활성화 시 성능 향상)</div>
          <Switch :model-value="all" @update.stop />
        </Button>
      </div>
      <div class="flex flex-col gap-2">
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:recent', !recent)"
        >
          <div>최근 플레이 게임 표시</div>
          <Switch :model-value="recent" @update.stop />
        </Button>
      </div>
      <div class="flex flex-col gap-2">
        <Button
          variant="outline"
          class="flex justify-between items-center w-full"
          @click="emit('update:collectorTitle', !collectorTitle)"
        >
          <div class="flex justify-center items-center gap-1">
            수집된 원본 제목 표시
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Icon icon="solar:question-circle-outline" />
                </TooltipTrigger>
                <TooltipContent class="max-w-48 text-pretty" align="start">
                  <p>수집한 게임 정보의 원제목을 추가적으로 표시합니다.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch :model-value="collectorTitle" @update.stop />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
