import { app, shell } from "electron";
import fg from "fast-glob";
import { readdir, rm, stat } from "fs/promises";
import { extname, join } from "path";
import { COMPRESS_FILE_TYPE } from "../constants.js";
import { db, Game, InsertGame } from "../db/db.js";
import { IpcMainSend, IpcRendererSend } from "../events.js";
import { ipcMain, send } from "../main.js";

interface DirentLike {
  name: string;
  parentPath: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
  isCompressFile: boolean;
}

export interface GameData {
  path: string;
  title: string;
  thumbnail?: string;
  isCompressFile: boolean;
}

// 게임목록 조회
// TODO: sources, exclude, thumbnailPath 등 db로 변경 예정, 파라미터에서 받지 않게 고쳐야 함
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

// 캐시 삭제 (제거 예정, 캐시 대신 DB사용)
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

// 게임 실행
ipcMain.on(IpcRendererSend.Play, async (e, filePath, exclude = []) => {
  await db("games").update({ isRecent: true }).where({ path: filePath });
  try {
    const folderList = await readdir(filePath, { withFileTypes: true });
    for (const file of folderList) {
      if (
        file.isDirectory() ||
        !file.name.toLowerCase().endsWith(".exe") ||
        exclude.some((ex) =>
          file.name.toLowerCase().startsWith(ex.toLowerCase())
        )
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

// 게임 폴더 열기
ipcMain.on(IpcRendererSend.OpenFolder, (e, filePath: string) => {
  shell.showItemInFolder(filePath);
});

// 게임 폴더 열기
ipcMain.on(IpcRendererSend.Hide, async (e, { path, isHidden }) => {
  await db("games").update({ isHidden }).where({ path });
});

// 게임 클리어 체크
ipcMain.on(IpcRendererSend.Clear, async (e, { path, isClear }) => {
  await db("games").update({ isClear }).where({ path });
});

// 게임에 메모 작성
ipcMain.on(IpcRendererSend.Memo, async (e, { path, memo }) => {
  await db("games").update({ memo }).where({ path });
});

/**
 * 캐시 유효성 검사, 이 값이 `true`인 경우 캐시를 재생성 해야 함.
 *
 * @param sources 파일, 썸네일 경로들
 * @returns 캐시 유효성 검사 결과
 */
const checkCacheDirty = async (sources: (string | undefined)[]) => {
  try {
    const [result] = await db("games")
      .select()
      .max("createdAt")
      .max("updatedAt");

    // 조회된 날짜 값에서 string > date > epoch number로 변경
    const updateEpoch = Math.max(
      ...Object.values(result)
        .filter((v) => v)
        .map(
          (v) =>
            new Date(v as unknown as string).getTime() -
            new Date().getTimezoneOffset() * 60 * 1000
        ),
      0
    );
    const sourcesInfo = await Promise.all(
      (sources.filter((v) => !!v) as string[]).map((path) => stat(path))
    );

    // DB업데이트 시간과 소스 폴더의 수정 시간 비교
    return (
      updateEpoch <= Math.max(...sourcesInfo.map((source) => source.mtimeMs))
    );
  } catch (error) {
    // 비교 실패 시 새로 생성 요청
    console.log("cache load fail!", error);
    return true;
  }
};

function findThumbnails(files: DirentLike[]) {
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
  const result: {
    path: string;
    title: string;
    source: string;
    thumbnail?: string;
    isCompressFile: boolean;
  }[] = [];

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
          source: file.parentPath,
          thumbnail: join(thumbnailFile.parentPath, thumbnail),
          isCompressFile: file.isCompressFile,
        });
        return;
      }
    }

    result.push({
      path,
      title: baseName,
      source: file.parentPath,
      thumbnail: undefined,
      isCompressFile: file.isCompressFile,
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
}): Promise<Game[]> => {
  if (!sources || sources.length === 0) {
    return [];
  }

  const isCacheDirty = await checkCacheDirty([...sources, thumbnailFolder]);

  // 캐시 상태 확인 및 캐시 로드 시도
  if (!isCacheDirty) {
    const q = db("games").select().whereNot({ isHidden: true });
    if (hideZipFile) {
      q.where({ isCompressFile: false });
    }
    return await q;
  }

  // 캐시가 없거나 무효화된 경우 데이터 재생성
  console.log("데이터 재생성 시작");

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
    list.push({
      name: entry.name,
      parentPath: entry.path
        .substring(0, entry.path.length - entry.name.length - 1)
        .replaceAll("/", "\\"),
      isFile: () => entry.dirent.isFile(),
      isDirectory: () => entry.dirent.isDirectory(),
      isCompressFile:
        entry.dirent.isFile() &&
        COMPRESS_FILE_TYPE.some((ext) =>
          entry.path.toLowerCase().endsWith(ext)
        ),
    });
  }

  // 썸네일 찾기
  const processedList = findThumbnails(list);

  await db
    .insert(
      processedList.map(
        (data) =>
          ({
            path: data.path,
            title: data.title,
            source: data.source,
            thumbnail: data.thumbnail ?? null,
            rjCode: /[RBV]J\d{6,8}/i.exec(data.title)?.[1] ?? null,
            isCompressFile: data.isCompressFile,
            isHidden: exclude.includes(data.path.replaceAll("/", "\\")),
          } satisfies InsertGame)
      )
    )
    .into("games")
    .onConflict("path")
    .merge({
      // excluded.<columnName> 사용 시 insert문에 사용했던 데이터 사용됨
      title: db.raw("excluded.title"),
      thumbnail: db.raw("excluded.thumbnail"),
      updatedAt: db.fn.now(),
    });

  const q = db("games").select().whereNot({ isHidden: true });
  if (hideZipFile) {
    q.where({ isCompressFile: false });
  }
  return await q;
};
