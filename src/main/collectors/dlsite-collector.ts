import dayjs from "dayjs";
import { parse } from "node-html-parser";
import { Collector } from "./registry.js";

export const DLSiteCollector: Collector = {
  name: "DLSite",
  getId: async (path) => {
    const rjCode = /[RBV]J\d{6,8}/i.exec(path)?.[0];
    return rjCode;
  },
  fetchInfo: async ({ id }) => {
    const html = await fetch(
      `https://www.dlsite.com/maniax/work/=/product_id/${id}.html`,
      {
        headers: {
          cookie: "locale=ko-kr",
        },
      },
    ).then((res) => res.text());

    const body = parse(html, {
      blockTextElements: {
        script: false,
        noscript: false,
        style: false,
        pre: false,
      },
    });

    const title = body.querySelector("#work_name")?.textContent;
    const src = body
      .querySelector("#work_left .product-slider-data > div")
      ?.getAttribute("data-src");
    const thumbnail = src ? "https:" + src : undefined;
    const date = dayjs(
      body.querySelector("#work_outline > tr:nth-child(1) > td > a")
        ?.textContent ?? null,
      `YYYY년 MM월 DD일`,
    );
    const publishDate = date.isValid() ? date.toDate() : new Date();
    const maker = body.querySelector("#work_maker > tr > td > span > a");
    const makerName = maker?.textContent ?? "";

    const category =
      body.querySelector("#category_type > a:nth-child(1) > span")
        ?.textContent ?? "";
    const tags =
      body
        .querySelector(".main_genre")
        ?.querySelectorAll("a")
        .filter((e) => /genre\/(\d+)\/from/.test(e.getAttribute("href") ?? ""))
        .map((e) => ({
          id: /genre\/(\d+)\/from/.exec(e.getAttribute("href") ?? "")![1],
          name: e.textContent,
        })) ?? [];

    return {
      title,
      thumbnail,
      publishDate,
      makerName,
      category,
      tags,
    };
  },
};
