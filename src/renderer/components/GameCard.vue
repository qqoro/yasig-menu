<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import { toast } from "vue-sonner";
import { useApi } from "../composable/useApi";
import { useEvent } from "../composable/useEvent";
import { IpcMainSend, IpcRendererSend } from "../events";
import { cn } from "../lib/utils";
import { useSetting } from "../store/setting-store";
import { GameData } from "../typings/local";
import PopOverButton from "./PopOverButton.vue";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const props = defineProps<GameData>();
const setting = useSetting();

const api = useApi();
const loading = ref(false);

const downloadThumbnail = (filePath: string) => {
  loading.value = true;
  api.send(IpcRendererSend.ThumbnailDownload, filePath, setting.cookie, [
    ...setting.search,
  ]);
};

const deleteThumbnail = (filePath: string) => {
  api.send(IpcRendererSend.ThumbnailDelete, filePath);
};

const play = (filePath: string) => {
  console.log(filePath);
  api.send(IpcRendererSend.Play, filePath);
};

const openFolder = (filePath: string) => {
  console.log(filePath);
  api.send(IpcRendererSend.OpenFolder, filePath);
};

const hide = (filePath: string) => {
  console.log(filePath);
  setting.addExclude(filePath);
  toast.info(`${props.title}을 숨김 처리 했습니다.`);
  api.send(
    IpcRendererSend.LoadList,
    [...setting.sources],
    [...setting.exclude]
  );
};

useEvent(IpcMainSend.ThumbnailDone, (e, filePath) => {
  if (filePath !== props.path) {
    return;
  }

  loading.value = false;
});
</script>

<template>
  <Card
    class="p-0 overflow-hidden w-full hover:bg-green-50 transition-colors gap-1"
  >
    <CardHeader
      class="p-0 w-full aspect-video overflow-hidden flex justify-center items-center"
    >
      <img
        v-if="thumbnail && !loading"
        :class="
          cn(
            'object-cover w-full aspect-video',
            { 'blur-md': setting.blur },
            { 'brightness-0': setting.dark }
          )
        "
        :src="thumbnail"
        alt=""
      />
      <button v-else-if="!loading" @click="downloadThumbnail(path)">
        <Icon
          icon="solar:gallery-download-bold-duotone"
          class="size-32 max-md:size-24"
        />
      </button>
      <Icon
        v-else
        icon="svg-spinners:ring-resize"
        class="size-32 max-md:size-24"
      />
    </CardHeader>
    <CardContent
      class="p-0 m-2 text-ellipsis text-nowrap overflow-hidden max-md:text-sm"
    >
      {{ title }}
    </CardContent>
    <CardFooter class="p-2 pt-0 flex gap-2">
      <PopOverButton
        icon="solar:play-bold-duotone"
        @click="play(path)"
        message="게임을 실행합니다."
      />
      <PopOverButton
        icon="solar:move-to-folder-bold-duotone"
        @click="openFolder(path)"
        message="해당 폴더를 탐색기로 엽니다."
      />
      <PopOverButton
        icon="solar:eye-bold-duotone"
        @click="hide(path)"
        message="이 게임을 목록에서 숨깁니다."
      />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="icon">
            <Icon icon="solar:hamburger-menu-line-duotone" />
            <!-- 메뉴 -->
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            :disabled="!thumbnail"
            @click="deleteThumbnail(thumbnail!)"
            variant="destructive"
          >
            <Icon icon="solar:trash-bin-minimalistic-2-bold-duotone" />
            <span>썸네일 삭제</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="downloadThumbnail(path)">
            <Icon icon="solar:refresh-circle-bold-duotone" />
            <span>썸네일 다시 다운로드</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardFooter>
  </Card>
</template>
