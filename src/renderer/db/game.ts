import { Game } from "../../main/db/db";
import {
  IpcMainSend,
  IpcRendererEventMap,
  IpcRendererSend,
} from "../../main/events";
import { sendApi } from "../composable/useApi";

export async function getGameList(
  options?: IpcRendererEventMap[IpcRendererSend.LoadList][1]
) {
  const [, data] = await sendApi(
    IpcRendererSend.LoadList,
    IpcMainSend.LoadedList,
    options
  );
  return data;
}

export async function updateGame(
  path: string,
  gameData: Partial<
    Pick<
      Game,
      | "title"
      | "publishDate"
      | "makerName"
      | "category"
      | "tags"
      | "isClear"
      | "memo"
    >
  >
) {
  const [, result] = await sendApi(
    IpcRendererSend.UpdateGame,
    IpcMainSend.Message,
    { path, gameData }
  );
  return result;
}

export async function thumbnailDownload(
  path: string,
  options?: { url?: string; file?: { data: ArrayBuffer; ext: string } }
) {
  const [, result] = await sendApi(
    IpcRendererSend.ThumbnailDownload,
    IpcMainSend.ThumbnailDone,
    { path, url: options?.url, file: options?.file }
  );
  return result;
}
