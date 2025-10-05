import dayjs from "dayjs";
import iconv from "iconv-lite";
import { parse } from "node-html-parser";
import { Collector } from "./registry.js";

export const GetchuCollector: Collector = {
  name: "Getchu",
  getId: async (path) => {
    const id = /GC\d{1,7}/i.exec(path)?.[0].slice(2);
    return id;
  },
  fetchInfo: async ({ id }) => {
    const html = await fetch(`https://www.getchu.com/soft.phtml?id=${id}`, {
      headers: {
        cookie: "getchu_adalt_flag=getchu.com",
      },
    }).then(async (res) =>
      iconv.decode(Buffer.from(await res.arrayBuffer()), "EUC-JP"),
    );

    const body = parse(html, {
      blockTextElements: {
        script: false,
        noscript: false,
        style: false,
        pre: false,
      },
    });

    const collectorTitle =
      body.querySelector("#soft-title")?.firstChild?.textContent;
    const src = body
      .querySelector("#soft_table tr:nth-child(1) a.highslide")
      ?.getAttribute("href");
    const thumbnail = src
      ? new URL(src, "https://www.getchu.com").href
      : undefined;
    const date = dayjs(
      body.querySelector(
        "#soft_table tr:nth-child(2) tr:nth-child(3) > td:nth-child(2) a",
      )?.textContent ?? null,
      `YYYY년 MM월 DD일`,
    );
    const publishDate = date.isValid() ? date.toDate() : new Date();
    const maker = body.querySelector("#brandsite");
    const makerName = maker?.textContent ?? "";

    const category = "";
    const tags =
      maker?.parentNode.parentNode.parentNode.children
        .filter((e) => e.children[0].textContent.startsWith("カテゴリ："))[0]
        .children[1].children.slice(0, -1)
        .map((e) => ({
          id: /category\[0\]=(.+)/.exec(e.getAttribute("href") ?? "")![1],
          name: e.textContent,
        })) ?? [];

    return {
      collectorTitle,
      thumbnail,
      publishDate,
      makerName,
      category,
      tags,
    };
  },
};
