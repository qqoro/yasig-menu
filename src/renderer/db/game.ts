import { db } from "../../main/db/db-manager";
import { IpcMainSend, IpcRendererSend } from "../../main/events";
import { sendApi } from "../composable/useApi";

export async function getGameList(options?: {
  hideZipFile: boolean;
  isHidden: boolean;
}) {
  const [, data] = await sendApi(
    IpcRendererSend.LoadList,
    IpcMainSend.LoadedList,
    options ?? {}
  );
  return data;
}

export function thumbnailDownload() {
  return db("setting").select().toQuery();
}

console.log(thumbnailDownload());
