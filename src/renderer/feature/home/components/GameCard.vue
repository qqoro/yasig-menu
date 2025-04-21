<script setup lang="ts">
import { Icon } from "@iconify/vue";
import log from "electron-log";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import PopOverButton from "../../../components/PopOverButton.vue";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { useApi } from "../../../composable/useApi";
import { useEvent } from "../../../composable/useEvent";
import { IpcMainSend, IpcRendererSend } from "../../../events";
import { cn } from "../../../lib/utils";
import { useSetting } from "../../../store/setting-store";
import { GameData } from "../../../typings/local";
const console = log;

const props = defineProps<GameData>();
const emit = defineEmits<{
  viewThumbnail: [title: string, thumbnailPath: string];
}>();
const setting = useSetting();

const api = useApi();
const loading = ref(false);
const isRJCodeExist = computed(() => /RJ\d{6,8}/gi.exec(props.title));

const downloadThumbnail = (filePath: string) => {
  loading.value = true;
  const [useSavePath, savePath] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.ThumbnailDownload, {
    filePath,
    cookie: setting.cookie,
    search: [...setting.search],
    savePath: useSavePath ? savePath : undefined,
  });
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
  const [isChange, thumbnailFolder] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.LoadList, {
    sources: [...setting.applySources],
    exclude: [...setting.exclude],
    thumbnailFolder: isChange ? thumbnailFolder : undefined,
  });
};

const openDLSite = (rjCode: string) => {
  window.open(`https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`);
};

const titleFontSize = computed(() => {
  return Math.max(16 / (setting.zoom * 0.02), 16);
});

useEvent(IpcMainSend.ThumbnailDone, (e, filePath) => {
  if (filePath !== props.path) {
    return;
  }

  loading.value = false;
});
</script>

<template>
  <Card
    class="p-0 overflow-hidden hover:bg-green-50 transition-colors gap-1 w-96"
  >
    <CardHeader
      class="p-0 w-full overflow-hidden flex justify-center items-center"
      style="aspect-ratio: 4/3"
    >
      <img
        v-if="thumbnail && !loading"
        @click="emit('viewThumbnail', title, thumbnail)"
        :class="
          cn(
            'object-cover w-full aspect-[4/3] hover:scale-110 transition-transform cursor-zoom-in',
            { 'blur-md': setting.blur },
            { 'brightness-0': setting.dark }
          )
        "
        style="aspect-ratio: 4/3"
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
      class="p-0 m-2 text-ellipsis text-nowrap overflow-hidden"
      :title="title"
      :style="`font-size: ${titleFontSize}px`"
    >
      {{ title }}
    </CardContent>
    <CardFooter class="p-2 pt-0 flex gap-2">
      <PopOverButton
        v-if="path.toLowerCase().endsWith('.zip')"
        icon="solar:zip-file-bold-duotone"
        @click="play(path)"
        message="압축파일을 실행합니다."
      />
      <PopOverButton
        v-else
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
          <DropdownMenuItem v-if="isRJCodeExist?.[0]" as-child>
            <a
              :href="`https://www.dlsite.com/maniax/work/=/product_id/${isRJCodeExist?.[0]}.html`"
              target="_blank"
              referrerpolicy="no-referrer"
            >
              <Icon icon="solar:square-share-line-bold-duotone" />
              <span>RJ 사이트 열기</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardFooter>
  </Card>
</template>
