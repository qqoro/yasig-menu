<script setup lang="ts">
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
} from "@internationalized/date";
import { CalendarIcon } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

defineProps<{
  modelValue?: DateValue;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: DateValue): void;
}>();

const df = new DateFormatter("ko-KR", {
  dateStyle: "long",
});
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground'
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{
          modelValue
            ? df.format(modelValue.toDate(getLocalTimeZone()))
            : "날짜를 선택하세요."
        }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        :model-value="modelValue"
        @update:model-value="(v: DateValue) => emit('update:modelValue', v)"
        initial-focus
      />
    </PopoverContent>
  </Popover>
</template>
