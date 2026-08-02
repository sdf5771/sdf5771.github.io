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

/**
 * 지연 로드 · 크기 속성.
 *
 * 🔴 `width`/`height` 는 CLS 방어의 유일한 확실한 수단이고, 여기서는
 *    **기능 요구사항**이기도 합니다. 없으면 이미지가 로드될 때마다 문서
 *    높이가 변하고 읽기 진행바가 그때마다 뒤로 튑니다(§11-2·§8-2).
 *    `mongodb-local` 은 이미지가 13장이라 13번 튑니다.
 *    CSS 의 `width:100%; height:auto` 와 함께 써서 반응형은 유지됩니다.
 */
function applyImageAttributes(image: HTMLImageElement, sizes: ImageSizeMap): void {
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');

    const size = sizes[image.getAttribute('src') ?? ''];
    if (size && !image.hasAttribute('width')) {
        image.setAttribute('width', String(size.width));
        image.setAttribute('height', String(size.height));
    }
}

/**
 * `figure > div.matte > (img 또는 img 를 감싼 <a>)` 한 벌을 만듭니다.
 *
 * `carrier` 는 매트 안으로 옮길 노드입니다. 보통 `<img>` 자신이지만
 * `[![alt](img)](link)` 처럼 링크로 감싼 이미지면 `<a>` 가 넘어옵니다 —
 * 이미지만 꺼내면 링크가 조용히 사라집니다.
 *
 * `captionNodes` 는 마크다운에서 이미지 **다음 줄** 또는 **같은 줄 앞쪽**에 적힌
 * 캡션입니다. 없으면 `alt` 를 캡션으로 씁니다.
 *
 * `captionFirst` 는 캡션을 `<figure>` 의 **첫 자식**으로 놓을지입니다.
 * 원문이 `( PC 버전의 네이버) ![img]` 처럼 라벨을 앞에 적은 경우, 캡션을 뒤로
 * 옮기면 읽는 순서가 원문과 달라집니다. `<figcaption>` 은 사양상 `<figure>` 의
 * 첫 자식 또는 마지막 자식 어느 쪽이든 유효합니다.
 */
function buildFigure(
    image: HTMLImageElement,
    sizes: ImageSizeMap,
    carrier: Node,
    captionNodes: Node[] | null,
    captionFirst = false,
): HTMLElement {
    const document = image.ownerDocument;
    const figure = document.createElement('figure');
    figure.className = CONTENT_CLASS.figure;

    const matte = document.createElement('div');
    matte.className = CONTENT_CLASS.matte;

    applyImageAttributes(image, sizes);

    const alt = image.getAttribute('alt')?.trim() ?? '';

    matte.appendChild(carrier);
    figure.appendChild(matte);

    const caption = document.createElement('figcaption');
    caption.className = CONTENT_CLASS.caption;

    if (captionNodes && captionNodes.length > 0) {
        /*
         * 원문 노드를 그대로 옮깁니다. `textContent` 로 납작하게 만들면
         * 캡션 안의 `<code>`·`<a>` 가 문자열로 노출됩니다 — 실제로
         * `client-side-ai` 12장의 캡션이 `<code>` 를 품고 있습니다.
         */
        for (const node of captionNodes) {
            caption.appendChild(node);
        }
    } else if (alt) {
        caption.textContent = alt;
        /*
         * 🔴 이 캡션은 저자가 쓴 것이 아니라 `alt` 를 옮겨 온 것입니다.
         *    바로 뒤에 같은 문장이 본문으로 또 오면 지워야 하는데, 그 판정은
         *    다음 형제 블록을 볼 수 있는 호출부에서만 가능합니다(§F-2).
         *    표시는 임시이고 promoteImageLines 가 반드시 걷어냅니다.
         */
        figure.setAttribute(CAPTION_FROM_ALT_ATTRIBUTE, 'true');
    }

    if (caption.childNodes.length > 0) {
        if (captionFirst) {
            figure.insertBefore(caption, figure.firstChild);
        } else {
            figure.appendChild(caption);
        }

        /*
         * 🔴 캡션을 렌더하면 `alt` 를 **비웁니다.** 둘 다 두면 스크린리더가 같은
         *    문장을 두 번 읽습니다(WRITING_GUIDE §7.1).
         *    원문은 `data-alt` 에 남깁니다 — 로드 실패 시 그 텍스트를 다시
         *    보여 줘야 정보가 사라지지 않습니다(§12-3).
         */
        if (alt) {
            image.setAttribute('data-alt', alt);
        }
        image.setAttribute('alt', '');
    } else {
        image.setAttribute('alt', '');
        image.setAttribute('role', 'presentation');
    }

    return figure;
}

/* ------------------------------------------------------------
 * 문단 분해 — §2-3 (2026-08-01 판정)
 * ---------------------------------------------------------- */

/**
 * 컨테이너를 `<br>` 기준으로 **줄** 단위로 쪼갭니다.
 *
 * `breaks: true` 라 마크다운의 단일 개행이 전부 `<br>` 이 됩니다. 즉 렌더된
 * `<p>`·`<li>` 하나는 원문에서 **여러 줄**이었고, 이미지와 캡션의 관계는 그 줄
 * 경계에 담겨 있습니다. 줄로 되돌리지 않으면 관계를 볼 수 없습니다.
 */
function splitParagraphLines(paragraph: HTMLElement): ChildNode[][] {
    const lines: ChildNode[][] = [[]];

    for (const node of Array.from(paragraph.childNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
            lines.push([]);
        } else {
            lines[lines.length - 1].push(node);
        }
    }

    return lines;
}

function isBlankNode(node: Node): boolean {
    return node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() === '';
}

/** 줄에 글자가 있는가. `<img>` 는 `textContent` 가 비어 있어 세지 않습니다 */
function hasLineText(line: ChildNode[]): boolean {
    return line.some(node => (node.textContent ?? '').trim() !== '');
}

/** `buildFigure` → `promoteImageLines` 전용 임시 표시. DOM 에 남기지 않습니다 */
const CAPTION_FROM_ALT_ATTRIBUTE = 'data-caption-from-alt';

/**
 * 캡션 중복 판정용 키.
 *
 * 캡션은 흔히 `(…)` 로 감싸고 공백도 제각각이라, 괄호·공백·제어문자를 벗겨야
 * *같은 문장인지*를 사실로 비교할 수 있습니다. 실제로 `2025-03-13` 의
 * `alt="1999년 당시의 네이버"` 와 본문 `(1999년 당시의 네이버)` 가 이 관계입니다.
 * (원문에는 눈에 보이지 않는 제어문자도 섞여 있습니다.)
 *
 * 🔴 **내용을 추정하지 않습니다.** 두 문자열이 같은지만 봅니다 — §2-3 이 금지한
 *    "이미지 종류 판별" 류의 휴리스틱이 아닙니다.
 */
function captionKey(value: string): string {
    return value
        .normalize('NFC')
        .replace(/[\p{C}\s()[\]（）]/gu, '')
        .toLowerCase();
}

/** 이 노드가 이미지를 품고 있는가 */
function nodeHasImage(node: ChildNode): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }

    const element = node as Element;
    return element.tagName === 'IMG' || element.querySelector('img') !== null;
}

interface FigureUnit {
    /** 매트 안으로 옮길 노드 — `<img>` 이거나 이미지 하나만 품은 래퍼(`<a>` 등) */
    carrier: ChildNode;
    image: HTMLImageElement;
}

/** 줄 안의 이미지들을 감싸는 노드와 짝지어 돌려줍니다 */
function collectFigureUnits(line: ChildNode[]): FigureUnit[] {
    const units: FigureUnit[] = [];

    for (const node of line) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }

        const element = node as Element;
        const images =
            element.tagName === 'IMG'
                ? [element as HTMLImageElement]
                : Array.from(element.querySelectorAll('img'));

        for (const image of images) {
            /* 래퍼가 이미지를 여럿 품고 있으면 래퍼째 옮길 수 없으므로 이미지만 꺼냅니다 */
            units.push({ carrier: images.length === 1 ? node : image, image });
        }
    }

    return units;
}

/**
 * 본문 이미지 매트(액자) — 25편 113장에 **예외 없이 일괄 적용**합니다.
 *
 * 종류를 판별하는 로직을 만들지 않는 이유: 판별 실패가 매트보다 큰 비용입니다.
 * 그리고 매트는 `filter` 를 **쓰지 않으므로**(패딩·배경·보더뿐) 사진·GIF 가
 * 섞여 있어도 이미지 픽셀이 전혀 변하지 않습니다 — 부작용이 없습니다(§2-3).
 *
 * 🔴 **문단을 분해합니다**(2026-08-01 판정 · §2-3).
 * ------------------------------------------------------------
 * `figure` 는 `p` 안에 들어갈 수 없습니다. 직전 구현은 "문단이 이미지·개행뿐일
 * 때만" 승격해서 **113장 중 46장에 매트가 붙지 않았고**, 하필 2025년 글 3편과
 * `mongodb-local` 이 통째로 빠졌습니다. `breaks: true` 때문에 `![img]` 다음 줄
 * 캡션이 같은 `<p>` 안에 `<img><br>텍스트` 로 들어오기 때문입니다.
 *
 * ```
 * 블록 수준에 놓인 <img> 는 부모가 무엇이든 전부 <figure> 로 승격한다.
 * 승격 시 그 이미지 직후의 <br> + 텍스트는 <figcaption> 이 된다.
 * 이미지 앞뒤가 모두 텍스트인 경우(인라인 배지 등)에만 승격하지 않는다.
 * ```
 *
 * | 입력 줄 | 출력 |
 * |---|---|
 * | `<img>` 단독 | `<figure><img></figure>` |
 * | `<img><br>캡션` | `<figure><img><figcaption>캡션</figcaption></figure>` |
 * | `텍스트<br><img>` | `텍스트` + `<figure><img></figure>` |
 * | `<img><br><img><br>캡션` | 각각 `<figure>`, 캡션은 **직전** 이미지에 |
 * | `텍스트<img>텍스트` | 승격 안 함 — 인라인 이미지 |
 * | **`라벨) <img>`** | **`<figure><figcaption>라벨</figcaption><img></figure>`** |
 *
 * 🔴 **한쪽에만 텍스트가 있으면 그 텍스트가 캡션입니다**(2026-08-02 web-design 판정).
 * ------------------------------------------------------------
 * 확정 규칙은 *"앞뒤가 **모두** 텍스트인 경우**에만** 승격하지 않는다"* 였는데,
 * 구현이 "같은 줄에 텍스트가 있으면 인라인" 이라는 **더 좁은 해석**을 적용해
 * `- ( PC 버전의 네이버) ![img]` 두 줄이 승격에서 빠져 있었습니다. 규칙이 그것을
 * 배제한 적은 없습니다 — 규칙 확장이 아니라 해석 정정입니다.
 *
 * 앞에 오는 라벨은 `<figcaption>` 을 `<figure>` 의 **첫 자식**으로 둡니다.
 * 뒤로 옮기면 원문의 읽는 순서가 바뀝니다.
 *
 * 🔴 **부모 태그를 열거하지 않습니다**(2026-08-02 판정).
 * ------------------------------------------------------------
 * 직전 구현은 `<p>` 만 훑어서 `<li>` 안 5장이 매트 없이 남았습니다. 목록을
 * 조건에 추가하는 대신 **배치 수준**으로 규칙을 바꿉니다 — "블록 컨테이너 안에서
 * 한 줄을 통째로 차지하는 이미지". 그래야 `<blockquote>`·표 칸에 이미지가
 * 나와도 여기를 다시 고칠 일이 없습니다. 목표 113/113.
 *
 * ⚠️ §2-3 의 *"이미지 종류를 판별하는 로직을 만들지 마세요"* 가 금지한 것은
 *    **내용 기반 분류**(스크린샷인지 도표인지 추정)입니다. 배치를 보고 승격하는
 *    것은 구조 변환이고, 오히려 "예외 없이 일괄 적용" 을 달성하는 수단입니다.
 *
 * ⚠️ **`breaks: true` 를 끄지 마세요.** 41편 전체의 줄바꿈 렌더가 바뀝니다.
 */

/**
 * 이미지가 놓인 "줄" 의 주인이 되는 블록 컨테이너.
 * 여기 없는 태그(`<strong>`·`<a>` 등)는 인라인이므로 계속 위로 올라갑니다.
 */
const LINE_OWNER_TAGS = new Set(['P', 'LI', 'BLOCKQUOTE', 'TD', 'TH', 'DD', 'DT']);

function findLineOwner(image: Element, root: HTMLElement): HTMLElement | null {
    let node = image.parentElement;

    while (node && node !== root) {
        /* 이미 매트 안입니다 — 두 번 감싸지 않습니다 */
        if (node.tagName === 'FIGURE') {
            return null;
        }
        if (LINE_OWNER_TAGS.has(node.tagName)) {
            return node;
        }
        node = node.parentElement;
    }

    return null;
}

/**
 * 컨테이너 하나를 줄 단위로 훑어 이미지 줄을 `<figure>` 로 바꿉니다.
 *
 * 🔴 `<p>` 만 자기 자신을 교체합니다. `<figure>` 는 `<p>` 안에 들어갈 수 없어
 *    파서가 문단을 강제로 닫아 버리기 때문입니다. `<li>`·`<td>` 등은 `<figure>`
 *    를 그대로 품을 수 있으므로 **자식만 갈아 끼웁니다** — 목록 구조를 유지해야
 *    마커 정렬이 흔들리지 않습니다.
 */
interface LineAnalysis {
    units: FigureUnit[];
    /** 이 줄을 `<figure>` 로 바꿀 수 있는가 */
    isPromotable: boolean;
    /** 같은 줄에서 캡션이 되는 텍스트 노드들. 없으면 `null` */
    inlineCaption: ChildNode[] | null;
    /** 그 캡션이 이미지 **앞**에 있었는가 */
    isCaptionLeading: boolean;
}

/**
 * 한 줄에서 이미지와 텍스트의 배치를 봅니다.
 *
 * ```
 * 텍스트 <img> 텍스트   → 인라인. 승격하지 않음
 * 텍스트 <img>          → 승격. 앞 텍스트가 캡션(첫 자식)
 * <img> 텍스트          → 승격. 뒤 텍스트가 캡션
 * <img>                 → 승격. 캡션은 다음 줄에서 찾음
 * ```
 *
 * 이미지가 여럿이고 그 **사이**에 글자가 있으면 인라인으로 봅니다 — 어느 이미지의
 * 캡션인지 정할 근거가 없고, 잘못 붙이면 엉뚱한 그림에 설명이 달립니다.
 */
function analyzeLine(line: ChildNode[]): LineAnalysis {
    const units = collectFigureUnits(line);
    const empty: LineAnalysis = {
        units,
        isPromotable: false,
        inlineCaption: null,
        isCaptionLeading: false,
    };

    if (units.length === 0) {
        return empty;
    }

    const imageIndexes = line.reduce<number[]>((indexes, node, index) => {
        if (nodeHasImage(node)) {
            indexes.push(index);
        }
        return indexes;
    }, []);

    const first = imageIndexes[0];
    const last = imageIndexes[imageIndexes.length - 1];

    const before = line.slice(0, first);
    const after = line.slice(last + 1);
    const between = line.slice(first, last + 1).filter(node => !nodeHasImage(node));

    const hasBefore = hasLineText(before);
    const hasAfter = hasLineText(after);

    /* 양옆이 모두 텍스트이거나 이미지 사이에 글자가 있으면 인라인입니다 */
    if ((hasBefore && hasAfter) || hasLineText(between)) {
        return empty;
    }

    if (hasBefore) {
        return { units, isPromotable: true, inlineCaption: before, isCaptionLeading: true };
    }

    if (hasAfter) {
        return { units, isPromotable: true, inlineCaption: after, isCaptionLeading: false };
    }

    return { units, isPromotable: true, inlineCaption: null, isCaptionLeading: false };
}

function promoteImageLines(container: HTMLElement, sizes: ImageSizeMap): void {
    const document = container.ownerDocument;
    const isParagraph = container.tagName === 'P';
    const lines = splitParagraphLines(container);

    /* 승격할 줄이 하나도 없으면 건드리지 않습니다(속성 보강은 호출부에서) */
    const hasFigureLine = lines.some(line => analyzeLine(line).isPromotable);
    if (!hasFigureLine) {
        return;
    }

    const output: Node[] = [];
    let pending: ChildNode[][] = [];

    /** 쌓아 둔 텍스트 줄들을 되돌립니다 — 줄 사이의 `<br>` 도 복원 */
    const flushText = () => {
        if (pending.length === 0) {
            return;
        }

        const lifted = pending;
        pending = [];

        if (!isParagraph) {
            /*
             * 컨테이너가 그대로 남으므로 원래 줄을 그대로 돌려놓습니다.
             * `<p>` 로 감싸면 tight 목록이 loose 로 바뀌어 항목 간격이 벌어집니다.
             */
            lifted.forEach((line, index) => {
                if (index > 0) {
                    output.push(document.createElement('br'));
                }
                output.push(...line);
            });
            return;
        }

        const block = document.createElement('p');
        lifted.forEach((line, index) => {
            if (index > 0) {
                block.appendChild(document.createElement('br'));
            }
            for (const node of line) {
                block.appendChild(node);
            }
        });

        if ((block.textContent ?? '').trim() !== '' || block.querySelector('img')) {
            output.push(block);
        }
    };

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const analysis = analyzeLine(line);

        /* 양옆이 모두 텍스트인 줄은 승격 대상이 아닙니다(인라인 배지 등) */
        if (!analysis.isPromotable) {
            if (line.some(node => !isBlankNode(node))) {
                pending.push(line);
            }
            continue;
        }

        flushText();

        /*
         * 같은 줄의 한쪽 텍스트가 이미 캡션이면 그것을 씁니다. 없을 때만
         * 다음 줄을 봅니다. **한 줄만** 가져갑니다 — 두 줄 이상을 삼키면 본문
         * 문단이 캡션으로 흡수됩니다.
         */
        let captionNodes = analysis.inlineCaption;

        if (!captionNodes) {
            const next = lines[index + 1];

            if (next && collectFigureUnits(next).length === 0 && hasLineText(next)) {
                captionNodes = next;
                index += 1;
            }
        }

        analysis.units.forEach((unit, unitIndex) => {
            /* 캡션은 **직전** 이미지의 것입니다 — 한 줄에 이미지가 여럿이면 마지막 */
            const isLast = unitIndex === analysis.units.length - 1;
            output.push(
                buildFigure(
                    unit.image,
                    sizes,
                    unit.carrier,
                    isLast ? captionNodes : null,
                    isLast && analysis.isCaptionLeading,
                ),
            );
        });
    }

    flushText();

    if (output.length === 0) {
        return;
    }

    resolveAltCaptions(container, output);

    if (isParagraph) {
        container.replaceWith(...output);
    } else {
        container.replaceChildren(...output);
    }
}

/**
 * `alt` 에서 만들어진 캡션을 확정하거나 걷어냅니다 (F-2).
 *
 * 🔴 **좁히는 조건: 바로 다음 블록이 같은 문장을 다시 말하면 캡션을 버립니다.**
 *
 * 원문에서 이미지와 캡션 사이에 **빈 줄**이 있으면 둘은 별개 블록이 되어
 * `captionNodes` 로 이어지지 못하고, `buildFigure` 가 `alt` 로 폴백합니다.
 * 그러면 `<figcaption>1999년 당시의 네이버</figcaption>` 바로 아래에 본문
 * `(1999년 당시의 네이버)` 가 또 나와 **같은 문장이 두 번** 보입니다.
 *
 * 판정은 추정이 아니라 **문자열 비교**입니다(괄호·공백·제어문자 제외). 다른 문장이
 * 뒤따르는 경우에는 아무것도 바꾸지 않으므로, 캡션이 없어야 할 그림에서 캡션이
 * 사라지는 부작용이 없습니다.
 *
 * 캡션을 버릴 때는 `alt` 를 **되돌려 놓습니다** — `buildFigure` 가 캡션을 렌더한다는
 * 전제로 비워 두었기 때문입니다. 비운 채로 두면 그림에 대체 텍스트가 사라집니다.
 */
function resolveAltCaptions(container: HTMLElement, output: readonly Node[]): void {
    const last = output[output.length - 1];

    const figures = output.filter(
        (node): node is HTMLElement =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node as HTMLElement).hasAttribute(CAPTION_FROM_ALT_ATTRIBUTE),
    );

    if (figures.length === 0) {
        return;
    }

    /*
     * 뒤따르는 문단은 **마지막 그림** 다음에만 옵니다. 다음 형제가 `<p>` 일
     * 때만 봅니다 — 다음 `<li>` 는 캡션이 아니라 다음 항목입니다.
     */
    const sibling = container.nextElementSibling;
    const followingKey =
        sibling && sibling.tagName === 'P' && sibling.querySelector('img') === null
            ? captionKey(sibling.textContent ?? '')
            : '';

    for (const figure of figures) {
        figure.removeAttribute(CAPTION_FROM_ALT_ATTRIBUTE);

        const image = figure.querySelector('img');
        const caption = figure.querySelector('figcaption');

        if (!image || !caption) {
            continue;
        }

        const alt = image.getAttribute('data-alt') ?? '';
        const isDuplicated =
            figure === last && followingKey !== '' && captionKey(alt) === followingKey;

        if (!isDuplicated) {
            continue;
        }

        caption.remove();
        image.removeAttribute('data-alt');
        image.setAttribute('alt', alt);
    }
}

function wrapImages(root: HTMLElement, sizes: ImageSizeMap): void {
    /*
     * 이미지에서 **위로** 올라가 주인을 찾습니다. 컨테이너를 셀렉터로 훑으면
     * `<li><p><img>` 처럼 중첩된 경우 바깥 `<li>` 까지 후보가 되어 같은 이미지를
     * 두 번 처리하게 됩니다. 가장 가까운 주인 하나만 남깁니다.
     */
    const owners = new Set<HTMLElement>();

    for (const image of Array.from(root.querySelectorAll('img'))) {
        const owner = findLineOwner(image, root);
        if (owner) {
            owners.add(owner);
        }
    }

    for (const owner of owners) {
        promoteImageLines(owner, sizes);
    }

    /* 컨테이너 밖에 있거나 글과 섞인 나머지 — 속성만 보강합니다 */
    for (const image of Array.from(root.querySelectorAll('img'))) {
        applyImageAttributes(image, sizes);
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
