<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify/vue";

defineProps<{
  icon: string;
  message: string;
}>();
const emit = defineEmits<{
  click: [event: Event];
}>();

const onClick = (event: Event) => {
  emit("click", event);
};
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="outline" size="icon" @click="onClick">
          <Icon :icon="icon" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ message }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
