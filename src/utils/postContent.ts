/**
 * 렌더된 본문 HTML 의 후처리 — **DOM 위에서** 합니다.
 * 명세: docs/handoff-step3-post.md §5-4 · §5-5 · §5-6 · §8-3 · §11-1
 *
 * 🔴 왜 마크다운 토큰이 아니라 DOM 인가 (이 STEP 의 핵심 판단)
 * ------------------------------------------------------------
 * 3편이 헤딩을 **원시 HTML `<h2 id="sectionN">`** 로 씁니다(총 8개).
 * `markdown-it-anchor` 같은 앵커 플러그인은 **마크다운 헤딩 토큰에만** id 를
 * 붙이므로 이 8개를 보지 못하고, 목차에서도 통째로 빠집니다.
 * 렌더 결과 DOM 을 훑으면 마크다운이든 원시 HTML 이든 똑같이 `<h2>` 입니다.
 *
 * 부수 효과로 **앵커 플러그인 의존성이 필요 없어집니다.** id 규칙이 인덱스 기반
 * (`heading-<n>`)이라 플러그인의 slug 생성 기능도 쓸 일이 없습니다(§5-5).
 *
 * ⚠️ 이 모듈은 `DOMParser` 를 쓰므로 **브라우저 전용**입니다. 빌드 스크립트에서
 *    부르지 마세요.
 */

/** 목차 항목 1건 */
export interface PostHeading {
    /** `heading-<n>`. 문서 순서 기반이라 **중복이 원천적으로 발생하지 않습니다** */
    id: string;
    /** 2 | 3. h4 는 목차에 넣지 않습니다(§8-3) */
    level: number;
    /**
     * 🔴 `textContent` 입니다. `innerHTML` 이면 최장 헤딩(101자)이 `[MDN](url)`
     *    링크를 품고 있어 **목차 `<a>` 안에 또 `<a>`** 가 생깁니다. 중첩 `<a>` 는
     *    유효하지 않은 HTML 이라 브라우저가 임의로 교정하고, 클릭 대상이
     *    예측 불가가 됩니다(§8-3).
     */
    text: string;
}

export interface TransformedContent {
    html: string;
    headings: PostHeading[];
    /**
     * KaTeX 가 실제로 렌더됐는가. 소비처가 이 값으로 **CSS 21KB 를 조건부 로드**합니다.
     * 41편 중 1편만 true 입니다 — 나머지 40편은 0KB(§7-1).
     */
    hasMath: boolean;
}

export type ImageSizeMap = Record<string, { width: number; height: number }>;

/**
 * 전역 클래스 이름. CSS Modules 가 해시하지 않도록 `Post.module.css` 에서
 * `:global(...)` 로 받습니다. 문자열이 두 곳에 있으므로 **한쪽만 고치지 마세요.**
 */
export const CONTENT_CLASS = {
    figure: 'post-figure',
    matte: 'post-matte',
    caption: 'post-caption',
    imageError: 'post-image-error',
    tableWrap: 'post-table-wrap',
    codeBlock: 'post-code-block',
    codeHeader: 'post-code-header',
    codeLang: 'post-code-lang',
    copyButton: 'post-copy-button',
    externalMark: 'post-external-mark',
} as const;

/** 코드 복사 버튼을 위임 처리로 식별하는 표식 */
export const COPY_BUTTON_ATTRIBUTE = 'data-copy-code';

/* ------------------------------------------------------------
 * 개별 변환
 * ---------------------------------------------------------- */

/**
 * 🔴 본문 `h1` → `h2` 강등. **22편 / 40개**가 해당합니다.
 *
 * 페이지의 `h1` 은 글 제목 하나여야 합니다. 본문에 또 있으면 문서 개요가 깨지고
 * 스크린리더의 헤딩 목록에서 "이 문서의 제목이 무엇인가" 가 모호해집니다.
 *
 * 부수 효과가 더 큽니다 — 강등하면 `2023-04-13-Cloud-SaaS-IaaS-PaaS`(h1 4개)와
 * `2022-12-26-React-Redux`(h1 1개)처럼 **h1 만으로 구조를 잡은 글**이 목차를
 * 갖게 됩니다. 강등 없이는 이 글들이 목차 0개입니다(§5-5).
 */
function demoteBodyHeadings(root: HTMLElement): void {
    for (const h1 of Array.from(root.querySelectorAll('h1'))) {
        const h2 = root.ownerDocument.createElement('h2');

        for (const attribute of Array.from(h1.attributes)) {
            h2.setAttribute(attribute.name, attribute.value);
        }
        h2.innerHTML = h1.innerHTML;
        /* QA·디버깅용 흔적. 스타일에는 쓰지 않습니다 */
        h2.setAttribute('data-demoted-from', 'h1');

        h1.replaceWith(h2);
    }
}

/**
 * 목차용 id 부여 + 수집.
 *
 * id 를 **문서 순서 인덱스**로 만드는 이유(§5-5):
 *  1. 헤딩 대부분이 한글입니다. slug 화하면 프래그먼트가 퍼센트 인코딩되어
 *     주소창이 흉해지고 공유 링크가 읽히지 않습니다.
 *  2. **중복 헤딩이 3편에 있습니다**(`입출력 예` 2회 등). 텍스트 기반 id 면
 *     충돌 회피 접미사가 필요하고, 글을 고칠 때마다 링크가 깨집니다.
 *     인덱스 기반이면 중복이 원천적으로 발생하지 않습니다.
 *
 * ⚠️ 원시 HTML 헤딩이 이미 `id="section1"` 을 갖고 있어도 **덮어씁니다.**
 *    한 글 안에서 마크다운 헤딩과 섞이면 규칙이 둘이 되고, 목차 링크와
 *    실제 id 가 어긋날 여지가 생깁니다.
 */
function collectHeadings(root: HTMLElement): PostHeading[] {
    const headings: PostHeading[] = [];

    Array.from(root.querySelectorAll('h2, h3')).forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.setAttribute('id', id);

        headings.push({
            id,
            level: heading.tagName === 'H2' ? 2 : 3,
            text: (heading.textContent ?? '').replace(/\s+/g, ' ').trim(),
        });
    });

    /* 텍스트가 빈 헤딩은 목차에 넣어도 누를 것이 없습니다 */
    return headings.filter(heading => heading.text.length > 0);
}

/**
 * 🔴 `<script>` 제거 (6편, 총 6개).
 *
 * `dangerouslySetInnerHTML` 로 삽입된 `<script>` 는 브라우저가 **실행하지
 * 않습니다**(HTML5 명세). 그래서 지금은 무해합니다. 그런데도 지우는 이유는
 * **나중에 삽입 방식을 바꾸는 순간 조용히 실행되기 때문**입니다.
 * 실행되지 않는 폭탄을 DOM 에 남겨 둘 이유가 없습니다(§5-6).
 *
 * 실제 유입 경로 하나는 오타입니다 — `2023-02-26-Front-end-cs-browser-rendering`
 * 이 백틱 **2개**(``html)로 코드 펜스를 열어서 그 안의 `<html><body><script>`
 * 가 코드가 아니라 진짜 마크업으로 렌더됩니다. 41편 무수정 원칙이라 md 는
 * 고치지 않고 렌더 시 제거만 합니다.
 */
function removeScripts(root: HTMLElement): void {
    for (const script of Array.from(root.querySelectorAll('script'))) {
        script.remove();
    }
}

/**
 * 표를 가로 스크롤 래퍼로 감쌉니다(8편).
 *
 * 🔴 없으면 **페이지 전체가 가로 스크롤**됩니다. 본문 폭이 640px 인데 4열 이상
 *    표가 들어가면 표가 컬럼을 밀어냅니다. `markdown-it` 은 래퍼를 만들어 주지
 *    않습니다(§5-3).
 *
 * `tabindex="0"` 은 키보드만 쓰는 사용자가 스크롤 영역에 들어갈 수 있게 합니다 —
 * 스크롤되는 영역은 포커스를 받을 수 있어야 합니다.
 */
function wrapTables(root: HTMLElement): void {
    for (const table of Array.from(root.querySelectorAll('table'))) {
        const wrapper = root.ownerDocument.createElement('div');
        wrapper.className = CONTENT_CLASS.tableWrap;
        wrapper.setAttribute('tabindex', '0');
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', '표');

        table.replaceWith(wrapper);
        wrapper.appendChild(table);
    }
}

/**
 * 코드 블록에 헤더(복사 버튼)를 붙이고 `hljs` 클래스를 겁니다.
 *
 * `hljs` 클래스가 필요한 이유: 신택스 색을 `.hljs-*` 에 매핑하면서 **하이라이트
 * 안 된 코드의 기본색**을 `.hljs` 에 걸어 뒀습니다(§6-3). markdown-it 은
 * `language-*` 만 붙이므로 여기서 추가합니다.
 *
 * 🔴 hljs 기성 테마 CSS 를 import 하지 않습니다. 모든 기성 테마가 자기 배경색을
 *    강제해서(`.hljs { background: … }`) 우리 테마 배경과 충돌하고, 라이트/다크
 *    두 개를 같이 넣으면 **명시적 테마 토글이 죽습니다**(§6-3).
 */
function decorateCodeBlocks(root: HTMLElement): void {
    const document = root.ownerDocument;

    for (const pre of Array.from(root.querySelectorAll('pre'))) {
        const code = pre.querySelector('code');
        if (!code) {
            continue;
        }

        code.classList.add('hljs');

        const languageClass = Array.from(code.classList).find(name =>
            name.startsWith('language-'),
        );
        const language = languageClass ? languageClass.replace('language-', '') : '';

        const block = document.createElement('figure');
        block.className = CONTENT_CLASS.codeBlock;

        const header = document.createElement('figcaption');
        header.className = CONTENT_CLASS.codeHeader;

        /*
         * 파일명 행은 41편에 없습니다 — 인포스트링이 언어명뿐입니다. 언어 라벨만
         * 둡니다. 인포스트링이 없는 6개 블록은 라벨도 없이 복사 버튼만 나옵니다(§6-1).
         */
        if (language) {
            const label = document.createElement('span');
            label.className = CONTENT_CLASS.codeLang;
            label.textContent = language;
            header.appendChild(label);
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = CONTENT_CLASS.copyButton;
        button.setAttribute(COPY_BUTTON_ATTRIBUTE, '');
        /* 확정 카피 — WRITING_GUIDE §6.1 */
        button.setAttribute('aria-label', '코드 복사');
        button.textContent = '복사';
        header.appendChild(button);

        pre.replaceWith(block);
        block.appendChild(header);
        block.appendChild(pre);
    }
}

/** `figure > div.matte > img` 한 벌을 만듭니다 */
function buildFigure(image: HTMLImageElement, sizes: ImageSizeMap): HTMLElement {
    const document = image.ownerDocument;
    const figure = document.createElement('figure');
    figure.className = CONTENT_CLASS.figure;

    const matte = document.createElement('div');
    matte.className = CONTENT_CLASS.matte;

    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');

    /*
     * 🔴 `width`/`height` 는 CLS 방어의 유일한 확실한 수단이고, 여기서는
     *    **기능 요구사항**이기도 합니다. 없으면 이미지가 로드될 때마다 문서
     *    높이가 변하고 읽기 진행바가 그때마다 뒤로 튑니다(§11-2·§8-2).
     *    `mongodb-local` 은 이미지가 13장이라 13번 튑니다.
     *    CSS 의 `width:100%; height:auto` 와 함께 써서 반응형은 유지됩니다.
     */
    const size = sizes[image.getAttribute('src') ?? ''];
    if (size) {
        image.setAttribute('width', String(size.width));
        image.setAttribute('height', String(size.height));
    }

    const alt = image.getAttribute('alt')?.trim() ?? '';

    image.replaceWith(figure);
    matte.appendChild(image);
    figure.appendChild(matte);

    if (alt) {
        const caption = document.createElement('figcaption');
        caption.className = CONTENT_CLASS.caption;
        caption.textContent = alt;
        figure.appendChild(caption);

        /*
         * 🔴 캡션을 렌더하면 `alt` 를 **비웁니다.** 둘 다 두면 스크린리더가 같은
         *    문장을 두 번 읽습니다(WRITING_GUIDE §7.1).
         *    원문은 `data-alt` 에 남깁니다 — 로드 실패 시 그 텍스트를 다시
         *    보여 줘야 정보가 사라지지 않습니다(§12-3).
         */
        image.setAttribute('data-alt', alt);
        image.setAttribute('alt', '');
    } else {
        image.setAttribute('alt', '');
        image.setAttribute('role', 'presentation');
    }

    return figure;
}

/**
 * 본문 이미지 매트(액자) — 25편 113장에 **예외 없이 일괄 적용**합니다.
 *
 * 종류를 판별하는 로직을 만들지 않는 이유: 판별 실패가 매트보다 큰 비용입니다.
 * 그리고 매트는 `filter` 를 **쓰지 않으므로**(패딩·배경·보더뿐) 사진·GIF 가
 * 섞여 있어도 이미지 픽셀이 전혀 변하지 않습니다 — 부작용이 없습니다(§2-3).
 *
 * ⚠️ `figure` 는 `p` 안에 들어갈 수 없습니다. `breaks: true` 라 이미지가 대부분
 *    `<p><img><br><img></p>` 형태로 나오므로, **문단이 이미지·개행뿐이면 문단을
 *    통째로 치환**합니다. 글이 섞인 문단에서는 이미지를 인라인으로 남기고
 *    속성(lazy·크기)만 붙입니다 — 무효한 마크업을 만드는 것보다 낫습니다.
 */
function wrapImages(root: HTMLElement, sizes: ImageSizeMap): void {
    for (const paragraph of Array.from(root.querySelectorAll('p'))) {
        const images = Array.from(paragraph.querySelectorAll('img'));
        if (images.length === 0) {
            continue;
        }

        const isImageOnly = Array.from(paragraph.childNodes).every(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                return (node.textContent ?? '').trim() === '';
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return false;
            }
            const tag = (node as Element).tagName;
            return tag === 'IMG' || tag === 'BR';
        });

        if (!isImageOnly) {
            continue;
        }

        const figures = images.map(image => buildFigure(image, sizes));
        paragraph.replaceWith(...figures);
    }

    /* 문단 밖에 있거나 글과 섞인 나머지 — 속성만 보강합니다 */
    for (const image of Array.from(root.querySelectorAll('img'))) {
        image.setAttribute('loading', 'lazy');
        image.setAttribute('decoding', 'async');

        const size = sizes[image.getAttribute('src') ?? ''];
        if (size && !image.hasAttribute('width')) {
            image.setAttribute('width', String(size.width));
            image.setAttribute('height', String(size.height));
        }
    }
}

/**
 * 외부 링크에 새 창 표식을 붙입니다(§5-3).
 *
 * `↗` 는 **장식**이라 `aria-hidden` 이고, 대신 접근 가능한 이름에 `(새 창)` 을
 * 넣습니다. 기호만 두면 스크린리더 사용자는 새 창이 열린다는 것을 모릅니다.
 */
function markExternalLinks(root: HTMLElement): void {
    for (const link of Array.from(root.querySelectorAll('a[href]'))) {
        const href = link.getAttribute('href') ?? '';

        if (!/^https?:\/\//i.test(href) || href.includes(window.location.host)) {
            continue;
        }

        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.setAttribute('aria-label', `${link.textContent?.trim() ?? href} (새 창)`);

        const mark = root.ownerDocument.createElement('span');
        mark.className = CONTENT_CLASS.externalMark;
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = '↗';
        link.appendChild(mark);
    }
}

/* ------------------------------------------------------------
 * 진입점
 * ---------------------------------------------------------- */

/**
 * 렌더된 HTML 을 화면에 넣을 수 있는 형태로 바꾸고, 같은 순회에서 목차를 뽑습니다.
 *
 * 목차를 **여기서** 뽑는 이유: React 가 그린 뒤에 `querySelectorAll` 로 다시
 * 훑으면 "본문은 있는데 목차는 아직 없는" 프레임이 한 번 생겨 목차 컬럼이
 * 늦게 나타납니다. 같은 DOM 을 한 번만 훑으면 본문과 목차가 같은 커밋에 올라갑니다.
 */
export function transformPostContent(
    renderedHtml: string,
    imageSizes: ImageSizeMap = {},
): TransformedContent {
    const parsed = new DOMParser().parseFromString(
        `<div id="root">${renderedHtml}</div>`,
        'text/html',
    );
    const root = parsed.getElementById('root');

    if (!root) {
        return { html: renderedHtml, headings: [], hasMath: false };
    }

    /* 순서가 중요합니다 — 강등이 끝난 뒤에 id 를 매겨야 h1 출신도 목차에 들어갑니다 */
    removeScripts(root);
    demoteBodyHeadings(root);
    const headings = collectHeadings(root);

    wrapTables(root);
    decorateCodeBlocks(root);
    wrapImages(root, imageSizes);
    markExternalLinks(root);

    return {
        html: root.innerHTML,
        hasMath: root.querySelector('.katex') !== null,
        headings,
    };
}
