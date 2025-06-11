import { db } from "../db/db-manager.js";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { console, ipcMain, send } from "../main.js";

export const loadSetting = async () => {
  const [data] = await db("setting").select().limit(1);
  Object.keys(data).forEach((key) => {
    try {
      // 빈 문자열은 JSON파싱시 오류나므로 스킵
      if (data[key] === "" || ["createdAt", "updatedAt"].includes(key)) {
        return;
      }

      if (data[key] === 0 || data[key] === 1) {
        data[key] = !!data[key];
      } else {
        data[key] = JSON.parse(data[key]);
      }
    } catch (error) {
      console.error("JSON parsing error:", "key", key, "value", data[key]);
      console.error(error);
    }
  });
  return data;
};

ipcMain.on(IpcRendererSend.LoadSetting, async (e, id) => {
  const data = await loadSetting();
  send(IpcMainSend.LoadedSetting, id, data);
});

ipcMain.on(IpcRendererSend.UpdateSetting, async (e, id, data) => {
  await db("setting").update(data);
});
