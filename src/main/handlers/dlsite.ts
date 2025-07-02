import dayjs from "dayjs";
import { parse } from "node-html-parser";
import { db } from "../db/db-manager.js";

export async function loadInfo(id: string) {
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

  const date = dayjs(
    body.querySelector("#work_outline > tr:nth-child(1) > td > a")
      ?.textContent ?? null,
    `YYYY년 MM월 DD일`,
  );
  const publishDate = date.isValid() ? date.toDate() : null;
  const maker = body.querySelector("#work_maker > tr > td > span > a");
  const makerHref = maker?.getAttribute("href");
  const makerName = maker?.textContent;

  const category = body.querySelector(
    "#category_type > a:nth-child(1) > span",
  )?.textContent;
  const tags = body
    .querySelector(".main_genre")
    ?.querySelectorAll("a")
    .filter((e) => /genre\/(\d+)\/from/.test(e.getAttribute("href") ?? ""))
    .map((e) => ({
      id: /genre\/(\d+)\/from/.exec(e.getAttribute("href") ?? "")![1],
      name: e.textContent,
    }));

  // console.log("publishDate", publishDate);
  // console.log("makerHref", makerHref);
  // console.log("makerName", makerName);
  // console.log("category", category);
  // console.log("tags", tags);

  return {
    publishDate,
    makerHref,
    makerName,
    category,
    tags,
  };
}

export async function saveInfo(path: string, rjCode: string) {
  const { publishDate, makerName, category, tags } = await loadInfo(rjCode);

  const tx = await db.transaction();
  try {
    await tx("games")
      .update({
        publishDate,
        makerName,
        category,
        isLoadedInfo: true,
      })
      .where({ path });

    if (tags) {
      await tx("tags")
        .insert(tags?.map(({ id, name }) => ({ id, tag: name })))
        .onConflict()
        .ignore();
      await tx("gameTags").delete().where({ gamePath: path });
      await tx("gameTags")
        .insert(tags?.map((tag) => ({ gamePath: path, tagId: tag.id })))
        .onConflict()
        .ignore();
    }

    await tx.commit();
  } catch {
    await tx.rollback();
  }
}

// 개발용 전부 다시 로드코드
// await db("games").update({ isLoadedInfo: false }).whereNotNull("rjCode");
// TODO: 해당 내용을 자동으로 실행해야 함...
// const notLoadedGames = await db("games")
//   .select()
//   .where({ isLoadedInfo: false })
//   .whereNotNull("rjCode");
// try {
//   await Promise.all(
//     notLoadedGames.map((game) => saveInfo(game.path, game.rjCode!))
//   );
// } catch (error) {
//   console.error(error);
// }

// await loadInfo("RJ01241743");
