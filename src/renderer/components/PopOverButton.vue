<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Button, ButtonVariants } from "../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { cn } from "../lib/utils";

defineProps<{
  icon: string;
  message: string;
  variant?: ButtonVariants["variant"];
  pre?: boolean;
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
        <Button :variant="variant ?? 'outline'" size="icon" @click="onClick">
          <Icon :icon="icon" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p :class="cn({ 'whitespace-pre-wrap break-all max-w-64': pre })">
          {{ message }}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
