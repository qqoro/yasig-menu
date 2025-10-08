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

    // 작품 정보란 찾기
    const softTable = body.getElementById("soft_table");
    const softTitle = body.getElementById("soft-title");
    const softInfoRows = softTable
      ? softTable.children[1].querySelector("table")?.children
      : softTitle?.parentNode.parentNode.parentNode.children;

    // 섬네일 정보 수집
    const src = softTable
      ? softTable
          .querySelectorAll("a")
          .filter((e) => e.classList.contains("highslide"))[0]
          .getAttribute("href")
      : softInfoRows
          ?.filter((e) =>
            e.querySelector("a")?.classList.contains("highslide"),
          )[0]
          .querySelector("a")
          ?.getAttribute("href");
    const thumbnail = src
      ? new URL(src, "https://www.getchu.com").href
      : undefined;
    console.log(src);
    console.log(thumbnail);

    // 제목 수집
    const collectorTitle = softTitle?.childNodes
      .filter((n) => n.nodeType === 3)[0]
      .textContent.trim();

    // 발매일 수집
    const publishDateRow = softInfoRows?.filter((e) =>
      e.textContent.trim().startsWith("発売日："),
    )[0];
    const date = dayjs(publishDateRow?.children[1].textContent.trim());
    const publishDate = date.isValid() ? date.toDate() : new Date();

    // 제작사 수집
    const makerRow = softInfoRows?.filter(
      (e) =>
        e.textContent.trim().startsWith("サークル：") ||
        e.textContent.trim().startsWith("ブランド："),
    )[0];
    const brandsite = makerRow?.getElementById("brandsite");
    const makerName = brandsite
      ? brandsite.textContent.trim()
      : makerRow?.children[1].firstChild?.textContent.trim();

    // 카테고리 수집
    // TODO: 구조가 복잡해서 나중에 구현 가능할지 판단
    // サブジャンル 열의 각 a 태그에서 href 속성의 sub_genre_id의 값을 보고 가져올 수 있을 것 같음
    const category = "";

    // 태그 수집
    const tagsRow = softInfoRows?.filter((e) =>
      e.textContent.trim().startsWith("カテゴリ："),
    )[0];
    const tags =
      tagsRow?.children[1].children.slice(0, -1).map((e) => ({
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
