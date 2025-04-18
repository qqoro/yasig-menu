import { onMounted, onUnmounted } from "vue";

export const useWindowEvent = <K extends keyof WindowEventMap>(
  event: K,
  callback: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
) => {
  onMounted(() => {
    window.addEventListener(event, callback, options);
  });
  onUnmounted(() => {
    window.removeEventListener(event, callback, options);
  });
};
