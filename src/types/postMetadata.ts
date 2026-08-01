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
}