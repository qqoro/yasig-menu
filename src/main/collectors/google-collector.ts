import { basename } from "path";
import { Collector } from "./registry.js";

export const GoogleCollector: Collector = {
  name: "Google",

  getId: async (path) => {
    return basename(path);
  },

  fetchInfo: async ({ id, page }) => {
    if (!page) {
      return;
    }

    const params = new URLSearchParams({
      q: id,
      udm: "2",
    });
    await page.goto("https://www.google.com/search?" + params);
    await page.waitForSelector("#center_col img", { timeout: 5000 });
    const src = await page.$$eval("#center_col img", (imgs) => {
      imgs[0].click();
      return imgs[0].getAttribute("src");
    });

    try {
      await page.waitForSelector("img.sFlh5c.FyHeAf.iPVvYb", {
        timeout: 10000,
      });
      const higherImage = await page.$$eval(
        "img.sFlh5c.FyHeAf.iPVvYb",
        (imgs) => {
          return imgs[0].getAttribute("src");
        },
      );

      return {
        thumbnail: higherImage ?? undefined,
      };
    } catch {
      return {
        thumbnail: src ?? undefined,
      };
    }
  },
};
