import { Page } from "puppeteer-core";
import { db } from "../db/db-manager.js";
import { DLSiteCollector } from "./dlsite-collector.js";
import { SteamCollector } from "./steam-collector.js";

export interface LoadedInfo {
  title?: string;
  thumbnail?: string;
  publishDate?: Date;
  makerName?: string;
  category?: string;
  tags?: { id: string; name: string }[];
}

export interface Collector {
  name: string;
  getId: (path: string) => Promise<string | undefined>;
  fetchInfo: ({
    path,
    id,
    page,
  }: {
    path: string;
    id: string;
    page?: Page;
  }) => Promise<LoadedInfo | undefined>;
}

export const collectors: Collector[] = [
  DLSiteCollector,
  SteamCollector,
  // GoogleCollector,
];

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
