export interface PostMetadata {
    title: string;
    date: string;
    author: string;
    keywords: string[];
    /**
     * `keywords[i]` 의 URL slug — **순서와 길이가 `keywords` 와 대응**합니다
     * (docs/handoff-step6-tags-archive.md §3-6①). 빌드가 채우고 검증합니다.
     *
     * 목록 필터는 `post.tagSlugs.includes(slug)` 하나로 끝납니다 — 런타임에서
     * 태그를 다시 정규화할 일이 없어야 검색과 태그 페이지가 갈리지 않습니다.
     */
    tagSlugs: string[];
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
     * 🔴 공식이 STEP 3 §10-3 으로 **바뀌었습니다**(산문만 → 산문 + 코드 + 이미지).
     *    STEP 4 §5-1 의 옛 공식(산문 글자수만)은 코드가 긴 글을 실제보다 훨씬 짧게
     *    말했습니다 — `client-side-ai` 가 코드 237줄·이미지 12장인데 20분이었습니다.
     *    지금 분포는 1~26분(1분 12편)입니다. **목록 화면의 표시값도 함께 바뀝니다.**
     *    정보량이 낮은 자리이므로 메타 줄에서 3순위로 두고 강조하지 마세요.
     */
    readingMinutes: number;
    /**
     * 본문에서 자동 추출한 요약 80~110자(§15-3). 프론트매터 `description` 이 있으면
     * 그것이 우선입니다 — 41편 중 1편만 갖고 있습니다.
     * `<meta name=description>` · OG · 검색 색인이 소비합니다.
     */
    excerpt: string;
    /**
     * 본문 이미지의 실제 픽셀 크기. 키는 마크다운에 적힌 `src` 원문입니다.
     *
     * 🔴 런타임에는 이 정보를 알 방법이 없습니다. `<img width height>` 가 없으면
     *    이미지 로드마다 문서 높이가 변해 읽기 진행바가 튑니다(§11-2·§8-2).
     */
    imageSizes: Record<string, { width: number; height: number }>;
    /**
     * 소속 시리즈. 시리즈가 아니면 `null` 이고, 그때 **UI 블록 자체가 없습니다**
     * (§4-5 — 시안이 시리즈 아닌 글에 블록을 붙인 것이 데이터 오류였습니다).
     *
     * 정의처는 `public/_series.json` 이고 빌드가 병합합니다. 파일명 숫자 접미
     * 규칙은 실증 반려됐습니다 — `Python-Prefix-sum-5` 의 `5` 는 백준 문제명
     * 「구간 합 구하기 5」의 일부인데, 규칙은 이를 시리즈로 만들어냅니다(§10-1).
     */
    series: PostSeries | null;
}

export interface PostSeries {
    id: string;
    title: string;
    /** 1부터 시작하는 편 번호. `시리즈 · <total>편 중 <index>편` */
    index: number;
    total: number;
    /** 다음 편. 마지막 편이거나 단독 1편이면 `null` */
    next: { slug: string; title: string } | null;
}