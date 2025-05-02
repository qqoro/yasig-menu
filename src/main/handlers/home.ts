import chokidar from "chokidar";
import { createHash } from "crypto";
import { app, shell } from "electron";
import fg from "fast-glob";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import { extname, join } from "path";
import { COMPRESS_FILE_TYPE } from "../constants.js";
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
  async (e, { sources, exclude, thumbnailFolder, hideZipFile }) => {
    console.time("getListData");
    const list = await getListData({
      sources,
      exclude,
      thumbnailFolder,
      hideZipFile,
    });
    console.timeEnd("getListData");

    send(IpcMainSend.LoadedList, list);
  }
);

ipcMain.on(IpcRendererSend.CleanCache, async () => {
  try {
    const cacheDir = join(app.getPath("userData"), ".cache");

    const files = await readdir(cacheDir);
    files.forEach((file) => rm(join(cacheDir, file)));

    send(IpcMainSend.Message, {
      type: "success",
      message: "성공적으로 캐시를 삭제했습니다.",
    });
  } catch (error) {
    send(IpcMainSend.Message, {
      type: "error",
      message: "캐시를 삭제하던 중 오류가 발생했습니다.",
      description: (error as Error).stack,
    });
  }
});

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
      message: `게임 실행에 실패했습니다.`,
      description: (error as Error).stack,
    });
  }
});

ipcMain.on(IpcRendererSend.OpenFolder, (e, filePath: string) => {
  shell.showItemInFolder(filePath);
});

const cacheDir = join(app.getPath("userData"), ".cache");

const createCacheKey = ({
  sources,
  exclude,
  thumbnailFolder,
  hideZipFile,
}: {
  sources: string[];
  exclude: string[];
  thumbnailFolder?: string;
  hideZipFile: boolean;
}): string => {
  return createHash("md5")
    .update(JSON.stringify({ sources, exclude, thumbnailFolder, hideZipFile }))
    .digest("hex");
};

/**
 * 캐시 유효성 검사, 이 값이 `true`인 경우 캐시를 재생성 해야 함.
 *
 * @param sources 파일, 썸네일 경로들
 * @param cacheKey 캐시 키
 * @returns 캐시 유효성 검사 결과
 */
const checkCacheDirty = async (
  sources: (string | undefined)[],
  cacheKey: string
) => {
  try {
    const cacheFilePath = join(cacheDir, `${cacheKey}.json`);
    const [cacheInfo, ...sourcesInfo] = await Promise.all(
      ([cacheFilePath, ...sources.filter((v) => !!v)] as string[]).map((path) =>
        stat(path)
      )
    );

    return (
      cacheInfo.mtimeMs <=
      Math.max(...sourcesInfo.map((source) => source.mtimeMs))
    );
  } catch (error) {
    console.log("cache load fail!", error);
    return true;
  }
};

/**
 * 캐시 키 이름으로 json 파일 생성
 *
 * @param key 캐시 파일 명
 * @param data 저장할 데이터
 */
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

/**
 * 캐시 데이터를 불러옴
 *
 * @param key 캐시 파일명
 * @returns 캐시 데이터
 */
const loadFromCache = async (key: string): Promise<GameData[] | null> => {
  const cacheFile = join(cacheDir, `${key}.json`);

  try {
    // 파일 존재 여부 먼저 확인
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
  hideZipFile,
}: {
  sources: string[];
  exclude: string[];
  thumbnailFolder?: string;
  hideZipFile: boolean;
}): Promise<GameData[]> => {
  // 중복 제거 및 유효한 경로 필터링
  const cacheKey = createCacheKey({
    sources,
    exclude,
    thumbnailFolder,
    hideZipFile,
  });

  const isCacheDirty = await checkCacheDirty(
    [...sources, thumbnailFolder],
    cacheKey
  );

  // 캐시 상태 확인 및 캐시 로드 시도
  if (!isCacheDirty) {
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
  ).flat();

  const list: DirentLike[] = [];
  for (const entry of allFiles) {
    // 제외 파일 체크
    if (exclude.includes(entry.path.replaceAll("/", "\\"))) {
      continue;
    }

    // zip 파일 제외 여부 확인 후 파일 타입 검사
    if (
      hideZipFile &&
      entry.dirent.isFile() &&
      COMPRESS_FILE_TYPE.some((ext) => entry.path.toLowerCase().endsWith(ext))
    ) {
      continue;
    }

    list.push({
      name: entry.name,
      parentPath: entry.path
        .substring(0, entry.path.length - entry.name.length - 1)
        .replaceAll("/", "\\"),
      isFile: () => entry.dirent.isFile(),
      isDirectory: () => entry.dirent.isDirectory(),
    });
  }

  // 썸네일 찾기
  const processedList: GameData[] = findThumbnails(list);

  // 결과 캐싱 및 상태 플래그 업데이트
  // 성능을 위해 파일 작업은 데이터 먼저 전달한 뒤 내부적으로 처리
  saveToCache(cacheKey, processedList).then(() => {
    console.log("데이터 재생성 및 캐싱 완료");
  });

  return processedList;
};
