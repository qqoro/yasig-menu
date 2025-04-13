import { ipcMain, shell } from "electron";
import { Dirent } from "fs";
import { readdir } from "fs/promises";
import { extname, join } from "path";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { send } from "../main.js";

function findThumbnails(
  parent: string,
  files: Dirent[]
): { path: string; title: string; thumbnail?: string }[] {
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".avif",
    ".svg",
  ];
  const result: { path: string; title: string; thumbnail?: string }[] = [];

  files.forEach((file) => {
    // 이미지 파일 인 경우 스킵
    const extension = extname(file.name).toLowerCase();
    if (imageExtensions.includes(extension)) {
      return;
    }

    const path = join(file.parentPath, file.name);
    const baseName = file.isFile()
      ? file.name.substring(0, file.name.length - extension.length)
      : file.name;

    // 모든 이미지 확장자 검사
    for (const imgExt of imageExtensions) {
      const thumbnail = `${baseName}${imgExt}`;

      if (
        files.find(
          (file) => file.name.toLowerCase() === thumbnail.toLowerCase()
        )
      ) {
        result.push({
          path,
          title: baseName,
          thumbnail: join(parent, thumbnail),
        });
        return;
      }
    }

    result.push({
      path,
      title: baseName,
      thumbnail: undefined,
    });
  });

  return result;
}

ipcMain.on(
  IpcRendererSend.LoadList,
  async (e, pathList: string[], exclude: string[] = []) => {
    const list: {
      path: string;
      title: string;
      thumbnail?: string;
    }[] = [];

    for await (const parent of pathList) {
      try {
        const child = (await readdir(parent, { withFileTypes: true })).filter(
          (path) => !exclude.includes(join(path.parentPath, path.name))
        );
        list.push(...findThumbnails(parent, child));
      } catch (error) {
        send(IpcMainSend.Message, {
          type: "error",
          message: `${parent} 폴더를 탐색하는데 실패했습니다. 해당 폴더를 제외하거나 경로를 다시 확인해주세요.`,
          description: (error as Error)?.stack,
        });
      }
    }

    send(IpcMainSend.LoadedList, list);
  }
);

const exclude = ["notification_helper", "UnityCrashHandler64"];
ipcMain.on(IpcRendererSend.Play, async (e, filePath: string) => {
  try {
    const folderList = await readdir(filePath, { withFileTypes: true });
    for (const file of folderList) {
      if (
        file.isDirectory() ||
        !file.name.toLowerCase().endsWith(".exe") ||
        exclude.some((ex) => file.name.startsWith(ex.toLowerCase()))
      ) {
        continue;
      }

      const game = join(filePath, file.name);
      shell.openPath(game);
      send(IpcMainSend.Message, {
        type: "success",
        message: `${game} 파일을 실행했습니다. 잠시만 기다려주세요.`,
      });
      return;
    }
    send(IpcMainSend.Message, {
      type: "warning",
      message: "실행파일을 찾지 못했습니다. 폴더 열기를 사용해 실행해주세요.",
    });
  } catch (error) {
    if ((error as Error)?.message?.startsWith("ENOTDIR: not a directory")) {
      shell.openPath(join(filePath));
      return;
    }
    console.error("error!", error);
    send(IpcMainSend.Message, {
      type: "warning",
      message: (error as Error).stack,
    });
  }
});

ipcMain.on(IpcRendererSend.OpenFolder, (e, filePath: string) => {
  shell.showItemInFolder(filePath);
});
