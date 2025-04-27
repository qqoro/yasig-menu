/**
 * 정규식 특수 문자를 이스케이프(escape) 처리합니다.
 * @param str 이스케이프 처리할 문자열
 * @returns 이스케이프 처리된 문자열
 */
function escapeRegex(str: string): string {
  // .$*+?^=!:{}()|[]\/ 등의 특수문자 이스케이프
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 주어진 검색어의 문자열을 찾는 정규식을 생성합니다.
 * 순서와 공백은 무시되며, 대소문자를 구분하지 않습니다.
 * @param searchTerm 사용자가 입력한 검색어 문자열
 * @returns 생성된 RegExp 객체
 */
export function searchFuzzy(searchTerm: string): RegExp {
  // 검색어에서 공백 제거
  const cleanedSearchTerm = searchTerm.replace(/\s+/g, "");

  // 공백 제거 후 남은 문자가 없으면 모든 것을 찾는 정규식 반환
  if (cleanedSearchTerm.length === 0) {
    return /.*/i;
  }

  try {
    return new RegExp(escapeRegex(cleanedSearchTerm), "i");
  } catch (error) {
    console.error("정규식 생성 중 오류 발생:", error);
    return /.*/i;
  }
}

const rjExp = /RJ\d{6,8}/i;
export function sortRJCode(a: string, b: string, desc: boolean = false) {
  const [codeA, codeB] = [
    rjExp.exec(a)?.[0].substring(2),
    rjExp.exec(b)?.[0].substring(2),
  ];
  if (codeA && codeB) {
    return Number(codeA) - Number(codeB);
  }
  if (codeA) {
    return desc ? 1 : -1;
  }
  if (codeB) {
    return desc ? -1 : 1;
  }

  return 0;
}
