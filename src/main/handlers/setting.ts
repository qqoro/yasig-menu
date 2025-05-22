import { db } from "../db/db-manager.js";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { console, ipcMain, send } from "../main.js";

export const loadSetting = async () => {
  const data = await db("setting").select().limit(1);
  Object.keys(data[0]).forEach((key) => {
    try {
      // 빈 문자열은 JSON파싱시 오류나므로 스킵
      if (data[0][key] === "" || ["createdAt", "updatedAt"].includes(key)) {
        return;
      }

      data[0][key] = JSON.parse(data[0][key]);
    } catch (error) {
      console.error("JSON parsing error:", "key", key, "value", data[0][key]);
      console.error(error);
    }
  });
  return data[0];
};

ipcMain.on(IpcRendererSend.LoadSetting, async (e) => {
  const data = await loadSetting();
  send(IpcMainSend.LoadedSetting, data);
});

ipcMain.on(IpcRendererSend.UpdateSetting, async (e, data) => {
  await db("setting").update(data);
});
