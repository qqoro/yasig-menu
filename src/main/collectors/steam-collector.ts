import { Collector } from "./registry.js";

export const SteamCollector: Collector = {
  name: "Steam",
  getId: async (path: string) => {
    if (path.toLowerCase().includes("steam")) {
      return;
    }

    return /\d{3,7}/g.exec(path)?.[1] ?? undefined;
  },
  fetchInfo: async (path: string, id: string) => {
    // TODO: 작업 예정
    return {
      publishDate: null,
      makerName: null,
      category: null,
      tags: null,
    };
  },
};
