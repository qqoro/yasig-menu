<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, reactive, ref } from "vue";
import { toast } from "vue-sonner";
import Changelog from "../../../components/Changelog.vue";
import PageTitle from "../../../components/PageTitle.vue";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { useApi } from "../../../composable/useApi";
import { useEvent } from "../../../composable/useEvent";
import { IpcMainSend, IpcRendererSend } from "../../../events";
import { useSetting } from "../../../store/setting-store";

import img1 from "@/assets/1.jpg";
import img2 from "@/assets/2.jpg";
import img3 from "@/assets/3.jpg";
import img4 from "@/assets/4.jpg";
import img5 from "@/assets/5.jpg";
import img6 from "@/assets/6.jpg";
import img7 from "@/assets/7.jpg";

import log from "electron-log";
const console = log;

const setting = useSetting();
const api = useApi();

const sources = reactive([...setting.sources]);
const changeThumbnailFolder = reactive<[boolean, string]>([
  ...setting.changeThumbnailFolder,
]);
const blur = ref(setting.blur);
const dark = ref(setting.dark);
const cookie = ref(setting.cookie);
const exclude = ref(setting.exclude);
const search = ref(setting.search);
const appVersion = ref("");

const open = ref(false);

const add = () => {
  sources.push("");
};

const deleteSource = (index: number) => {
  sources.splice(index, 1);
};

const removeExclude = (index: number) => {
  const list = [...exclude.value];
  list.splice(index, 1);
  exclude.value = list;
};

const save = () => {
  const set = new Set();
  for (const source of sources) {
    if (set.has(source)) {
      return toast.error("중복된 게임 경로가 있어요");
    }
    if (source.length === 0) {
      return toast.warning("게임 경로를 입력해주세요");
    }
    set.add(source);
  }

  setting.saveSources(sources.map((source) => source.trim()));
  setting.saveChangeThumbnailFolder(changeThumbnailFolder);
  setting.saveBlur(blur.value);
  setting.saveDark(dark.value);
  setting.saveCookie(cookie.value);
  setting.saveExclude(exclude.value);
  setting.saveSearch(search.value);
  toast.success("설정을 저장했습니다.");
};

const copy = async () => {
  await window.navigator.clipboard.writeText("https://www.google.com");
  toast.success("주소가 복사되었습니다.");
};

const updateCheck = () => {
  api.send(IpcRendererSend.UpdateCheck);
};

const openLogFolder = () => {
  api.send(IpcRendererSend.OpenLogFolder);
};

const openChangelog = () => {
  open.value = !open.value;
};

onMounted(() => {
  api.send(IpcRendererSend.VersionCheck);
});
useEvent(IpcMainSend.VersionChecked, (e, version: string) => {
  appVersion.value = version;
});
</script>

<template>
  <main class="flex flex-col gap-4">
    <PageTitle>설정</PageTitle>
    <Card>
      <CardHeader class="flex justify-between items-center">
        <div class="text-lg">게임 경로 설정</div>
        <Button size="icon" variant="outline" @click="add">
          <Icon icon="solar:add-folder-bold-duotone" />
        </Button>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <div
          v-for="(_, index) in sources.length"
          :key="'key-' + index"
          class="flex gap-2"
        >
          <Input v-model="sources[index]" />
          <Button
            size="icon"
            variant="destructive"
            @click="deleteSource(index)"
          >
            <Icon icon="solar:trash-bin-minimalistic-2-bold-duotone" />
          </Button>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-col gap-2">
        <div class="text-lg">썸네일 설정</div>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <div class="flex flex-col gap-2">
          <Button
            variant="outline"
            class="flex justify-between items-center w-full"
            @click="changeThumbnailFolder[0] = !changeThumbnailFolder[0]"
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
                      썸네일이 저장되는 경로를 변경합니다. 해당 값 적용 시
                      기존의 썸네일이 이동되지는 않으므로 직접 옮겨주거나 다시
                      다운로드 받아야 합니다.
                    </p>
                    <p class="text-muted-foreground">
                      기본 값은 각 게임 경로 폴더입니다.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch v-model="changeThumbnailFolder[0]" />
          </Button>
          <Input
            v-if="changeThumbnailFolder[0]"
            v-model="changeThumbnailFolder[1]"
            placeholder="새로운 저장 경로를 입력하세요."
          />
        </div>
        <div class="flex flex-col gap-2">
          <Button
            variant="outline"
            class="flex justify-between items-center w-full"
            @click="blur = !blur"
          >
            <div>썸네일 블러 켜기</div>
            <Switch v-model="blur" @update.stop />
          </Button>
          <Button
            variant="outline"
            class="flex justify-between items-center w-full"
            @click="dark = !dark"
          >
            <div>썸네일 숨김 켜기</div>
            <Switch v-model="dark" />
          </Button>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-col gap-2">
        <div class="text-lg flex justify-between items-center w-full">
          <span>쿠키 설정</span>
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="outline" class="rounded-full cursor-help">
                값은 어디서 얻나요?
              </Button>
            </DialogTrigger>
            <DialogContent
              class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh] max-w-4xl! w-[90dvw]!"
            >
              <DialogHeader>
                <DialogTitle>NID값 가져오기</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <div class="grid overflow-y-auto px-6">
                <ol class="flex flex-col justify-between gap-6">
                  <li>
                    1.
                    <Button variant="link" @click="copy">
                      구글 홈페이지
                      <Icon icon="solar:clipboard-bold-duotone" /></Button
                    >에 접속합니다. 그 후 하단의 "검색 설정" 에 접속합니다.
                    <img class="w-full" :src="img1" alt="" />
                  </li>
                  <li>
                    2. 세이프 서치 화면으로 이동합니다.
                    <img class="w-full" :src="img2" alt="" />
                  </li>
                  <li>
                    3. 사용 안함을 눌러 설정합니다.
                    <img class="w-full" :src="img3" alt="" />
                  </li>
                  <li>
                    4. 뒤로 돌아간 뒤 기타 설정을 눌러 이동합니다. 그리고 언어
                    및 지역을 눌러 이동합니다.
                    <img class="w-full" :src="img4" alt="" />
                  </li>
                  <li>
                    5. 검색결과 지역을 누릅니다.
                    <img class="w-full" :src="img5" alt="" />
                  </li>
                  <li>
                    6. 검색결과 지역을 "가나"로 설정하고 확인을 눌러 저장합니다.
                    <img class="w-full" :src="img6" alt="" />
                  </li>
                  <li>
                    7. 개발자도구를 열어 상단의 애플리케이션 > 쿠키 >
                    https://www.google... 로 시작하는 탭을 누릅니다. 그 후
                    NID값을 복사해서 설정페이지에 붙여넣습니다.
                    <img class="w-full" :src="img7" alt="" />
                  </li>
                </ol>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div class="text-muted-foreground text-sm">
          <p>
            구글 검색 시 사용할 <span class="font-bold">NID</span> 쿠키 값을
            지정합니다. 썸네일 다운로드 시 이미지가 없는 경우 세이프 서치 제한에
            걸렸을 확률이 높습니다. 이를 우회하기 위해 해당 값을 사용합니다.
          </p>
          <p>
            세이프 서치에 걸리거나, 이미지가 블러 형태로 나타날 때 적용하면
            해결될 수 있습니다.
          </p>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <Input v-model="cookie"></Input>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex flex-col gap-2">
        <div class="text-lg flex justify-between items-center w-full">
          검색어 설정
        </div>
        <div class="text-muted-foreground text-sm">
          썸네일 다운로드 시 검색어를 게임 이름의 앞/뒤로 추가할 수 있습니다.
          원하는 썸네일 이미지가 잘 선택되지 않는 경우 해당 설정을 조절해보세요.
          실제 검색 시에는
          <span class="font-bold"
            >{{ search[0] ? search[0] + " " : "" }}{게임 이름}
            {{ search[1] ? " " + search[1] : "" }}</span
          >형식으로 검색됩니다.
        </div>
      </CardHeader>
      <CardContent class="flex gap-2 justify-center items-center">
        <Input v-model="search[0]" placeholder="앞에 추가할 검색어" />
        <div class="shrink-0">게임 이름</div>
        <Input v-model="search[1]" placeholder="뒤에 추가할 검색어" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex justify-between items-center">
        <div class="text-lg">숨겨진 게임 목록</div>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <ul
          v-for="(path, index) in exclude"
          :key="'key-' + path + index"
          class="flex gap-2"
        >
          <li
            class="flex gap-2 w-full rounded-sm hover:bg-slate-300 px-2 py-1 transition-colors items-center"
          >
            <div class="w-full">
              {{ path }}
            </div>
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
        <div v-if="exclude.length === 0" class="text-muted-foreground">
          숨겨진 게임이 아직 없습니다.
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader class="flex justify-between items-center">
        <div class="text-lg">앱 정보</div>
      </CardHeader>
      <CardContent class="flex flex-col gap-2 text-sm">
        <p>앱 버전 : {{ appVersion }}</p>
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
        <Button
          variant="outline"
          @click="api.send(IpcRendererSend.ToggleDevTools)"
        >
          <Icon icon="solar:programming-bold-duotone" />
          개발자 도구 토글
        </Button>
        <Button variant="outline" @click="updateCheck">
          <Icon icon="solar:refresh-circle-bold-duotone" />
          업데이트 확인
        </Button>
        <Button variant="outline" @click="openLogFolder">
          <Icon icon="solar:document-text-bold-duotone" />
          로그 폴더 열기
        </Button>
        <Button variant="outline" @click="openChangelog">
          <Icon icon="solar:pin-list-bold-duotone" />
          앱 업데이트 내역
        </Button>
      </CardFooter>
    </Card>

    <!-- <Button @click="save">JSON으로 내보내기</Button> -->
    <!-- <Button @click="save">JSON으로 불러오기</Button> -->
    <Button @click="save">저장</Button>
    <Changelog v-model:open="open" />
  </main>
</template>
