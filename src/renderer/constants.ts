/**
 * 압축파일 확장자
 *
 * 전부 소문자로 검사 필요
 */
export const COMPRESS_FILE_TYPE = [
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  ".alz",
  ".egg",
] as const;

/**
 * 이미지 확장자
 *
 * 전부 소문자로 검사 필요
 */
export const IMAGE_FILE_TYPE = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".avif",
  ".svg",
];

export enum Sort {
  Title = "Title",
  TitleDesc = "TitleDesc",
  RJCode = "RJCode",
  RJCodeDesc = "RJCodeDesc",
}
