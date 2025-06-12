import chalk from "chalk";
import { rmSync } from "fs";
import { join } from "path";
import { build } from "vite";
import compileTs from "./private/tsc.js";
const { blueBright, greenBright, yellowBright } = chalk;

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

// function copyMigrationFiles() {
//   const rootPath = join(import.meta.dirname, "..");
//   const sourceMigrationsPath = join(rootPath, "src", "main", "db", "migrations");
//   const buildPath = join(rootPath, "build", "main");
//   const destMigrationsPath = join(buildPath, "migrations");

//   try {
//     // migrations 폴더를 build/main/migrations로 복사
//     mkdirSync(destMigrationsPath, { recursive: true });
//     cpSync(sourceMigrationsPath, destMigrationsPath, { recursive: true });
//     console.log(yellowBright("마이그레이션 파일들이 번들에 포함되었습니다."));
//   } catch (error) {
//     console.error("마이그레이션 파일 복사 실패:", error);
//   }
// }

rmSync(join(import.meta.dirname, "..", "build"), {
  recursive: true,
  force: true,
});

console.log(blueBright("Transpiling renderer & main..."));

Promise.allSettled([buildRenderer(), buildMain()]).then(() => {
  // 마이그레이션 파일들 복사
  // copyMigrationFiles();

  console.log(
    greenBright(
      "Renderer & main successfully transpiled! (ready to be built with electron-builder)"
    )
  );
});
