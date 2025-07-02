import chalk from "chalk";
import { rmSync } from "fs";
import { join } from "path";
import { build } from "vite";
import compileTs from "./private/tsc.js";
const { blueBright, greenBright } = chalk;

function buildRenderer() {
  return build({
    configFile: join(import.meta.dirname, "..", "vite.config.js"),
    base: "./",
    mode: "production",
  });
}

function buildMain() {
  const mainPath = join(import.meta.dirname, "..", "src", "main");
  return compileTs(mainPath);
}

rmSync(join(import.meta.dirname, "..", "build"), {
  recursive: true,
  force: true,
});

console.log(blueBright("Transpiling renderer & main..."));

Promise.allSettled([buildRenderer(), buildMain()]).then(() => {
  console.log(
    greenBright(
      "Renderer & main successfully transpiled! (ready to be built with electron-builder)",
    ),
  );
});
