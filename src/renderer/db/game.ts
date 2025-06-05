import { db } from "../../main/db/db-manager";
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

export function thumbnailDownload() {
  return db("setting").select().toQuery();
}

console.log(thumbnailDownload());
