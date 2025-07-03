import * as chromeLauncher from "chrome-launcher";
import { app } from "electron";
import { rm, stat, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import puppeteer, { Browser, Page } from "puppeteer-core";
import { setTimeout } from "timers/promises";
import { GoogleCollector } from "../collectors/google-collector.js";
import { findCollector } from "../collectors/registry.js";
import { db } from "../db/db-manager.js";
import { IpcMainEventMap, IpcMainSend, IpcRendererSend } from "../events.js";
import { console, ipcMain, send } from "../main.js";
import { loadSetting } from "./setting.js";

let browser: Browser | undefined;
let cookieInit = false;

app.on("window-all-closed", async function () {
  await browser?.close();
  browser = undefined;
});

ipcMain.on(
  IpcRendererSend.ThumbnailDownload,
  async (e, id, { path: filePath, file, url }) => {
    let page: Page | undefined;
    const { cookie, search, changeThumbnailFolder, newThumbnailFolder } =
      await loadSetting();
    const savePath = changeThumbnailFolder ? newThumbnailFolder : filePath;

    const fileInfo = await stat(filePath);
    const baseName = basename(filePath);
    const fileName = baseName.substring(
      0,
      fileInfo.isFile()
        ? baseName.length - extname(baseName).length
        : baseName.length,
    );

    try {
      console.log("download requested!", filePath);

      // 썸네일 직접 업로드
      if (file) {
        const { data, ext } = file;

        const thumbnailName = changeThumbnailFolder
          ? join(savePath, fileName) + ext
          : await getThumbnailName({
              filePath,
              thumbnailExt: ext,
            });
        await writeFile(thumbnailName, Buffer.from(data));
        return;
      }

      // 썸네일 주소 직접 업로드
      if (url) {
        const thumbnailExt = extname(url.substring(0, url.indexOf("?")));
        const thumbnailName = changeThumbnailFolder
          ? join(savePath, fileName) + thumbnailExt
          : await getThumbnailName({
              filePath,
              thumbnailExt,
            });
        await saveFromUrl({ fileName: thumbnailName, imgUrl: url });
        return;
      }

      let downloaded = false;
      let message: undefined | IpcMainEventMap[IpcMainSend.Message][1] =
        undefined;

      // TODO: 그냥 return 하는거 전부 바꿔야 함.
      const data = await findCollector(filePath);
      if (data) {
        const { id: gameId, collector } = data;
        const info = await collector.fetchInfo({ path: filePath, id: gameId });
        if (info?.thumbnail === undefined) {
          return;
        }

        // DLSite 다운로드
        if (collector.name === "DLSite") {
          const thumbnailExt = extname(info.thumbnail);
          const thumbnailName = changeThumbnailFolder
            ? join(savePath, fileName) + thumbnailExt
            : await getThumbnailName({
                filePath,
                thumbnailExt,
              });
          await saveFromUrl({
            fileName: thumbnailName,
            imgUrl: info.thumbnail,
          });
          downloaded = true;
        }

        // Steam 다운로드
        if (!downloaded && collector.name === "Steam") {
          const info = await collector.fetchInfo({
            path: filePath,
            id: gameId,
          });
          if (info?.thumbnail === undefined) {
            return;
          }

          // 스팀 주소에 붙어있는 파라미터 제거
          const index = info.thumbnail.indexOf("?t=");
          info.thumbnail = info.thumbnail.substring(0, index);

          const thumbnailExt = extname(info.thumbnail);
          const thumbnailName = changeThumbnailFolder
            ? join(savePath, fileName) + thumbnailExt
            : await getThumbnailName({
                filePath,
                thumbnailExt,
              });
          await saveFromUrl({
            fileName: thumbnailName,
            imgUrl: info.thumbnail,
          });
          downloaded = true;
        }
      }

      // 구글 검색 다운로드
      if (!downloaded) {
        browser = await initBrowser();

        if (!browser) {
          send(IpcMainSend.Message, id, {
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

        if (!cookieInit) {
          const cookie = await getNewCookie();
          await browser.setCookie({
            name: "NID",
            domain: ".google.com",
            value: cookie ?? "",
          });
          cookieInit = true;
        }

        page = await browser.newPage();

        const query = [search[0], fileName, search[1]].join(" ");
        const info = await GoogleCollector.fetchInfo({
          path: filePath,
          id: query,
          page,
        });
        if (info?.thumbnail === undefined) {
          return;
        }

        if (!info.thumbnail.startsWith("data:")) {
          const thumbnailExt = getUrlExtension(info.thumbnail);
          const thumbnailName = changeThumbnailFolder
            ? join(savePath, fileName) + thumbnailExt
            : await getThumbnailName({
                filePath,
                thumbnailExt,
              });
          await saveFromUrl({
            fileName: thumbnailName,
            imgUrl: info.thumbnail,
          });
          downloaded = true;
        } else {
          const thumbnailExt =
            "." +
            info.thumbnail.substring(
              info.thumbnail.indexOf("/") + 1,
              info.thumbnail.indexOf(";"),
            );
          const thumbnailName = changeThumbnailFolder
            ? join(savePath, fileName) + thumbnailExt
            : await getThumbnailName({
                filePath,
                thumbnailExt,
              });
          await saveFromBase64({
            fileName: thumbnailName,
            data: info.thumbnail.substring(info.thumbnail.indexOf(",") + 1),
          });
          downloaded = true;
        }

        // TODO: 콜렉터 구현이 달라서 한번에 여러개의 소스를 가져오기가 어려움..
        // const [src, bestSrc] = await getFromGoogle({ page, query });
        // try {
        //   if (bestSrc) {
        //     const thumbnailExt = getUrlExtension(bestSrc);
        //     const thumbnailName = changeThumbnailFolder
        //       ? join(savePath, fileName) + thumbnailExt
        //       : await getThumbnailName({
        //           filePath,
        //           thumbnailExt,
        //         });
        //     console.log(
        //       "download best src >>>",
        //       fileName,
        //       thumbnailName,
        //       thumbnailExt,
        //       "||",
        //       bestSrc,
        //     );
        //     await saveFromUrl({
        //       fileName: thumbnailName,
        //       imgUrl: bestSrc,
        //     });
        //     downloaded = true;
        //   }
        //   if (!downloaded && src) {
        //     const thumbnailExt =
        //       "." + src.substring(src.indexOf("/") + 1, src.indexOf(";"));
        //     const thumbnailName = changeThumbnailFolder
        //       ? join(savePath, fileName) + thumbnailExt
        //       : await getThumbnailName({
        //           filePath,
        //           thumbnailExt,
        //         });
        //     await saveFromBase64({
        //       fileName: thumbnailName,
        //       data: src.substring(src.indexOf(",") + 1),
        //     });
        //     downloaded = true;
        //   }
        // } catch (error) {
        //   console.error("thumbnail highest quality download fail", error);
        //   if (src) {
        //     message = {
        //       type: "info",
        //       message:
        //         "이미지 원본 사이트 접속에 문제가 있어 최고 품질의 이미지를 다운로드 받지 못했습니다.",
        //       description:
        //         "사이트 접속 차단으로 인해 다운로드 받지 못했을 가능성이 높습니다. cloudflare의 WARP나 goodbyedpi등을 사용해보세요.",
        //     };
        //     console.log("src", src);
        //     const thumbnailExt =
        //       "." + src.substring(src.indexOf("/") + 1, src.indexOf(";"));
        //     const thumbnailName = changeThumbnailFolder
        //       ? join(savePath, fileName) + thumbnailExt
        //       : await getThumbnailName({
        //           filePath,
        //           thumbnailExt,
        //         });
        //     await saveFromBase64({
        //       fileName: thumbnailName,
        //       data: src.substring(src.indexOf(",") + 1),
        //     });
        //     downloaded = true;
        //   }
        // }
      }

      if (downloaded) {
        send(
          IpcMainSend.Message,
          id,
          message ?? {
            type: "success",
            message: `${baseName}의 썸네일을 다운로드 했습니다.`,
          },
        );
      } else {
        send(IpcMainSend.Message, id, {
          type: "error",
          message: `${baseName}의 썸네일을 찾지 못했습니다.`,
        });
      }
    } catch (error) {
      console.error(error);
      if ((error as Error)?.name === "TimeoutError") {
        send(IpcMainSend.Message, id, {
          type: "error",
          message: `${baseName}의 썸네일을 찾지 못했습니다.`,
        });
      } else {
        send(IpcMainSend.Message, id, {
          type: "error",
          message: `${baseName}의 썸네일을 다운로드 하던 도중 오류가 발생했습니다.`,
          description: (error as Error).stack,
        });
      }
    } finally {
      send(IpcMainSend.ThumbnailDone, id, filePath);
      await page?.close();
    }
  },
);

ipcMain.on(
  IpcRendererSend.ThumbnailDelete,
  async (e, id, thumbnailFilePath: string) => {
    try {
      await rm(thumbnailFilePath);
      send(IpcMainSend.ThumbnailDone, id, thumbnailFilePath);
      send(IpcMainSend.Message, id, {
        type: "success",
        message: `${thumbnailFilePath} 파일을 삭제했습니다.`,
      });
    } catch (error) {
      send(IpcMainSend.Message, id, {
        type: "error",
        message: `${thumbnailFilePath} 삭제에 실패했습니다.`,
        description: (error as Error).stack,
      });
    }
  },
);

async function initBrowser() {
  if (browser) {
    return browser;
  }

  const list = chromeLauncher.Launcher.getInstallations();
  for (const path of list) {
    console.log("executablePath:", process.env.NODE_ENV, path);
    browser ??= await puppeteer.launch({
      headless: app.isPackaged,
      executablePath: path,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    if (browser.connected) {
      break;
    }
  }

  return browser;
}

function getUrlExtension(url: string) {
  let newURL = extname(url);
  const hasQuery = newURL.indexOf("?");
  if (hasQuery >= 0) {
    newURL = newURL.substring(0, hasQuery);
  }
  const hasId = newURL.indexOf("#");
  if (hasId >= 0) {
    newURL = newURL.substring(0, hasId);
  }
  return newURL;
}

async function getThumbnailName({
  filePath,
  thumbnailExt,
}: {
  filePath: string;
  thumbnailExt: string;
}) {
  const info = await stat(filePath); // /path/to/file.exe or /path/to/folder
  const baseName = basename(filePath); // file.exe
  const fileName = baseName.substring(
    0,
    baseName.length - extname(baseName).length,
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
  const response = await fetch(imgUrl);
  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer);

  const type = response.headers.get("Content-Type");
  if (!/\.(.{3,4})$/i.test(fileName) && type?.startsWith("image")) {
    const ext = type.split("/").at(-1);
    fileName += `.${ext}`;
  }

  return await writeFile(fileName, data, {
    encoding: "base64",
  });
}

async function waitAndClick(page: Page, selector: string) {
  await setTimeout(300);
  await page.waitForSelector(selector);
  await page.$$eval(selector, (el) => (el[0] as HTMLElement)?.click());
}

export async function getNewCookie() {
  browser = await initBrowser();

  if (!browser) return;

  const page = await browser.newPage();
  await page.goto("https://www.google.com/preferences?hl=ko&fg=1");

  // 국가 설정
  await waitAndClick(
    page,
    "body > div:nth-child(2) > div.iORcjf > div.LFAdvb > g-menu > g-menu-item:nth-child(2)",
  );
  await waitAndClick(
    page,
    "body > div:nth-child(2) > div.iORcjf > div:nth-child(2) > div:nth-child(2) > div.HrFxGf > div > div > div",
  );
  await waitAndClick(
    page,
    "body > div.iORcjf > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div.HrqWPb",
  );
  await waitAndClick(
    page,
    "#lb > div > div.mcPPZ.nP0TDe.xg7rAe.ivkdbf > span > div > g-menu > g-menu-item:nth-child(2)",
  );
  await waitAndClick(
    page,
    "#lb > div > div.mcPPZ.nP0TDe.xg7rAe.ivkdbf > span > div > div.JhVSze > span:nth-child(2)",
  );

  // 세이프서치 설정
  await page.goto("https://www.google.com/preferences?hl=ko&fg=1");
  await waitAndClick(
    page,
    "body > div:nth-child(2) > div.iORcjf > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div > div > div",
  );
  await waitAndClick(
    page,
    "body > div.GSpaEb > div:nth-child(2) > g-radio-button-group > div:nth-child(6)",
  );

  const cookies = await browser.cookies();

  const targetCookie = cookies.find((cookie) => cookie.name === "NID");
  if (!targetCookie) {
    return;
  }

  await page.close();

  await db("setting").update({ cookie: JSON.stringify(targetCookie.value) });
  return targetCookie.value;
}
