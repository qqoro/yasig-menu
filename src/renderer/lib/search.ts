/**
 * 정규식 특수 문자를 이스케이프(escape) 처리합니다.
 * @param str 이스케이프 처리할 문자열
 * @returns 이스케이프 처리된 문자열
 */
function escapeRegex(str: string): string {
  // 정규식에서 특별한 의미를 가지는 문자들을 매칭하여 앞에 역슬래시(\)를 붙입니다.
  // .$*+?^=!:{}()|[]\/
  // 아래 문자들이 특수문자 리스트 입니다. 정규식 내에서 사용 시 앞에 \를 붙여야 합니다.
  // 참고: [] 내의 - 는 범위 지정을 위해 사용될 수 있으므로 포함될 수 있습니다.
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $&는 매칭된 전체 문자열을 의미합니다.
}

/**
 * 주어진 검색어의 모든 문자가 순서와 공백에 상관없이 포함된 문자열을 찾는 정규식을 생성합니다.
 * @param searchTerm 사용자가 입력한 검색어 문자열 (예: "c x z v")
 * @param caseInsensitive 대소문자 구분 여부 (기본값: true, 구분 안 함)
 * @returns 생성된 RegExp 객체
 */
export function searchFuzzy(searchTerm: string): RegExp {
  // 검색어에서 공백 제거
  const cleanedSearchTerm = searchTerm.replace(/\s+/g, "");

  // 공백 제거 후 남은 문자가 없으면 모든 것을 찾는 정규식 반환
  if (cleanedSearchTerm.length === 0) {
    return /.*/;
  }

  // 각 문자에 대한 긍정 탐색(Positive Lookahead) 패턴 생성
  let pattern = "";
  for (const char of cleanedSearchTerm) {
    // 정규식 특수 문자 이스케이프 처리
    const escapedChar = escapeRegex(char);
    // (?=.*?문자) 형태의 패턴 추가
    pattern += `(?=.*?${escapedChar})`;
  }

  // RegExp 객체 생성 및 반환
  try {
    return new RegExp(pattern, "gi");
  } catch (error) {
    console.error("정규식 생성 중 오류 발생:", error);
    // 오류 발생 시 안전하게 모든 것을 찾는 정규식 반환
    return /.*/;
  }
}
