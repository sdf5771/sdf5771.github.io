/**
 * 마크다운 → HTML 렌더러. **이 파일이 유일한 렌더러 정의처입니다.**
 * 명세: docs/handoff-step3-post.md §5-2 · §6-2 · §6-3 · §7
 *
 * 옵션은 41편이 이미 쓰인 형태에 맞춰 **바꾸지 않습니다**(§5-2).
 *  - `html: true`  — 6편이 원시 HTML 을 씁니다. 콘텐츠가 본인 소유라 XSS 위험 없음
 *  - `breaks: true` — 🔴 41편이 단일 개행 = `<br>` 을 전제로 쓰였습니다. 끄면
 *                     문단이 통째로 뭉칩니다. 대신 `p` 안 `<br>` 이 많아지므로
 *                     행간을 1.8 로 넉넉히 잡습니다(§3-4)
 *  - `linkify: true` — 맨 URL 자동 링크
 */

import MarkdownIt from 'markdown-it';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItFootnote from 'markdown-it-footnote';

/* ------------------------------------------------------------
 * highlight.js — 언어 6개만 등록 (§6-2)
 * ------------------------------------------------------------
 * 🔴 `import hljs from 'highlight.js'` 는 **192개 언어를 전부** 번들합니다
 *    (원본 2.6MB). 그게 481KB gzip 단일 청크의 주원인이었습니다.
 *    `lib/core` + 실제로 쓰이는 6개만 등록합니다.
 *
 * 41편 실측 인포스트링 (펜스 169개):
 *   python 82 · jsx 36 · tsx 32 · javascript 7 · css 3 · xml 2 · json 1 · (없음) 6
 * → 6개 모듈로 **163/169(96.4%)** 를 덮습니다.
 *
 * `jsx`·`tsx` 는 각각 javascript·typescript 모듈에 **별칭으로 이미 들어 있어**
 * 따로 등록하지 않습니다(`hljs.getLanguage('jsx') → JavaScript` 확인).
 * ---------------------------------------------------------- */
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);

/**
 * 🔴 **`hljs.highlightAuto()` 를 쓰지 마세요.**
 *  ① 짧은 스니펫에서 언어 추론이 자주 틀립니다.
 *  ② 자동 추론은 **전체 언어 정의를 요구**해 위 번들 절감이 통째로 무의미해집니다.
 *
 * 인포스트링이 없거나 등록되지 않은 언어면 빈 문자열을 돌려주고, markdown-it 이
 * 원문을 이스케이프해 그대로 렌더합니다. **하이라이트 없는 코드는 결함이 아니라
 * 정상 상태**입니다 — `--color-text-body` 로 렌더되고 블록 규격은 동일합니다(§6-2).
 */
function highlight(code: string, language: string): string {
    if (language && hljs.getLanguage(language)) {
        try {
            return hljs.highlight(code, { language }).value;
        } catch {
            /* 실패하면 아래에서 원문 그대로 렌더합니다 */
        }
    }

    return '';
}

function createRenderer(): MarkdownIt {
    return (
        new MarkdownIt({ html: true, breaks: true, linkify: true, highlight })
            /*
             * 체크리스트·각주는 41편 사용 **0회**입니다. 그래도 유지하는 이유는
             * product.md 가 "현행 지원 기능 유지 [확정]" 이고 플러그인이 수 KB 로
             * 저렴하기 때문입니다(§7-2·§7-3). 스타일도 최소로만 정의돼 있습니다.
             *
             * `markdown-it-task-lists` 의 기본값이 `disabled: true` 입니다.
             * 🔴 옵션을 건드리지 마세요 — 읽기 전용 글에서 조작 가능한 체크박스는
             * "상태가 저장된다" 는 잘못된 기대를 만듭니다.
             */
            .use(markdownItTaskLists)
            .use(markdownItFootnote)
    );
}

/*
 * 렌더러는 모듈 단위 싱글턴입니다. 글마다 새로 만들면 플러그인 등록과 규칙
 * 컴파일이 매번 반복됩니다 — 41편을 오가는 SPA 에서 그 비용이 쌓입니다.
 *
 * ⚠️ `markdown-it-math` 의존성은 제거했습니다(§1-4). `markdown-it-katex` 와
 *    중복 등록돼 있었고 코드가 쓰는 건 katex 쪽이었습니다.
 */
const baseRenderer = createRenderer();

/** 수식이 실린 글에서만 만들어지는 두 번째 렌더러. 만들어지면 재사용합니다 */
let mathRenderer: MarkdownIt | null = null;

/**
 * 인라인 수식 `$…$` · 블록 수식 `$$…$$` 가 있는가.
 *
 * 코드펜스 안의 `$`(셸 프롬프트·통화)를 세지 않게 펜스를 먼저 걷어냅니다.
 * 실측상 `$` 는 6편에 나오지만 **수식 쌍은 1편 3회뿐**입니다.
 */
function hasMathDelimiters(markdown: string): boolean {
    return /\$\$?[^$\n]+\$\$?/.test(markdown.replace(/```[\s\S]*?```/g, ' '));
}

/**
 * 프론트매터를 걷어낸 본문을 렌더합니다.
 *
 * 🔴 **KaTeX 는 플러그인째 동적 로드입니다.** 명세(§7-1)는 CSS 21KB 만 조건부로
 *    지정했지만, 실제로 더 큰 건 `katex.min.js`(116KB 원본 · gzip 약 40KB)이고
 *    그건 플러그인이 정적으로 물고 들어옵니다. 둘 다 미루면 **40편이 katex 를
 *    한 바이트도 받지 않습니다.**
 *
 *    조건 판정을 렌더 **전에** 원문에서 하는 이유: 렌더 결과의 `class="katex"`
 *    로 판정하면 이미 플러그인이 번들에 들어와 있어야 합니다. 닭과 달걀입니다.
 *
 *    유일한 사용처는 `2023-01-09-Python-dictionary-data-type` 의 3개 표현이고
 *    그중 2개(`$A ∪ B$`·`$A ∩ B$`)는 지금도 유니코드 기호 때문에 파싱에 실패해
 *    평문으로 떨어집니다. `throwOnError: false` 로 그 동작을 **계약으로 고정**
 *    합니다 — 예외가 새어 나오면 그 글 전체가 렌더되지 않습니다.
 */
export async function renderPostMarkdown(markdown: string): Promise<string> {
    const body = markdown.replace(/^---[\s\S]*?---\n/, '');

    if (!hasMathDelimiters(body)) {
        return baseRenderer.render(body);
    }

    if (!mathRenderer) {
        const { default: markdownItKatex } = await import('markdown-it-katex');
        mathRenderer = createRenderer().use(markdownItKatex, {
            throwOnError: false,
            errorColor: 'inherit',
        });
    }

    return mathRenderer.render(body);
}
