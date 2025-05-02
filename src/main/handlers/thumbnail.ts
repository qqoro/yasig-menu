import * as chromeLauncher from "chrome-launcher";
import { app } from "electron";
import { rm, stat, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import puppeteer, { Browser, Page } from "puppeteer-core";
import { IpcMainEventMap, IpcMainSend, IpcRendererSend } from "../events.js";
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
      page = await browser.newPage();

      let downloaded = false;
      let message: undefined | IpcMainEventMap[IpcMainSend.Message][0] =
        undefined;

      // DLSite 다운로드
      const regexResult = /[RBV]J\d{6,8}/i.exec(fileName);
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

      // 구글 검색 다운로드
      if (!downloaded) {
        const query = [search[0], fileName, search[1]].join(" ");
        const [src, bestSrc] = await getFromGoogle({ page, query });
        try {
          if (bestSrc) {
            const thumbnailExt = getUrlExtension(bestSrc);
            const thumbnailName = savePath
              ? join(savePath, fileName) + thumbnailExt
              : await getThumbnailName({
                  filePath,
                  thumbnailExt,
                });
            await saveFromUrl({
              fileName: thumbnailName,
              imgUrl: bestSrc,
            });
            downloaded = true;
          }
          if (!downloaded && src) {
            const thumbnailExt =
              "." + src.substring(src.indexOf("/") + 1, src.indexOf(";"));
            const thumbnailName = savePath
              ? join(savePath, fileName) + thumbnailExt
              : await getThumbnailName({
                  filePath,
                  thumbnailExt,
                });
            await saveFromBase64({
              fileName: thumbnailName,
              data: src.substring(src.indexOf(",") + 1),
            });
            downloaded = true;
          }
        } catch (error) {
          console.error("thumbnail highest quality download fail", error);
          if (src) {
            message = {
              type: "info",
              message:
                "이미지 원본 사이트 접속에 문제가 있어 최고 품질의 이미지를 다운로드 받지 못했습니다.",
              description:
                "사이트 접속 차단으로 인해 다운로드 받지 못했을 가능성이 높습니다. cloudflare의 WARP나 goodbyedpi등을 사용해보세요.",
            };
            console.log("src", src);
            const thumbnailExt =
              "." + src.substring(src.indexOf("/") + 1, src.indexOf(";"));
            const thumbnailName = savePath
              ? join(savePath, fileName) + thumbnailExt
              : await getThumbnailName({
                  filePath,
                  thumbnailExt,
                });
            await saveFromBase64({
              fileName: thumbnailName,
              data: src.substring(src.indexOf(",") + 1),
            });
            downloaded = true;
          }
        }
      }

      if (downloaded) {
        send(
          IpcMainSend.Message,
          message ?? {
            type: "success",
            message: `${baseName}의 썸네일을 다운로드 했습니다.`,
          }
        );
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
  const src = await page.$$eval("#center_col img", (imgs) => {
    imgs[0].click();
    return imgs[0].getAttribute("src");
  });
  try {
    await page.waitForSelector("img.sFlh5c.FyHeAf.iPVvYb", { timeout: 10000 });
    const higherImage = await page.$$eval(
      "img.sFlh5c.FyHeAf.iPVvYb",
      (imgs) => {
        return imgs[0].getAttribute("src");
      }
    );

    return [src, higherImage];
  } catch {
    return [src];
  }
}

interface DLSiteProductInfo {
  site_id: string;
  maker_id: string;
  age_category: number;
  affiliate_deny: number;
  dl_count: number;
  wishlist_count: number;
  dl_format: number;
  rate_average: number;
  rate_average_2dp: number;
  rate_average_star: number;
  rate_count: number;
  review_count: number;
  price: number;
  price_without_tax: number;
  price_str: string;
  default_point_rate: number;
  default_point: number;
  product_point_rate: any;
  dlsiteplay_work: boolean;
  is_ana: boolean;
  is_sale: boolean;
  on_sale: number;
  is_discount: boolean;
  is_pointup: boolean;
  gift: any[];
  is_rental: boolean;
  work_rentals: any[];
  upgrade_min_price: number;
  down_url: string;
  is_tartget: any;
  title_id: any;
  title_name: any;
  title_name_masked: any;
  title_volumn: any;
  title_work_count: any;
  is_title_completed: boolean;
  bulkbuy_key: any;
  bonuses: any[];
  is_limit_work: boolean;
  is_sold_out: boolean;
  limit_stock: number;
  is_reserve_work: boolean;
  is_reservable: boolean;
  is_timesale: boolean;
  timesale_stock: number;
  is_free: boolean;
  is_oly: boolean;
  is_led: boolean;
  is_noreduction: boolean;
  is_wcc: boolean;
  work_name: string;
  work_name_masked: string;
  work_image: string;
  sales_end_info: any;
  voice_pack: any;
  regist_date: string;
  work_type: string;
  book_type: any;
  discount_calc_type: any;
  is_pack_work: boolean;
  limited_free_terms: any[];
  official_price: number;
  options: string;
  custom_genres: string[];
  dl_count_total: number;
  dl_count_items: any[];
  default_point_str: string;
}

async function getFromDLSite({ page, rjCode }: { page: Page; rjCode: string }) {
  rjCode = rjCode.toUpperCase();
  const data = (await fetch(
    `https://www.dlsite.com/maniax/product/info/ajax?product_id=${rjCode}&cdn_cache_min=1`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        priority: "u=1, i",
        "sec-ch-ua": '"Chromium";v="134", "Whale";v="4", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        Referer: `https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  ).then((res) => res.json())) as Record<typeof rjCode, DLSiteProductInfo>;
  if (data?.[rjCode]?.work_image) {
    return "https:" + data[rjCode].work_image;
  }

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
