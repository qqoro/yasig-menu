import { app, ipcMain } from "electron";
import { rm, stat, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import puppeteer, { Browser } from "puppeteer";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { send } from "../main.js";

let browser: Browser | undefined;

app.on("window-all-closed", async function () {
  await browser?.close();
  browser = undefined;
});

ipcMain.on(
  IpcRendererSend.ThumbnailDownload,
  async (e, filePath: string, cookie: string, search: [string, string]) => {
    try {
      console.log("hi download requested!", filePath);
      const baseName = basename(filePath);
      const fileName = baseName.substring(
        0,
        baseName.length - extname(baseName).length
      );
      const params = new URLSearchParams({
        q: [search[0], fileName, search[1]].join(" "),
        udm: "2",
      });
      console.log("params", params);
      console.log("q", params.get("q"));

      const executablePath =
        process.env.NODE_ENV === "production"
          ? join(
              import.meta.dirname,
              "node_modules/puppeteer-core/.local-chromium"
            )
          : puppeteer.executablePath();
      console.log("executablePath:", executablePath);
      send(IpcMainSend.Message, {
        type: "info",
        message: executablePath,
      });
      browser ??= await puppeteer.launch({
        headless: true,
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      await browser.setCookie({
        name: "NID",
        domain: ".google.com",
        value: cookie,
      });
      const page = await browser.newPage();

      try {
        await page.goto("https://www.google.com/search?" + params.toString());
        await page.waitForSelector("#center_col img", { timeout: 5000 });
        const src = await page.$$eval("#center_col img", (imgs) =>
          imgs[0].getAttribute("src")
        );
        if (src) {
          const info = await stat(filePath);
          info.isFile();
          const ext = src.substring(src.indexOf("/") + 1, src.indexOf(";"));
          const thumbnailFileName = [
            info.isFile()
              ? join(
                  filePath.substring(0, filePath.length - baseName.length),
                  fileName
                )
              : filePath,
            ext,
          ].join(".");
          console.log("thumbnailFileName", thumbnailFileName);
          writeFile(thumbnailFileName, src.substring(src.indexOf(",") + 1), {
            encoding: "base64",
          });
          send(IpcMainSend.Message, {
            type: "success",
            message: `${baseName}의 썸네일을 다운로드했습니다.`,
          });
        } else {
          send(IpcMainSend.Message, {
            type: "error",
            message: `${baseName}의 썸네일을 찾지 못했습니다.`,
          });
        }
      } catch (error) {
        console.error(error);
        if ((error as Error)?.name === "TimeoutError") {
          send(IpcMainSend.Message, {
            type: "error",
            message: `${baseName}의 썸네일을 찾지 못했습니다.`,
          });
        } else {
          send(IpcMainSend.Message, {
            type: "error",
            message: `${baseName}의 썸네일을 다운로드 하던 도중 오류가 발생했습니다.`,
            description: (error as Error).stack,
          });
        }
      } finally {
        send(IpcMainSend.ThumbnailDone, filePath);
        await page.close();
      }
    } catch (error) {
      send(IpcMainSend.ThumbnailDone, filePath);
      send(IpcMainSend.Message, {
        type: "error",
        message: "썸네일을 다운로드하는 도중 오류가 발생했습니다.",
        description: (error as Error).stack,
      });
    }
  }
);

ipcMain.on(
  IpcRendererSend.ThumbnailDelete,
  async (e, thumbnailFilePath: string) => {
    try {
      await rm(thumbnailFilePath);
      send(IpcMainSend.ThumbnailDone, thumbnailFilePath);
      send(IpcMainSend.Message, {
        type: "success",
        message: `${thumbnailFilePath} 파일을 삭제했습니다.`,
      });
    } catch (error) {
      send(IpcMainSend.Message, {
        type: "error",
        message: `${thumbnailFilePath} 삭제에 실패했습니다.`,
        description: (error as Error).stack,
      });
    }
  }
);
