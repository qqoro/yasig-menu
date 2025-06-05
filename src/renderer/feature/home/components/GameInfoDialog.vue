<template>
  <Dialog :open="modelValue" @update:open="(v) => emit('update:modelValue', v)">
    <DialogContent class="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh]">
      <DialogHeader>
        <DialogTitle>게임 정보 수정</DialogTitle>
        <DialogDescription>게임 정보를 수정합니다.</DialogDescription>
      </DialogHeader>

      <div class="flex w-full flex-col col gap-2 overflow-y-auto p-1">
        <div class="w-full flex flex-col gap-1">
          <div class="w-full">게임 이름</div>
          <Input type="text" class="w-full" v-model="title" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">발매일</div>
          <DatePicker v-model="publishDate" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">제작자</div>
          <Input type="text" class="w-full" v-model="makerName" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">카테고리</div>
          <Input type="text" class="w-full" v-model="category" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">태그</div>
          <Input type="text" class="w-full" v-model="tags" />
        </div>
        <div class="w-full flex flex-col gap-2">
          <Button
            variant="outline"
            class="flex justify-between items-center w-full"
            @click="isClear = !isClear"
          >
            <div>클리어 여부</div>
            <Switch v-model="isClear" @update.stop />
          </Button>
        </div>
        <div class="w-full flex flex-col gap-2">
          <div class="w-full">메모</div>
          <Textarea type="text" class="w-full" v-model="memo" />
        </div>
      </div>

      <DialogFooter>
        <Button>저장</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { DateValue } from "@internationalized/date";
import { ref } from "vue";
import { Game } from "../../../../main/db/db";
import { Button } from "../../../components/ui/button";
import DatePicker from "../../../components/ui/date-picker/date-picker.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";

const props = defineProps<
  {
    modelValue: boolean;
  } & Pick<
    Game,
    | "title"
    | "publishDate"
    | "makerName"
    | "category"
    | "tags"
    | "isClear"
    | "memo"
  >
>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const title = ref(props.title);
const publishDate = ref<DateValue>();
const makerName = ref(props.makerName);
const category = ref(props.category);
const tags = ref(props.tags);
const isClear = ref(false);
const memo = ref(props.memo);
</script>
