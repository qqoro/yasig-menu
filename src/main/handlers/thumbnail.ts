import * as chromeLauncher from "chrome-launcher";
import { app } from "electron";
import { rm, stat, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import puppeteer, { Browser, Page } from "puppeteer-core";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { ipcMain, send } from "../main.js";

import log from "electron-log";
const console = log;

let browser: Browser | undefined;

app.on("window-all-closed", async function () {
  await browser?.close();
  browser = undefined;
});

ipcMain.on(
  IpcRendererSend.ThumbnailDownload,
  async (e, { filePath, cookie, search, savePath }) => {
    let page: Page | undefined;

    const fileInfo = await stat(filePath);
    const baseName = basename(filePath);
    const fileName = baseName.substring(
      0,
      fileInfo.isFile()
        ? baseName.length - extname(baseName).length
        : baseName.length
    );

    try {
      console.log("download requested!", filePath);

      if (!browser) {
        const list = chromeLauncher.Launcher.getInstallations();
        for (const path of list) {
          console.log("executablePath:", process.env.NODE_ENV, path);
          browser ??= await puppeteer.launch({
            headless: true,
            executablePath: path,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
          if (browser.connected) {
            break;
          }
        }
      }

      if (!browser) {
        send(IpcMainSend.Message, {
          type: "error",
          message:
            "컴퓨터에 크롬이 설치되어 있지 않거나, 경로를 찾지 못했습니다. 크롬을 설치한 후 앱을 다시 실행해주세요.",
        });
        return;
      }

      await browser.setCookie({
        name: "NID",
        domain: ".google.com",
        value: cookie,
      });
      const page = await browser.newPage();

      let downloaded = false;

      const regexResult = /RJ\d{6,8}/i.exec(fileName);
      if (regexResult?.[0]) {
        const imgUrl = await getFromDLSite({
          page,
          rjCode: regexResult[0],
        });

        if (imgUrl) {
          const thumbnailExt = extname(imgUrl);
          const thumbnailName = savePath
            ? join(savePath, fileName) + thumbnailExt
            : await getThumbnailName({
                filePath,
                thumbnailExt,
              });
          await saveFromUrl({ fileName: thumbnailName, imgUrl });
          downloaded = true;
        }
      }

      if (!downloaded) {
        const query = [search[0], fileName, search[1]].join(" ");
        const base64Src = await getFromGoogle({ page, query });
        if (base64Src) {
          const thumbnailExt =
            "." +
            base64Src.substring(
              base64Src.indexOf("/") + 1,
              base64Src.indexOf(";")
            );
          const thumbnailName = savePath
            ? join(savePath, fileName) + thumbnailExt
            : await getThumbnailName({
                filePath,
                thumbnailExt,
              });
          await saveFromBase64({
            fileName: thumbnailName,
            data: base64Src.substring(base64Src.indexOf(",") + 1),
          });
          downloaded = true;
        }
      }

      if (downloaded) {
        send(IpcMainSend.Message, {
          type: "success",
          message: `${baseName}의 썸네일을 다운로드 했습니다.`,
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
      await page?.close();
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

async function getFromGoogle({ page, query }: { page: Page; query: string }) {
  const params = new URLSearchParams({
    q: query,
    udm: "2",
  });
  await page.goto("https://www.google.com/search?" + params);
  await page.waitForSelector("#center_col img", { timeout: 5000 });
  const src = await page.$$eval("#center_col img", (imgs) =>
    imgs[0].getAttribute("src")
  );

  return src;
}

async function getFromDLSite({ page, rjCode }: { page: Page; rjCode: string }) {
  await page.goto(
    `https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`
  );
  await page.waitForSelector(
    "#work_left div.slider_body_inner.swiper-container-initialized.swiper-container-horizontal > ul > li.slider_item.active > picture > img",
    { timeout: 5000 }
  );
  const src = await page.$$eval(
    "#work_left div.slider_body_inner.swiper-container-initialized.swiper-container-horizontal > ul > li.slider_item.active > picture > img",
    (imgs) => imgs[0].getAttribute("srcset")
  );

  return "https:" + src;
}

async function getThumbnailName({
  filePath,
  thumbnailExt,
}: {
  filePath: string;
  thumbnailExt: string;
}) {
  const info = await stat(filePath); // /path/to/file.exe
  const baseName = basename(filePath); // file.exe
  const fileName = baseName.substring(
    0,
    baseName.length - extname(baseName).length
  ); // file

  return [
    info.isFile()
      ? join(filePath.substring(0, filePath.length - baseName.length), fileName) // 경로만 + 파일 이름만 (확장자 제외)
      : filePath, // 전체 폴더 경로
    thumbnailExt,
  ].join("");
}

async function saveFromBase64({
  fileName,
  data,
}: {
  fileName: string;
  data: string;
}) {
  return await writeFile(fileName, data, {
    encoding: "base64",
  });
}

async function saveFromUrl({
  fileName,
  imgUrl,
}: {
  fileName: string;
  imgUrl: string;
}) {
  const arrayBuffer = await (await fetch(imgUrl)).arrayBuffer();
  const data = Buffer.from(arrayBuffer);

  return await writeFile(fileName, data, {
    encoding: "base64",
  });
}
