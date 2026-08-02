import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * 마크다운 컬렉션 리더 — **`_posts` 와 `_works` 가 공유하는 유일한 층**입니다.
 * 명세: agent-log/product.md §13-3 (빌드 파이프라인) · docs/handoff-step7-works.md §15-1
 *
 * ```
 * public/_posts/*.md  →  posts-data.json   (generatePostsData.ts)
 * public/_works/*.md  →  works-data.json   (generateWorksData.ts)
 * ```
 *
 * 🔴 **여기서 공유하는 것은 "디렉터리를 읽고 프론트매터를 떼어 JSON 을 쓴다"
 *    까지입니다.** 항목 매핑·검증은 공유하지 않습니다 — 두 컬렉션의 스키마가
 *    다르기 때문입니다(글: 카테고리·태그·읽기시간 / 작업: 기간·역할·스택).
 *    product.md §13-3 이 "별도 디렉터리 + 별도 스키마" 를 택한 근거가 그것이고,
 *    한 매퍼로 묶으면 양쪽 다 어색해집니다.
 *
 * 🔴 **글 목록·검색·태그·RSS·sitemap·이전다음은 `posts-data.json` 만 참조합니다.**
 *    디렉터리가 물리적으로 갈려 있어 필터를 한 군데 빠뜨려도 작업물이 글에
 *    새어 들어갈 수 없습니다. 그게 이 구조의 목적입니다.
 */

/**
 * 프론트매터의 타입.
 *
 * gray-matter 가 돌려주는 `{ [key: string]: any }` 를 그대로 씁니다 — YAML 은
 * 무엇이든 담을 수 있어 여기서 좁혀 봐야 호출부가 다시 넓혀야 합니다.
 * 🔴 **좁히는 일은 각 생성기의 검증이 합니다** (글: slug 정본성·태그 3종 검증 /
 *    작업: slug 규칙 W1·W5·`type` 열거·`start` 형식). 그쪽이 실패하면 빌드가
 *    멈추므로, 타입이 아니라 빌드가 계약을 지킵니다.
 */
export type FrontMatter = matter.GrayMatterFile<string>['data'];

export interface MarkdownEntry {
    /** 확장자 포함 원본 파일명(대소문자 그대로) */
    filename: string;
    /** 프론트매터 */
    data: FrontMatter;
    /** 프론트매터를 뗀 본문 */
    content: string;
}

/**
 * 디렉터리의 `.md` 를 전부 읽어 프론트매터를 분리합니다.
 *
 * `.DS_Store` 같은 부산물이 항목으로 둔갑하지 않게 확장자로 거릅니다.
 * 정렬은 호출부의 책임입니다 — 두 컬렉션의 정렬 키가 다릅니다(`date` vs `start`).
 */
export function readMarkdownCollection(directory: string): MarkdownEntry[] {
    const absolute = path.join(process.cwd(), directory);

    if (!fs.existsSync(absolute)) {
        throw new Error(`마크다운 디렉터리가 없습니다: ${directory}`);
    }

    return fs
        .readdirSync(absolute)
        .filter(filename => filename.endsWith('.md'))
        .map(filename => {
            const { data, content } = matter(
                fs.readFileSync(path.join(absolute, filename), 'utf8'),
            );

            return { filename, data, content };
        });
}

/** 산출물 쓰기. 들여쓰기 2칸은 기존 `posts-data.json` 과 같습니다 */
export function writeDataFile(outputPath: string, value: unknown): void {
    fs.writeFileSync(path.join(process.cwd(), outputPath), JSON.stringify(value, null, 2));
}

/**
 * 본문이 **실제로 무언가를 렌더하는가.**
 *
 * 🔴 HTML 주석은 렌더 결과가 빈 화면이므로 **본문으로 세지 않습니다.**
 *    `_works/*.md` 15건이 전부 "아직 안 썼다" 는 안내 주석만 갖고 있는데,
 *    이걸 본문으로 세면 상세 라우트 15개가 열리고 전부 빈 페이지가 됩니다
 *    (handoff-step7-works.md §4-4 `hasBody` 계약).
 */
export function hasRenderableBody(content: string): boolean {
    return content.replace(/<!--[\s\S]*?-->/g, '').trim().length > 0;
}
