export interface PostMetadata {
    title: string;
    date: string;
    author: string;
    keywords: string[];
    description: string;
    category: string;
    /**
     * URL 용 정본 slug — **소문자**입니다(product.md §7-3 R3).
     * 파일을 읽을 때 쓰지 마세요. 파일명에는 대문자가 섞여 있고 GitHub Pages 는
     * 대소문자를 구분합니다.
     */
    slug: string;
    /**
     * 원본 마크다운 파일명(확장자 포함, 대소문자 그대로) — 본문 fetch 전용입니다
     * (product.md §7-3 R2). 화면·URL 에 노출하지 마세요.
     */
    file: string;
    thumbnail: string;
    /**
     * 읽기 시간(분). **빌드 시 본문에서 계산합니다** — `generatePostsData.ts` 가
     * 이미 파일 전문을 읽고 있어 추가 비용이 없고, 런타임에는 본문이 없습니다.
     * 산출 규칙은 `generatePostsData.ts` 의 `calculateReadingMinutes` 가 정의처입니다.
     *
     * ⚠️ 41편 중 17편이 `1` 입니다. 정보량이 낮으므로 메타 줄에서 3순위로 두고
     *    배지·색으로 강조하지 마세요(handoff-step4-list.md §5-1).
     */
    readingMinutes: number;
}