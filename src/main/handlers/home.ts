import chokidar from "chokidar";
import { createHash } from "crypto";
import { app, shell } from "electron";
import fg from "fast-glob";
import { mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import { extname, join } from "path";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { ipcMain, send } from "../main.js";

interface DirentLike {
  name: string;
  parentPath: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
}

export interface GameData {
  path: string;
  title: string;
  thumbnail?: string;
}

/**
 * 캐싱 및 파일 변경 감지 설정
 *
 * 썸네일이나, 폴더 경로, 파일 등이 변경되었을 경우 해당 값을 업데이트 해야 함
 *
 * - 파일 이름 변경, 추가, 삭제 시 : `isCacheDirty = true`
 * - 폴더 경로 변경 시 : `watcher`, `watcherSource` 업데이트
 */
export const config: {
  isCacheDirty: boolean;
  watcher: chokidar.FSWatcher | null;
  watcherSource: string[] | null;
  exclude: string[];
} = {
  isCacheDirty: true,
  watcher: null,
  watcherSource: null,
  exclude: [],
};

ipcMain.on(
  IpcRendererSend.LoadList,
  async (e, { sources, exclude, thumbnailFolder }) => {
    const { watcher, watcherSource } = config;

    // watcher가 없거나 경로가 변경 된 경우 기존 객체 정리 후 새로 적용
    const newWatcherSource = [...sources];
    if (thumbnailFolder) {
      newWatcherSource.push(thumbnailFolder);
    }
    newWatcherSource.sort();

    if (
      !watcher ||
      !watcherSource ||
      JSON.stringify(watcherSource) !== JSON.stringify(newWatcherSource)
    ) {
      if (watcher) {
        watcher.close();
      }

      config.isCacheDirty = true;
      config.watcherSource = [...sources];
      if (thumbnailFolder) {
        config.watcherSource.push(thumbnailFolder);
      }
      config.watcherSource.sort();
      console.log("watcherSource", config.watcherSource);
      // 파일 추가/삭제 이벤트 시 캐시 재생성 예약
      config.watcher = setupWatcher(config.watcherSource, () => {
        config.isCacheDirty = true;
      });
    }

    if (
      JSON.stringify(exclude.toSorted()) !==
      JSON.stringify(config.exclude.toSorted())
    ) {
      config.isCacheDirty = true;
      config.exclude = [...exclude];
    }

    const list = await getListData({ sources, exclude, thumbnailFolder });
    send(IpcMainSend.LoadedList, list);
  }
);

const exclude = ["notification_helper", "UnityCrashHandler64"];
ipcMain.on(IpcRendererSend.Play, async (e, filePath: string) => {
  try {
    const folderList = await readdir(filePath, { withFileTypes: true });
    for (const file of folderList) {
      if (
        file.isDirectory() ||
        !file.name.toLowerCase().endsWith(".exe") ||
        exclude.some((ex) => file.name.startsWith(ex.toLowerCase()))
      ) {
        continue;
      }

      const game = join(filePath, file.name);
      shell.openPath(game);
      send(IpcMainSend.Message, {
        type: "success",
        message: `${game} 파일을 실행했습니다. 잠시만 기다려주세요.`,
      });
      return;
    }
    send(IpcMainSend.Message, {
      type: "warning",
      message: "실행파일을 찾지 못했습니다. 폴더 열기를 사용해 실행해주세요.",
    });
  } catch (error) {
    if ((error as Error)?.message?.startsWith("ENOTDIR: not a directory")) {
      shell.openPath(join(filePath));
      return;
    }
    console.error("error!", error);
    send(IpcMainSend.Message, {
      type: "warning",
      message: (error as Error).stack ?? "",
    });
  }
});

ipcMain.on(IpcRendererSend.OpenFolder, (e, filePath: string) => {
  shell.showItemInFolder(filePath);
});

const cacheDir = join(app.getPath("userData"), ".cache");

const createCacheKey = (
  sources: string[],
  exclude: string[],
  thumbnailFolder?: string
): string => {
  return createHash("md5")
    .update(JSON.stringify({ sources, exclude, thumbnailFolder }))
    .digest("hex");
};

const saveToCache = async (
  key: string,
  data: Record<string, any>
): Promise<void> => {
  try {
    await mkdir(cacheDir, { recursive: true });
    const cacheFilePath = join(cacheDir, `${key}.json`);
    await writeFile(cacheFilePath, JSON.stringify(data), "utf8");
    console.log("데이터 캐시 저장 완료:", cacheFilePath);
  } catch (error) {
    console.error("캐시 저장 중 오류:", error);
  }
};

// 캐시 로드 함수
const loadFromCache = async (key: string): Promise<GameData[] | null> => {
  const cacheFile = join(cacheDir, `${key}.json`);
  try {
    // 파일 존재 여부 먼저 확인
    await stat(cacheFile);
    const data = await readFile(cacheFile, "utf8");
    console.log("캐시 파일 로드 성공:", cacheFile);
    return JSON.parse(data);
  } catch (error) {
    // 파일이 없거나 (ENOENT) 읽기 오류 시 null 반환
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`캐시 로드 중 오류 (${cacheFile}):`, error);
    }

    return null;
  }
};

// 파일 감지 및 플래그 설정
function setupWatcher(
  watchSources: string[],
  onPotentialChange: () => void
): chokidar.FSWatcher | null {
  if (watchSources.length === 0) {
    console.warn("감시할 유효한 소스 경로가 없습니다.");
    return null;
  }

  console.log("파일 변경 감시 시작:", watchSources);
  try {
    const watcher = chokidar.watch(watchSources, {
      persistent: true, // 앱 실행 동안 계속 감시
      ignoreInitial: true, // 초기 스캔 시 이벤트 발생 안 함
      ignorePermissionErrors: true, // 권한 오류 무시
      depth: 1, // 성능 위해 1로 제한. 어처피 파일/폴더이름과 썸네일만 확인하면 됨
      awaitWriteFinish: false, // 파일 변경완료를 기다리지 않음 (내용변경은 무시하기 때문에 괜찮을 듯)
    });

    // 파일 또는 디렉토리 추가/삭제 시
    watcher.on("add", (path) => {
      console.log(`파일 추가됨: ${path}. 캐시 무효화 예약됨.`);
      onPotentialChange();
    });
    watcher.on("addDir", (path) => {
      console.log(`디렉토리 추가됨: ${path}. 캐시 무효화 예약됨.`);
      onPotentialChange();
    });
    watcher.on("unlink", (path) => {
      console.log(`파일 삭제됨: ${path}. 캐시 무효화 예약됨.`);
      onPotentialChange();
    });
    watcher.on("unlinkDir", (path) => {
      console.log(`디렉토리 삭제됨: ${path}. 캐시 무효화 예약됨.`);
      onPotentialChange();
    });

    watcher.on("error", (error) => console.error(`Watcher error: ${error}`));
    watcher.on("ready", () => console.log("초기 스캔 완료. 변경 감시 중..."));

    process.on("SIGTERM", async () => {
      await watcher.close();
    });

    return watcher;
  } catch (error) {
    console.error("Watcher 생성 중 오류:", error);
    return null;
  }
}

function findThumbnails(
  files: DirentLike[]
): { path: string; title: string; thumbnail?: string }[] {
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".avif",
    ".svg",
  ];
  const result: { path: string; title: string; thumbnail?: string }[] = [];

  files.forEach((file) => {
    // 이미지 파일 인 경우 스킵
    const extension = extname(file.name).toLowerCase();
    if (imageExtensions.includes(extension)) {
      return;
    }

    const path = join(file.parentPath, file.name);
    const baseName = file.isFile()
      ? file.name.substring(0, file.name.length - extension.length)
      : file.name;

    // 모든 이미지 확장자 검사
    for (const imgExt of imageExtensions) {
      const thumbnail = `${baseName}${imgExt}`;

      const thumbnailFile = files.find(
        (file) => file.name.toLowerCase() === thumbnail.toLowerCase()
      );
      if (thumbnailFile) {
        result.push({
          path: join(file.parentPath, file.name),
          title: baseName,
          thumbnail: join(thumbnailFile.parentPath, thumbnail),
        });
        return;
      }
    }

    result.push({
      path,
      title: baseName,
      thumbnail: undefined,
    });
  });

  return result;
}

/**
 * 캐시된 데이터를 가져오거나, 캐시가 없거나 무효화된 경우 새로 생성합니다.
 */
const getListData = async ({
  sources,
  exclude,
  thumbnailFolder,
}: {
  sources: string[];
  exclude: string[];
  thumbnailFolder?: string;
}): Promise<GameData[]> => {
  // 중복 제거 및 유효한 경로 필터링
  const cacheKey = createCacheKey(sources, exclude, thumbnailFolder);

  // 캐시 상태 확인 및 캐시 로드 시도
  if (!config.isCacheDirty) {
    const cachedList = await loadFromCache(cacheKey);
    if (cachedList) {
      console.log("유효한 캐시 데이터 반환:", cacheKey);
      return cachedList;
    }
  }

  // 캐시가 없거나 무효화된 경우 데이터 재생성
  console.log("데이터 재생성 시작:", cacheKey);

  const allFiles = (
    await Promise.all(
      [...sources, ...(thumbnailFolder ? [thumbnailFolder] : [])].map(
        (source) =>
          fg(["*"], {
            cwd: source,
            onlyFiles: false,
            stats: true, // Dirent 정보 얻기 위해 필요
            objectMode: true,
            deep: 1,
            absolute: true, // cwd 기준 상대 경로 반환
          })
      )
    )
  )
    .flat()
    // 제외 경로 체크
    .filter((file) => !exclude.includes(file.path.replaceAll("/", "\\")))
    // DirentLike 객체로 변환
    .map((entry) => ({
      name: entry.name,
      parentPath: entry.path
        .substring(0, entry.path.length - entry.name.length - 1)
        .replaceAll("/", "\\"),
      isFile: () => entry.dirent.isFile(),
      isDirectory: () => entry.dirent.isDirectory(),
    }));

  // 썸네일 찾기
  const processedList = findThumbnails(allFiles);

  // 결과 캐싱 및 상태 플래그 업데이트
  // 성능을 위해 파일 작업은 데이터 먼저 전달한 뒤 내부적으로 처리
  saveToCache(cacheKey, processedList).then(() => {
    config.isCacheDirty = false; // 데이터 생성 및 캐싱 완료 후 플래그 리셋
    console.log("데이터 재생성 및 캐싱 완료. 변경 플래그: false.");
  });

  return processedList;
};
