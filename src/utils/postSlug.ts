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
 *    **같은 함수**를 써야 합니다. 규칙이 두 곳에 복제되면 조용히 어긋납니다.
 *
 * ⚠️ 기록 정정 — 이 함수가 막은 것이 무엇인지.
 *    도입 전 코드는 `slug = 파일명(대문자 보존)` 이었고, 본문 fetch 는
 *    `/_posts/${slug}.md` 였습니다. 실측하면 **41편 모두 200** 입니다 —
 *    즉 **구 fetch 는 GitHub Pages 에서도 정상이었습니다.** "원래 33편이
 *    깨져 있었다" 는 사실이 아니니 그렇게 기억하지 마세요.
 *    진짜 함정은 `file` 필드 없이 **slug 만 소문자화하는 수정안**이었습니다.
 *    그랬다면 `/_posts/<소문자>.md` 가 33편에서 404 가 되고(대소문자를
 *    구분하지 않는 macOS 로컬에서는 재현되지 않습니다), 배포 후에야 드러났을
 *    것입니다. 그래서 R2 가 slug(URL)와 file(디스크)을 **나눕니다.**
 */
export function toPostSlug(fileNameOrSlug: string): string {
    return fileNameOrSlug
        .replace(/\.md$/i, '')
        .toLowerCase()
        .replace(/-{2,}/g, '-');
}
