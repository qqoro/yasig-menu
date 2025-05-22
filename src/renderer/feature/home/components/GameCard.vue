<script setup lang="ts">
import { Icon } from "@iconify/vue";
import log from "electron-log";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import type { Game } from "../../../../main/db/db";
import { IpcMainSend, IpcRendererSend } from "../../../../main/events";
import PopOverButton from "../../../components/PopOverButton.vue";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
import { Dialog } from "../../../components/ui/dialog";
import DialogContent from "../../../components/ui/dialog/DialogContent.vue";
import DialogDescription from "../../../components/ui/dialog/DialogDescription.vue";
import DialogHeader from "../../../components/ui/dialog/DialogHeader.vue";
import DialogTitle from "../../../components/ui/dialog/DialogTitle.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { useApi } from "../../../composable/useApi";
import { useEvent } from "../../../composable/useEvent";
import { useFile } from "../../../composable/useFile";
import { IMAGE_FILE_TYPE } from "../../../constants";
import { cn } from "../../../lib/utils";
import { useGame } from "../../../store/game-store";
import { useSetting } from "../../../store/setting-store";
const console = log;

const props = defineProps<Omit<Game, "source" | "isLoadedInfo">>();
const emit = defineEmits<{
  viewThumbnail: [title: string, thumbnailPath: string];
  writeMemo: [path: string, title: string];
}>();
const setting = useSetting();
const game = useGame();

const api = useApi();
const open = ref(false);
const loading = ref(false);
// 썸네일 변경 후에도 캐시된 이미지가 노출되는 경우 때문에 가짜 쿼리스트링 추가가
const fakeQueryId = ref(0);
const isRJCodeExist = computed(() => /RJ\d{6,8}/i.exec(props.title));
const { file, changeHandler } = useFile(
  IMAGE_FILE_TYPE,
  "이미지 파일을 업로드 해 주세요."
);
const url = ref("");

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
  game.loadList();
};

const openChangeThumbnailDialog = (value: boolean) => {
  open.value = value;
  file.value = undefined;
  url.value = "";
};

const uploadThumbnail = async () => {
  if (!file.value) {
    toast.error("이미지 파일을 업로드 해 주세요.");
    return;
  }

  loading.value = true;
  open.value = false;
  const [useSavePath, savePath] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.ThumbnailDownload, {
    filePath: props.path,
    cookie: setting.cookie,
    search: [...setting.search],
    savePath: useSavePath ? savePath : undefined,
    file: {
      data: await file.value.arrayBuffer(),
      ext:
        "." +
        (file.value.name.split(".").at(-1) ??
          file.value.type.split("/").at(-1) ??
          ""),
    },
  });
};

const downloadThumbnailFromUrl = (filePath: string) => {
  try {
    if (!url.value.trim()) {
      throw Error();
    }
    new URL(url.value);
  } catch {
    toast.error("올바른 URL 전체를 입력해주세요.");
    return;
  }

  loading.value = true;
  open.value = false;
  const [useSavePath, savePath] = setting.changeThumbnailFolder;
  api.send(IpcRendererSend.ThumbnailDownload, {
    filePath,
    cookie: setting.cookie,
    search: [...setting.search],
    savePath: useSavePath ? savePath : undefined,
    url: url.value,
  });
};

const play = (filePath: string) => {
  api.send(IpcRendererSend.Play, filePath, [...setting.playExclude]);
  game.loadList();
};

const openFolder = (filePath: string) => {
  api.send(IpcRendererSend.OpenFolder, filePath);
};

const hide = (filePath: string) => {
  api.send(IpcRendererSend.Hide, { path: filePath, isHidden: true });
  game.loadList();
};

const clear = (filePath: string) => {
  api.send(IpcRendererSend.Clear, { path: filePath, isClear: !props.isClear });
  game.loadList();
};

const removeRecent = (filePath: string) => {
  api.send(IpcRendererSend.Recent, { path: filePath, isRecent: false });
  game.loadList();
};

const titleFontSize = computed(() => {
  return Math.max(16 / (setting.zoom * 0.02), 16);
});

useEvent(IpcMainSend.ThumbnailDone, (e, filePath) => {
  if (filePath !== props.path) {
    return;
  }

  game.loadList();
  loading.value = false;
});

watch(loading, () => {
  fakeQueryId.value += 1;
});
</script>

<template>
  <Card
    :class="
      cn('p-0 overflow-hidden hover:bg-green-50 gap-1 w-96 transition-all', {
        'opacity-50 hover:opacity-100': isClear,
      })
    "
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
        :src="thumbnail.replaceAll('#', '%23') + '?v=' + fakeQueryId"
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
        v-if="isCompressFile"
        icon="solar:zip-file-bold-duotone"
        message="압축파일을 실행합니다."
        @click="play(path)"
      />
      <PopOverButton
        v-else
        icon="solar:play-bold-duotone"
        message="게임을 실행합니다."
        @click="play(path)"
      />
      <PopOverButton
        icon="solar:move-to-folder-bold-duotone"
        message="해당 폴더를 탐색기로 엽니다."
        @click="openFolder(path)"
      />
      <PopOverButton
        icon="solar:eye-bold-duotone"
        message="이 게임을 목록에서 숨깁니다."
        @click="hide(path)"
      />
      <PopOverButton
        :icon="isClear ? 'solar:flag-bold-duotone' : 'solar:flag-line-duotone'"
        :message="
          isClear
            ? '이 게임을 클리어하지 않음으로 표시합니다.'
            : '이 게임을 클리어로 표시합니다.'
        "
        @click="clear(path)"
      />
      <PopOverButton
        icon="solar:pen-new-round-bold-duotone"
        :message="memo || '메모하기'"
        :pre="true"
        @click="emit('writeMemo', path, title)"
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
          <DropdownMenuItem @click="open = true">
            <Icon icon="solar:gallery-edit-bold-duotone" />
            <span>이미지 변경</span>
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
          <DropdownMenuItem v-if="isRecent" @click="removeRecent(path)">
            <Icon icon="solar:eraser-bold-duotone" />
            <span>최근 플레이 기록 삭제</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardFooter>
    <Dialog v-if="open" :open="open" @update:open="openChangeThumbnailDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>썸네일 변경</DialogTitle>
          <DialogDescription
            >썸네일을 업로드하거나 URL을 입력하여 다운로드 받을 수
            있습니다.</DialogDescription
          >
        </DialogHeader>
        <div class="flex flex-col gap-2 text-sm">
          <p class="text-sm">보유하고 있는 썸네일 파일을 업로드합니다.</p>
          <Input type="file" accept="image/*" @change="changeHandler" />
          <Button @click="uploadThumbnail">업로드</Button>
          <hr class="my-2" />
          <p>썸네일을 다운로드 받을 수 있는 URL을 입력합니다.</p>
          <Input v-model="url" placeholder="다운로드 받을 수 있는 전체 URL" />
          <Button @click="downloadThumbnailFromUrl(path)"
            >URL에서 다운로드</Button
          >
        </div>
      </DialogContent>
    </Dialog>
  </Card>
</template>
