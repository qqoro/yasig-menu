<script setup lang="ts">
import { useWindowEvent } from "./composable/useWindowEvent";

useWindowEvent("keyup", (event) => {
  switch (true) {
    // 창 종료
    case event.key.toLowerCase() === "w" && event.ctrlKey:
      window.close();
      break;
    // 새로고침
    case event.key.toLowerCase() === "r" && event.ctrlKey:
      location.reload();
      break;
  }
});
</script>

<template>
  <RouterView />
</template>
