import dayjs from "dayjs";
import { parse } from "node-html-parser";
import { Collector } from "./registry.js";

export const CienCollector: Collector = {
  name: "Ci-en",
  getId: async (path) => {
    const id = /(?:CE|CIEN|CI-EN)(\d+-\d+|(creator)?\d+article\d+)/i
      .exec(path)?.[1]
      ?.replace("creator", "")
      .replace("article", "-");
    return id;
  },
  fetchInfo: async ({ id }) => {
    const [creatorId, articleId] = id
      .split("-")
      .map((s) => s.replace(/^0+/, ""));
    const html = await fetch(
      `https://ci-en.net/creator/${creatorId}/article/${articleId}`,
    ).then((res) => res.text());

    const body = parse(html, {
      blockTextElements: {
        script: false,
        noscript: false,
        style: false,
        pre: false,
      },
    });

    // 게시물 찾기
    const article = body.getElementById(`article-${articleId}`);

    // 섬네일 정보 수집
    const image = article?.querySelector(".file-player-image-wrapper")
      ?.children[0].children[0];
    const thumbnail = image?.getAttribute("src");

    // 제목 수집
    const collectorTitle =
      article?.querySelector(".article-title")?.textContent;

    // 발매일 수집
    const publishDateString =
      article?.parentNode.parentNode.querySelector(".e-date")?.innerText;
    const date = dayjs(publishDateString);
    const publishDate = date.isValid() ? date.toDate() : new Date();

    // 제작사 수집
    const makerName =
      article?.parentNode.parentNode.querySelector(".e-userName")?.innerText;

    // 카테고리 X
    const category = undefined;

    // 태그 X
    const tags = undefined;

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
