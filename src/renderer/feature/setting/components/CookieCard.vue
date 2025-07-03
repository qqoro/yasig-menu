<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";

import img1 from "@/assets/1.jpg";
import img2 from "@/assets/2.jpg";
import img3 from "@/assets/3.jpg";
import img4 from "@/assets/4.jpg";
import img5 from "@/assets/5.jpg";
import img6 from "@/assets/6.jpg";
import img7 from "@/assets/7.jpg";

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

const copy = async () => {
  await window.navigator.clipboard.writeText("https://www.google.com");
  toast.success("주소가 복사되었습니다.");
};
</script>

<template>
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
                  4. 뒤로 돌아간 뒤 기타 설정을 눌러 이동합니다. 그리고 언어 및
                  지역을 눌러 이동합니다.
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
                  https://www.google... 로 시작하는 탭을 누릅니다. 그 후 NID값을
                  복사해서 설정페이지에 붙여넣습니다.
                  <img class="w-full" :src="img7" alt="" />
                </li>
              </ol>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div class="text-muted-foreground text-sm line-through">
        <p>
          구글 검색 시 사용할 <span class="font-bold">NID</span> 쿠키 값을
          지정합니다. 썸네일 다운로드 시 이미지가 없는 경우 세이프 서치 제한에
          걸렸을 확률이 높습니다. 이를 우회하기 위해 해당 값을 사용합니다.
        </p>
        <p>
          세이프 서치에 걸리거나, 이미지가 블러 형태로 나타날 때 적용하면 해결될
          수 있습니다.
        </p>
      </div>
      <p>이제는 자동으로 설정됩니다. 값을 변경하지 않아도 됩니다.</p>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <Input
        :model-value="modelValue"
        placeholder="쿠키를 입력하세요."
        @update:model-value="(v) => emit('update:modelValue', v as string)"
      ></Input>
    </CardContent>
  </Card>
</template>
