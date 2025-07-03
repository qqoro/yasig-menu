import { Collector } from "./registry.js";

export interface SteamApiResponse {
  [appId: string]: {
    success: boolean;
    data: {
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
    };
  };
}

export const SteamCollector: Collector = {
  name: "Steam",
  getId: async (path: string) => {
    if (!path.toLowerCase().includes("steam")) {
      return;
    }

    return /\d{3,7}/g.exec(path)?.[0] ?? undefined;
  },

  fetchInfo: async ({ path, id }) => {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${id}&l=korean`,
    );
    const json = (await res.json()) as SteamApiResponse;
    if (!json[id].success) {
      return undefined;
    }

    const info = json[id].data;

    return {
      path: path,
      collectorTitle: info.name,
      thumbnail: info.header_image ?? undefined,
      publishDate: info?.release_date?.date
        ? new Date(
            info.release_date.date.replace(/년 |월 |일/g, (m) =>
              m === "년 " ? "-" : m === "월 " ? "-" : "",
            ),
          )
        : undefined,
      makerName: Array.isArray(info.developers)
        ? info.developers[0]
        : undefined,
      category: Array.isArray(info.genres)
        ? info.genres[0].description
        : undefined,
      tags: undefined,
    };
  },
};
