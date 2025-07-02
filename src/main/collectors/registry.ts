import { db } from "../db/db-manager.js";
import { SteamCollector } from "./steam-collector.js";

export interface LoadedInfo {
  title: string | undefined;
  thumbnail: string | undefined;
  publishDate: Date | undefined;
  makerName: string | undefined;
  category: string | undefined;
  tags: { id: string; name: string }[] | undefined;
}

export interface Collector {
  name: string;
  getId: (path: string) => Promise<string | undefined>;
  fetchInfo: (path: string, id: string) => Promise<LoadedInfo | undefined>;
}

export const collectors: Collector[] = [SteamCollector];

export async function findCollector(path: string) {
  return (
    await Promise.all(
      collectors.map(async (collector) => ({
        collector,
        id: await collector.getId(path),
      })),
    )
  ).find((data) => !!data.id) as
    | { collector: Collector; id: string }
    | undefined;
}

export async function saveInfo(path: string, info: LoadedInfo) {
  const { publishDate, makerName, category, tags } = info;

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
