import { InsertSetting } from "../../main/db/db";
import { IpcMainSend, IpcRendererSend } from "../../main/events";
import { send, sendApi } from "../composable/useApi";

export async function getSetting() {
  const [, data] = await sendApi(
    IpcRendererSend.LoadSetting,
    IpcMainSend.LoadedSetting
  );
  return data;
}

export function updateSetting(options: InsertSetting) {
  send(IpcRendererSend.UpdateSetting, options);
}
