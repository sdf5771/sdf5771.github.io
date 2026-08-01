/**
 * 파일명 ↔ URL slug 규칙 — **이 파일이 유일한 정의처입니다.**
 *
 * 명세: agent-log/product.md §7-3 (R1~R5) · docs/handoff-step3-post.md §15-1
 *
 *  R1 마크다운 파일명은 바꾸지 않습니다(41편 무수정).
 *  R2 빌드 시 `slug`(URL용)와 `file`(원본 파일명) **두 필드**를 만듭니다.
 *  R3 `slug` = 원본 파일명 소문자화 + 연속 하이픈 정리. 그 외 변형 없음.
 *  R4 날짜 접두(`YYYY-MM-DD-`)는 유지.
 *
 * 🔴 빌드(generatePostsData)와 런타임(Post·useDocumentTitle·useTerminalPath)이
 *    **같은 함수**를 써야 합니다. 한쪽만 소문자화하면 41편 중 33편이 딥링크에서
 *    404 가 됩니다 — 실제로 그렇게 깨져 있었습니다.
 */
export function toPostSlug(fileNameOrSlug: string): string {
    return fileNameOrSlug
        .replace(/\.md$/i, '')
        .toLowerCase()
        .replace(/-{2,}/g, '-');
}
