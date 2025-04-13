import { onMounted, onUnmounted } from "vue";

export const useWindowEvent = (
  event: keyof WindowEventMap,
  callback: Parameters<(typeof window)["addEventListener"]>[1]
) => {
  onMounted(() => {
    window.addEventListener(event, callback);
  });
  onUnmounted(() => {
    window.removeEventListener(event, callback);
  });
};
