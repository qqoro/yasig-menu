import { Collector } from "./registry.js";

export interface SteamApiResponse {
  [appId: string]: {
    success: boolean;
    data:
      | {
          name: string;
          release_date: {
            coming_soon: boolean;
            date: string;
          };
          developers: string[];
          genres: {
            id: string;
            description: string;
          }[];
          header_image: string;
          screenshots: {
            id: number;
            path_thumbnail: string;
            path_full: string;
          }[];
        }
      | undefined;
  };
}

export interface SteamSpyApiResponse {
  appid: number;
  name: string | null | undefined;
  developer: string | undefined;
  tags: Record<string, number> | [];
}

export const SteamCollector: Collector = {
  name: "Steam",
  getId: async (path: string) => {
    if (!path.toLowerCase().includes("steam")) {
      return;
    }

    return /\d{4,7}/g.exec(path)?.[0] ?? undefined;
  },

  fetchInfo: async ({ path, id }) => {
    const [steam, spy] = await Promise.all([
      (async () => {
        const res = await fetch(
          `https://store.steampowered.com/api/appdetails?appids=${id}&l=korean`,
        );
        return (await res.json()) as SteamApiResponse | null;
      })(),
      (async () => {
        const res = await fetch(
          `https://steamspy.com/api.php?request=appdetails&appid=${id}`,
        );
        return (await res.json()) as SteamSpyApiResponse;
      })(),
    ]);

    if (!steam?.[id]?.success && spy?.name === null) {
      return undefined;
    }

    spy.name = spy.name === null ? undefined : spy.name;
    spy.developer = spy.developer === "" ? undefined : spy.developer;

    const info = steam?.[id]?.data;
    const tags = Array.isArray(spy.tags)
      ? []
      : Object.keys(spy.tags).map((tagName) => ({
          id: spy.tags[tagName].toString(),
          name: tagName,
        }));

    return {
      path: path,
      collectorTitle: info?.name ?? spy.name,
      thumbnail: info?.header_image,
      publishDate: info?.release_date?.date
        ? new Date(
            info.release_date.date.replace(/년 |월 |일/g, (m) =>
              m === "년 " ? "-" : m === "월 " ? "-" : "",
            ),
          )
        : undefined,
      makerName:
        (Array.isArray(info?.developers) ? info.developers[0] : undefined) ??
        spy.developer,
      category: Array.isArray(info?.genres)
        ? info?.genres[0].description
        : undefined,
      tags: tags,
    };
  },
};
