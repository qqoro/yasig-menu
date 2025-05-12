import { parse } from "node-html-parser";

export async function loadInfo(id: string) {
  const html = await fetch(
    `https://www.dlsite.com/maniax/work/=/product_id/${id}.html`,
    {
      headers: {
        cookie: "locale=ko-kr",
      },
    }
  ).then((res) => res.text());

  const body = parse(html, {
    blockTextElements: {
      script: false,
      noscript: false,
      style: false,
      pre: false,
    },
  });

  const publishDate = body.querySelector(
    "#work_outline > tr:nth-child(1) > td > a"
  )?.textContent;
  const makerName = body.querySelector(
    "#work_maker > tr > td > span > a"
  )?.textContent;
  const genre = body.querySelector(".main_genre");
  const tags = genre?.querySelectorAll("a").map((e) => e.textContent);

  console.log("publishDate", publishDate);
  console.log("makerName", makerName);
  console.log("tags", tags);
}
