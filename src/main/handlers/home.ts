import { randomUUID } from "crypto";
import { shell } from "electron";
import fg from "fast-glob";
import { readdir, stat } from "fs/promises";
import { extname, join } from "path";
import { COMPRESS_FILE_TYPE } from "../constants.js";
import { db } from "../db/db-manager.js";
import { Game, InsertGame } from "../db/db.js";
import { IpcMainSend, IpcRendererSend, WhereGame } from "../events.js";
import { ipcMain, send } from "../main.js";
import { toLikeQuery } from "../utils.js";
import { saveInfo } from "./dlsite.js";
import { loadSetting } from "./setting.js";

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
ipcMain.on(IpcRendererSend.LoadList, async (e, id, options) => {
  const setting = await loadSetting();

  console.time("getListData " + id);
  const list = await getListData({
    sources: setting.applySources,
    thumbnailFolder: setting.changeThumbnailFolder
      ? setting.newThumbnailFolder
      : undefined,
    ...(options ?? {}),
  });
  console.timeEnd("getListData " + id);

  send(IpcMainSend.LoadedList, id, list);
});

// 게임 실행
ipcMain.on(IpcRendererSend.Play, async (e, id, filePath) => {
  const setting = await loadSetting();
  await db("games").update({ isRecent: true }).where({ path: filePath });
  try {
    const folderList = await readdir(filePath, { withFileTypes: true });
    for (const file of folderList) {
      if (
        file.isDirectory() ||
        !file.name.toLowerCase().endsWith(".exe") ||
        setting.playExclude.some((ex) =>
          file.name.toLowerCase().startsWith(ex.toLowerCase())
        )
      ) {
        continue;
      }

      const game = join(filePath, file.name);
      shell.openPath(game);
      send(IpcMainSend.Message, id, {
        type: "success",
        message: `${game} 파일을 실행했습니다. 잠시만 기다려주세요.`,
      });
      return;
    }
    send(IpcMainSend.Message, id, {
      type: "warning",
      message: "실행파일을 찾지 못했습니다. 폴더 열기를 사용해 실행해주세요.",
    });
  } catch (error) {
    if ((error as Error)?.message?.startsWith("ENOTDIR: not a directory")) {
      shell.openPath(join(filePath));
      return;
    }
    console.error("error!", error);
    send(IpcMainSend.Message, id, {
      type: "warning",
      message: `게임 실행에 실패했습니다.`,
      description: (error as Error).stack,
    });
  }
});

// 게임 폴더 열기
ipcMain.on(IpcRendererSend.OpenFolder, (e, id, filePath) => {
  shell.showItemInFolder(filePath);
});

// 게임 폴더 열기
ipcMain.on(IpcRendererSend.Hide, async (e, id, { path, isHidden }) => {
  await db("games").update({ isHidden }).where({ path });
});

// 게임 즐겨찾기 추가
ipcMain.on(IpcRendererSend.Favorite, async (e, id, { path, isFavorite }) => {
  await db("games").update({ isFavorite }).where({ path });
});

// 게임 클리어 체크
ipcMain.on(IpcRendererSend.Clear, async (e, id, { path, isClear }) => {
  const q = db("games").update({ isClear });
  if (isClear) {
    q.update({ isRecent: false });
  }
  await q.where({ path });
});

// 최근 게임 체크
ipcMain.on(IpcRendererSend.Recent, async (e, id, { path, isRecent }) => {
  await db("games").update({ isRecent }).where({ path });
});

// 게임에 메모 작성
ipcMain.on(IpcRendererSend.Memo, async (e, id, { path, memo }) => {
  await db("games").update({ memo }).where({ path });
});

// 게임 정보 업데이트
ipcMain.on(IpcRendererSend.UpdateGame, async (e, id, { path, gameData }) => {
  try {
    // 게임이 존재하는지 먼저 확인
    const existingGame = await db("games").select().where({ path }).first();

    if (!existingGame) {
      send(IpcMainSend.Message, id, {
        type: "error",
        message: "해당 게임을 찾을 수 없습니다.",
        description: `Path: ${path}`,
      });
      return;
    }

    // 업데이트할 데이터 준비 (null이나 undefined 값 처리)
    const updateData: any = {
      updatedAt: db.fn.now(),
    };

    // 각 필드별로 값이 있는 경우에만 업데이트
    if (gameData.title !== undefined) {
      updateData.title = gameData.title;
    }
    if (gameData.publishDate !== undefined) {
      updateData.publishDate = gameData.publishDate;
    }
    if (gameData.makerName !== undefined) {
      updateData.makerName = gameData.makerName;
    }
    if (gameData.category !== undefined) {
      updateData.category = gameData.category;
    }
    if (gameData.tags !== undefined) {
      updateData.tags = gameData.tags;
    }
    if (gameData.memo !== undefined) {
      updateData.memo = gameData.memo;
    }

    // 데이터베이스 업데이트 실행
    const tx = await db.transaction();

    try {
      const updatedRows = await tx("games").update(updateData).where({ path });
      if (updatedRows === 0) {
        send(IpcMainSend.Message, id, {
          type: "warning",
          message:
            "게임 정보가 업데이트되지 않았습니다. 변경사항이 없거나 게임을 찾을 수 없습니다.",
        });
        await tx.rollback();
        return;
      }

      await tx("gameTags").delete().where({ gamePath: path });
      if (updateData.tags) {
        const tags: { id: string; tag: string }[] = updateData.tags
          .split(",")
          .map((tag: string) => ({
            id: randomUUID(),
            tag: tag.trim(),
          }));
        await tx("tags").insert(tags).onConflict().ignore();
        const tagIds = await tx("tags")
          .select("id")
          .whereIn(
            "tag",
            tags.map((tag) => tag.tag)
          );
        await tx("gameTags")
          .insert(
            tagIds.map((tagId) => ({
              gamePath: path,
              tagId: tagId.id,
            }))
          )
          .onConflict()
          .ignore();
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }

    send(IpcMainSend.Message, id, {
      type: "success",
      message: "게임 정보가 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("게임 정보 업데이트 실패:", error);
    send(IpcMainSend.Message, id, {
      type: "error",
      message: "게임 정보 업데이트에 실패했습니다.",
      description: (error as Error).message,
    });
  }
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

let initialized = false;
/**
 * 캐시된 데이터를 가져오거나, 캐시가 없거나 무효화된 경우 새로 생성합니다.
 */
const getListData = async ({
  sources,
  thumbnailFolder,

  category,
  isClear,
  isCompressFile,
  isHidden,
  isRecent,
  makerName,
  tags,
  title,
}: {
  sources: string[];
  thumbnailFolder?: string;
} & WhereGame): Promise<Game[]> => {
  if (!sources || sources.length === 0) {
    console.error("source is empty!!!!!!!!!!!!!!!!!!!!!!");
    return [];
  }

  const isCacheDirty =
    !initialized || (await checkCacheDirty([...sources, thumbnailFolder]));
  initialized = true;

  // 캐시 상태 확인 및 캐시 로드 시도
  if (!isCacheDirty) {
    const q = db("games")
      .select("games.*")
      .select(db.raw("group_concat(tags.tag, ', ') as tags"))
      .select(db.raw("group_concat(tags.id, ',') as tagIds"))
      .leftJoin("gameTags", "games.path", "gameTags.gamePath")
      .leftJoin("tags", "gameTags.tagId", "tags.id")
      .groupBy("games.path");
    if (category) {
      q.where({ category: category });
    }
    if (isClear !== undefined) {
      q.where({ isClear: isClear });
    }
    if (isCompressFile !== undefined) {
      q.where({ isCompressFile: isCompressFile });
    }
    if (isHidden !== undefined) {
      q.where({ isHidden: isHidden });
    }
    if (isRecent !== undefined) {
      q.where({ isRecent: isRecent });
    }
    if (makerName) {
      q.whereILike({ makerName: toLikeQuery(makerName) });
    }
    if (tags) {
      q.whereILike({ tags: toLikeQuery(tags) });
    }
    if (title) {
      q.whereILike({ title: toLikeQuery(title) });
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

  // path가 존재하지 않는 데이터는 삭제
  await db("games")
    .delete()
    .whereNotIn(
      "path",
      processedList.map((item) => item.path)
    );

  // 신규 데이터 삽입 및 기존데이터 업데이트

  const gameList = processedList.map(
    (data) =>
      ({
        path: data.path,
        title: data.title,
        source: data.source,
        thumbnail: data.thumbnail ?? null,
        rjCode: /[RBV]J\d{6,8}/i.exec(data.title)?.[0] ?? null,
        isCompressFile: data.isCompressFile,
      } satisfies InsertGame)
  );

  // knex insert 시 복합 select > insert가 되는데 최대 500개 제한이 있음
  for (let i = 0; i < gameList.length / 400; i++) {
    await db
      .insert(gameList.slice(i * 400, (i + 1) * 400))
      .into("games")
      .onConflict("path")
      .merge({
        // excluded.<columnName> 사용 시 insert문에 사용했던 데이터 사용됨
        title: db.raw("excluded.title"),
        source: db.raw("excluded.source"),
        thumbnail: db.raw("excluded.thumbnail"),
        rjCode: db.raw("excluded.rjCode"),
        isCompressFile: db.raw("excluded.isCompressFile"),
        updatedAt: db.fn.now(),
      });
  }

  // 정보 입력되지 않은 게임들 처리
  const notLoadedGames = await db("games")
    .select()
    .where({ isLoadedInfo: false })
    .whereNotNull("rjCode");
  try {
    await Promise.all(
      notLoadedGames.map((game) => saveInfo(game.path, game.rjCode!))
    );
  } catch (error) {
    console.error(error);
  }

  const q = db("games")
    .select("games.*")
    .select(db.raw("group_concat(tags.tag, ', ') as tags"))
    .select(db.raw("group_concat(tags.id, ',') as tagIds"))
    .leftJoin("gameTags", "games.path", "gameTags.gamePath")
    .leftJoin("tags", "gameTags.tagId", "tags.id")
    .groupBy("games.path");
  if (category) {
    q.where({ category: category });
  }
  if (isClear !== undefined) {
    q.where({ isClear: isClear });
  }
  if (isCompressFile !== undefined) {
    q.where({ isCompressFile: isCompressFile });
  }
  if (isHidden !== undefined) {
    q.where({ isHidden: isHidden });
  }
  if (isRecent !== undefined) {
    q.where({ isRecent: isRecent });
  }
  if (makerName) {
    q.whereILike({ makerName: toLikeQuery(makerName) });
  }
  if (tags) {
    q.whereILike({ tags: toLikeQuery(tags) });
  }
  if (title) {
    q.whereILike({ title: toLikeQuery(title) });
  }
  return await q;
};

// 설정 변경 시 강제 캐시 재조회
ipcMain.on(IpcRendererSend.UpdateSetting, async (e, id, data) => {
  const whitelist = [
    "sources",
    "applySources",
    "changeThumbnailFolder",
    "newThumbnailFolder",
  ];
  if (whitelist.some((key) => Object.keys(data).includes(key))) {
    console.log("설정이 변경되어 캐시를 무효화합니다.");
    initialized = false;
  }
});
