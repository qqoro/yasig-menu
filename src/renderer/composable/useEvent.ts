import type { IpcRendererEvent } from "electron";
import { onMounted, onUnmounted } from "vue";
import { IpcMainEventMap, IpcMainSend } from "../../main/events";
import { useApi } from "./useApi";

export const useEvent = <T extends IpcMainSend>(
  event: T,
  callback: (event: IpcRendererEvent, ...args: IpcMainEventMap[T]) => void
) => {
  const api = useApi();

  onMounted(() => {
    api.addListener(event, callback);
  });
  onUnmounted(() => {
    api.removeListener(event, callback);
  });
};
