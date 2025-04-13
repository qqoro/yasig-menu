import type { IpcRendererEvent } from "electron";
import { onMounted, onUnmounted } from "vue";
import { IpcMainSend } from "../events";
import { useApi } from "./useApi";

export const useEvent = (
  event: IpcMainSend,
  callback: (event: IpcRendererEvent, ...args: any[]) => void
) => {
  const api = useApi();

  onMounted(() => {
    api.addListener(event, callback);
  });
  onUnmounted(() => {
    api.removeAllListeners(event);
  });
};
