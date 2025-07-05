<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";

const props = defineProps<{
  appVersion: string;
  reloadGameInfoLoading: boolean;
}>();
const emit = defineEmits<{
  (e: "updateCheck"): void;
  (e: "openLogFolder"): void;
  (e: "openChangelog"): void;
  (e: "toggleDevTools"): void;
  (e: "reloadAllGameInfo"): void;
}>();

const copyAppVersion = async () => {
  await window.navigator.clipboard.writeText(props.appVersion);
  toast.info("앱 버전을 복사했습니다.");
};
</script>

<template>
  <Card>
    <CardHeader class="flex justify-between items-center">
      <div class="text-lg">앱 정보</div>
    </CardHeader>
    <CardContent class="flex flex-col gap-2 text-sm">
      <button class="inline w-fit hover:bg-slate-200" @click="copyAppVersion">
        앱 버전 : {{ props.appVersion }}
      </button>
    </CardContent>
    <CardFooter class="flex justify-start items-center gap-2 flex-wrap">
      <Button as-child variant="outline">
        <a
          href="https://github.com/qqoro/yasig-menu"
          target="_blank"
          referrerpolicy="no-referrer"
        >
          <Icon icon="mdi:github" />
          깃허브 방문하기
        </a>
      </Button>
      <Button variant="outline" @click="emit('toggleDevTools')">
        <Icon icon="solar:programming-bold-duotone" />
        개발자 도구 토글
      </Button>
      <Button variant="outline" @click="emit('updateCheck')">
        <Icon icon="solar:refresh-circle-bold-duotone" />
        업데이트 확인
      </Button>
      <Button variant="outline" @click="emit('openLogFolder')">
        <Icon icon="solar:document-text-bold-duotone" />
        로그 폴더 열기
      </Button>
      <Button variant="outline" @click="emit('reloadAllGameInfo')">
        <Icon
          v-if="!reloadGameInfoLoading"
          icon="solar:server-square-update-bold-duotone"
        />
        <Icon v-else icon="svg-spinners:ring-resize" />
        게임 정보 새로고침
      </Button>
      <Button variant="outline" @click="emit('openChangelog')">
        <Icon icon="solar:pin-list-bold-duotone" />
        앱 업데이트 내역
      </Button>
      <Button variant="outline" as-child>
        <a
          href="https://forms.gle/QegZYSXn1fguRErU6"
          target="_blank"
          referrerpolicy="no-referrer"
        >
          <Icon icon="solar:pen-new-square-bold-duotone" />
          오류 제보 및 건의
        </a>
      </Button>
    </CardFooter>
  </Card>
</template>
