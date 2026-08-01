import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PostMetadata, PostSeries } from '../types';
import { toPostSlug } from './postSlug';
import { readImageSize } from './imageSize';

// Markdown File Path
const MARKDOWN_DIRECTORY_PATH = 'public/_posts';
const postsDirectory = path.join(process.cwd(), MARKDOWN_DIRECTORY_PATH);

// image directory path
const IMAGE_DIRECTORY_PATH = 'public/images/posts';
const imageDirectory = path.join(process.cwd(), IMAGE_DIRECTORY_PATH);

// Create posts data path
const jsonOutputPath = path.join(process.cwd(), 'public/posts-data.json');

/**
 * 시리즈 정의 파일(§10-1). **41편 md 를 한 글자도 고치지 않기 위해** 별도 파일입니다.
 * 프론트매터에 필드를 신설하는 안(6개 파일 수정)과 파일명 숫자 접미 규칙 안은
 * 각각 무수정 원칙 위반·실데이터 오작동으로 반려됐습니다.
 */
const seriesInputPath = path.join(process.cwd(), 'public/_series.json');

/** 분당 읽는 글자 수(공백 제외). 한국어 기술 문서 묵독 기준값입니다 */
const CHARACTERS_PER_MINUTE = 500;

/** 분당 훑는 코드 줄 수. 정독이 아니라 훑기 기준입니다 */
const CODE_LINES_PER_MINUTE = 30;

/** 이미지 1장을 보는 시간(초) */
const SECONDS_PER_IMAGE = 5;

interface SeriesDefinition {
    id: string;
    title: string;
    /** 배열 **순서가 곧 편 순서**입니다. 날짜순 추론 금지 — 저자 의도가 우선(§10-1) */
    posts: string[];
}

/* ------------------------------------------------------------
 * 읽기 시간
 * ---------------------------------------------------------- */

/**
 * 읽기 시간(분) — docs/handoff-step3-post.md §10-3 [확정 공식].
 *
 * ```
 * 분 = round( 산문공백제외글자수 / 500 + 코드줄수 / 30 + 이미지수 × 5초/60 )
 * 최소 1분
 * ```
 *
 * 🔴 STEP 4 §5-1 의 옛 공식(**산문 글자수만**)에서 바뀌었습니다.
 *    옛 공식은 코드와 이미지를 세지 않아, 코드 237줄·이미지 12장짜리
 *    `client-side-ai` 를 20분이라고 말했습니다. 실제로는 26분입니다.
 *    코드가 본문의 절반인 글이 35편이라 이 차이가 대부분의 글에 걸립니다.
 *    **목록 화면(STEP 4)의 표시값도 함께 바뀝니다** — 같은 필드를 읽습니다.
 */
function calculateReadingMinutes(content: string): number {
    /* 코드펜스. 닫히지 않은 블록이 뒤를 통째로 먹지 않게 비탐욕 매칭입니다 */
    const fences = content.match(/```[\s\S]*?```/g) ?? [];

    /*
     * 펜스 안의 줄 수. 여는 줄과 닫는 줄은 코드가 아니므로 2를 뺍니다.
     * 음수가 되지 않게 하한을 둡니다(``` 만 두 줄인 빈 펜스).
     */
    const codeLines = fences.reduce(
        (total, fence) => total + Math.max(0, fence.split('\n').length - 2),
        0,
    );

    const imageCount = (content.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length;

    const prose = content
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\s/g, '');

    const minutes =
        prose.length / CHARACTERS_PER_MINUTE +
        codeLines / CODE_LINES_PER_MINUTE +
        (imageCount * SECONDS_PER_IMAGE) / 60;

    /* `0분` 은 표시할 수 없는 값입니다 */
    return Math.max(1, Math.round(minutes));
}

/* ------------------------------------------------------------
 * 요약(excerpt) — §15-3
 * ---------------------------------------------------------- */

const EXCERPT_MIN = 80;
const EXCERPT_MAX = 110;

/**
 * 본문 첫 문단에서 요약을 뽑습니다. **41편 중 40편에 `description` 이 없습니다.**
 *
 * 🔴 문장 중간에서 자르지 않습니다(WRITING_GUIDE §6.11). 상한을 넘으면 상한
 *    이전의 **마지막 문장 경계**까지만 쓰고 `…` 를 붙입니다. 경계를 못 찾으면
 *    (한 문장이 110자를 넘는 경우) 그 문장을 통째로 살립니다 — 자르는 것보다
 *    조금 긴 편이 낫습니다.
 */
function extractExcerpt(content: string): string {
    const plain = content
        /* 코드·이미지·헤딩·인용은 요약 대상이 아닙니다 */
        .replace(/```[\s\S]*?```/g, '\n\n')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/^\s{0,3}#{1,6}\s.*$/gm, '\n\n')
        .replace(/^\s{0,3}>.*$/gm, '\n\n')
        .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, '\n\n')
        /* 인라인 마크업만 벗깁니다 — 링크는 텍스트를 남깁니다 */
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_~`]/g, '')
        /* 원시 HTML 태그 제거(6편) */
        .replace(/<[^>]*>/g, ' ');

    /*
     * 문단을 **하한(80자)에 닿을 때까지 이어 붙입니다.** 첫 문단만 쓰면 `breaks:true`
     * 를 전제로 쓰인 글에서 한 줄짜리 부제가 잡혀 `Google I/O 2025 핵심 API 살펴보기`
     * 같은 7~30자 요약이 나옵니다. 검색 결과·OG 카드에 쓰기엔 너무 짧습니다.
     */
    const blocks = plain
        .split(/\n\s*\n/)
        .map(block => block.replace(/\s+/g, ' ').trim())
        .filter(block => block.length > 0);

    let paragraph = '';
    for (const block of blocks) {
        paragraph = paragraph ? `${paragraph} ${block}` : block;
        if (paragraph.length >= EXCERPT_MIN) {
            break;
        }
    }

    if (!paragraph) {
        return '';
    }

    if (paragraph.length <= EXCERPT_MAX) {
        return paragraph;
    }

    /* 문장 경계: `다.` `요.` `습니다.` 와 라틴 `. ` — §15-3 */
    const boundary = /(?:다\.|요\.|니다\.|[.!?](?=\s|$))/g;
    let lastEnd = 0;
    let match: RegExpExecArray | null;

    while ((match = boundary.exec(paragraph)) !== null) {
        const end = match.index + match[0].length;
        if (end > EXCERPT_MAX) {
            break;
        }
        lastEnd = end;
    }

    if (lastEnd >= EXCERPT_MIN) {
        return `${paragraph.slice(0, lastEnd)}…`;
    }

    /* 상한 안에 경계가 없으면 첫 문장을 통째로 살립니다 */
    boundary.lastIndex = 0;
    const first = boundary.exec(paragraph);
    return first ? paragraph.slice(0, first.index + first[0].length) : paragraph;
}

/* ------------------------------------------------------------
 * 본문 이미지 크기 — §11-2
 * ---------------------------------------------------------- */

/**
 * 본문에 등장하는 모든 이미지의 실제 픽셀 크기를 읽어 `src` 원문 → 크기 맵으로
 * 만듭니다. 마크다운에 적힌 문자열을 **그대로 키로 씁니다** — 런타임 렌더러가
 * 갖고 있는 것이 그 문자열이라, 정규화하면 조회가 어긋납니다.
 */
function collectImageSizes(content: string): PostMetadata['imageSizes'] {
    const sizes: PostMetadata['imageSizes'] = {};
    const pattern = /!\[[^\]]*\]\(\s*([^)\s]+)/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
        const src = match[1];

        /* 외부 URL 은 빌드 때 읽을 수 없습니다 */
        if (sizes[src] || /^(?:https?:)?\/\//.test(src)) {
            continue;
        }

        const relative = src.startsWith('/') ? src.slice(1) : src;
        const filePath = path.join(process.cwd(), 'public', decodeURIComponent(relative));

        const size = readImageSize(filePath);
        if (size) {
            sizes[src] = size;
        }
    }

    return sizes;
}

/* ------------------------------------------------------------
 * 시리즈 — §10-1
 * ---------------------------------------------------------- */

/**
 * `_series.json` 을 읽어 slug → 시리즈 정보 맵을 만듭니다.
 *
 * 🔴 검증 실패는 전부 **빌드 실패**입니다. 조용히 무시하면 시리즈가 소리 없이
 *    사라지고, 그건 배포된 뒤에야 드러납니다(§10-1).
 */
function buildSeriesMap(knownSlugs: Map<string, string>): Map<string, PostSeries> {
    if (!fs.existsSync(seriesInputPath)) {
        console.warn(`⚠️  ${seriesInputPath} 가 없습니다. 시리즈 없이 생성합니다.`);
        return new Map();
    }

    const definitions: SeriesDefinition[] = JSON.parse(fs.readFileSync(seriesInputPath, 'utf8'));
    const result = new Map<string, PostSeries>();
    const owner = new Map<string, string>();

    for (const definition of definitions) {
        const slugs = definition.posts.map(toPostSlug);

        const missing = slugs.filter(slug => !knownSlugs.has(slug));
        if (missing.length > 0) {
            throw new Error(
                `_series.json 의 "${definition.id}" 가 존재하지 않는 글을 가리킵니다: ${missing.join(', ')}`,
            );
        }

        for (const slug of slugs) {
            const existing = owner.get(slug);
            if (existing) {
                throw new Error(
                    `_series.json: "${slug}" 가 두 시리즈에 속합니다("${existing}" · "${definition.id}")`,
                );
            }
            owner.set(slug, definition.id);
        }

        slugs.forEach((slug, index) => {
            const nextSlug = slugs[index + 1];

            result.set(slug, {
                id: definition.id,
                title: definition.title,
                index: index + 1,
                total: slugs.length,
                next: nextSlug
                    ? { slug: nextSlug, title: knownSlugs.get(nextSlug) ?? '' }
                    : null,
            });
        });
    }

    return result;
}

/* ------------------------------------------------------------
 * 생성
 * ---------------------------------------------------------- */

function generatePostsData() {
    try {
        /* `.DS_Store` 같은 부산물이 글로 둔갑하지 않게 마크다운만 봅니다 */
        const files = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'));

        const bringThumbnailImage = (filename: string) => {
            // 파일명에서 .md 확장자를 제거한 디렉토리 경로를 사용
            const postDir = path.join(imageDirectory, filename.replace('.md', ''));

            // 디렉토리가 존재하는지 확인
            if (!fs.existsSync(postDir) || !fs.statSync(postDir).isDirectory()) {
                return '';  // 디렉토리가 없으면 빈 문자열 반환
            }

            // 디렉토리 내 첫 번째 이미지 파일을 썸네일로 사용
            const imageFiles = fs.readdirSync(postDir);
            if (imageFiles.length === 0) {
                return '';
            }

            // 디렉토리 내 첫 번째 이미지 파일을 썸네일로 사용하거나 thumbnail 이라는 이름의 파일이 있는지 확인
            const thumbnailFile = imageFiles.find(file => file.includes('thumbnail'));
            if (thumbnailFile) {
                return `/images/posts/${filename.replace('.md', '')}/${thumbnailFile}`;
            }

            // 이미지 파일 경로를 상대 경로로 반환 (예: /images/posts/포스트명/이미지명.png)
            return `/images/posts/${filename.replace('.md', '')}/${imageFiles[0]}`;
        }

        const postMetadatas: PostMetadata[] = files.map(filename => {
            const filePath = path.join(postsDirectory, filename);
            const fileContents = fs.readFileSync(filePath, 'utf8');

            const { data, content } = matter(fileContents);
            const thumbnailImage = bringThumbnailImage(filename);

            /*
             * 🔴 slug(URL)와 file(디스크)을 **분리**합니다 — product.md §7-3 R2.
             * 파일명에는 대문자가 섞여 있고(33/41) GitHub Pages 는 대소문자를
             * 구분하므로, 하나로 겸용하면 소문자 URL 로 들어온 요청이 파일을
             * 못 찾거나 대문자 URL 이 정본과 어긋납니다.
             * 프론트매터 `slug:` 오버라이드도 같은 규칙으로 정규화합니다(R5).
             */
            return {
                title: data.title || '',
                date: data.date || '',
                author: data.author || '',
                keywords: data.tags || [],
                description: data.description || '',
                category: data.categories || '',
                slug: toPostSlug(typeof data.slug === 'string' && data.slug ? data.slug : filename),
                file: filename,
                thumbnail: thumbnailImage,
                readingMinutes: calculateReadingMinutes(content),
                /* 프론트매터 description 이 있으면 그것이 우선입니다(§15-3) */
                excerpt: (typeof data.description === 'string' && data.description.trim())
                    ? data.description.trim()
                    : extractExcerpt(content),
                imageSizes: collectImageSizes(content),
                /* 아래에서 _series.json 을 병합합니다 */
                series: null,
            } as PostMetadata;
        });

        /*
         * 🔴 멱등성 단언 — 기록된 slug 에 규칙을 한 번 더 걸어도 그대로여야 합니다.
         *
         * 이게 깨지면 런타임에서 `toPostSlug(요청)` 이 어떤 글의 slug 와도 맞지
         * 않아 그 글이 404 가 되고, 404.html 의 인라인 리다이렉트는 정본에
         * 도달하지 못해 되돌아옵니다. 프론트매터 `slug:` 오버라이드(R5)가
         * 정규화를 우회하는 경로라 실제로 일어날 수 있습니다.
         * 한 줄이지만 "slug 만 소문자화" 류의 사고를 **빌드 에러로** 잡습니다.
         */
        const notCanonical = postMetadatas.filter(post => toPostSlug(post.slug) !== post.slug);

        if (notCanonical.length > 0) {
            throw new Error(
                `slug 가 정본 형태가 아닙니다: ${notCanonical
                    .map(post => `"${post.slug}" → "${toPostSlug(post.slug)}"`)
                    .join(', ')}`,
            );
        }

        /*
         * 소문자화로 두 파일이 같은 slug 가 되면 한쪽 글이 영영 열리지 않습니다.
         * 조용히 넘어가면 배포된 뒤에야 드러나므로 빌드를 세웁니다.
         */
        const duplicatedSlugs = postMetadatas
            .map(post => post.slug)
            .filter((slug, index, slugs) => slugs.indexOf(slug) !== index);

        if (duplicatedSlugs.length > 0) {
            throw new Error(
                `slug 가 중복됩니다(파일명 소문자화 결과): ${[...new Set(duplicatedSlugs)].join(', ')}`,
            );
        }

        /* 시리즈 병합. slug → 제목 맵을 넘겨 "다음 편" 제목까지 빌드에서 해결합니다 */
        const seriesMap = buildSeriesMap(
            new Map(postMetadatas.map(post => [post.slug, post.title])),
        );

        for (const post of postMetadatas) {
            post.series = seriesMap.get(post.slug) ?? null;
        }

        /*
         * 🔴 정렬: date DESC, **동률이면 slug ASC**(§10-2).
         *
         * 타이브레이커가 없으면 동일 날짜 8개 그룹의 순서가 `readdirSync` 의
         * 반환 순서와 Array.prototype.sort 의 안정성에 의존합니다. 그러면
         * 빌드 머신이 바뀔 때 이전/다음 링크가 조용히 흔들리고, 프리렌더된
         * 정적 HTML 이라 사용자에게는 "링크가 어제와 다른" 형태로 드러납니다.
         * 이 배열 순서가 곧 이전/다음의 정의이므로(data/posts.ts) 고정 필수입니다.
         */
        postMetadatas.sort(
            (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime() ||
                a.slug.localeCompare(b.slug),
        );

        // write to json file
        fs.writeFileSync(jsonOutputPath, JSON.stringify(postMetadatas, null, 2));

        const seriesCount = postMetadatas.filter(post => post.series).length;
        const imageCount = postMetadatas.reduce(
            (total, post) => total + Object.keys(post.imageSizes).length,
            0,
        );
        console.log(
            `✅ Posts data generated successfully: ${jsonOutputPath}\n` +
                `   글 ${postMetadatas.length}편 · 시리즈 소속 ${seriesCount}편 · 이미지 크기 ${imageCount}장`,
        );
    } catch (error) {
        console.error('❌ Error generating posts data:', error);
        /* 조용히 넘어가면 이전 posts-data.json 으로 그대로 배포됩니다 */
        process.exit(1);
    }
}

generatePostsData();
