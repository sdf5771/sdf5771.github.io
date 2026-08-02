import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './ConstellationHero.module.css';
import {
    buildConstellationModel,
    layoutConstellation,
    type ConstellationLayout,
    type ConstellationStar,
    type PlotBox,
} from './constellation/layout';
import {
    createBackgroundGradient,
    createSpriteSheet,
    drawConstellation,
    findNearestStar,
    readHeroPalette,
    type FrameState,
} from './constellation/renderer';
import { CATEGORY_SUMMARIES, POSTS } from '../../data/posts';
import { POST_LIST_PATH } from '../../constants/site';
import { useMediaMatch, MEDIA_REDUCED_MOTION } from '../../hooks';
import { MEDIA_DESKTOP, MEDIA_MOBILE } from '../../styles/breakpoints';
import { useTheme } from '../../theme';
import { formatPostDate, formatReadingMinutes } from '../../utils/postMeta';

/**
 * 홈 히어로 — 41편이 별 하나씩인 별자리.
 * 명세: docs/handoff-step2-home.md §3 · §4 · §7-1 · §7-2
 *
 * 이 그래픽은 감상용 배경이 아닙니다. 홈의 주 과업 중 "글이 41편 있고 어떤
 * 주제인지" 를 **말 없이** 전달하는 장치이고, 실데이터와 끊기는 순간 존재
 * 이유가 사라집니다(§2-1). 그래서 좌표·연결·밝기가 전부 `posts-data.json`
 * 에서 나옵니다 — 하드코딩된 `41` 이 이 파일에 없습니다.
 *
 * 🔴 canvas 가 없어도 홈은 완결됩니다. 텍스트·CTA·범례가 그대로 보이고
 *    레이아웃도 변하지 않습니다(§3-8). 히어로는 그 위에 얹히는 레이어입니다.
 */

/* ------------------------------------------------------------
 * 확정 카피 (§10) — 이 표의 문자열을 그대로 씁니다
 * ---------------------------------------------------------- */
const NAME = 'Seobisback';
const ROLE = 'Software Engineer';
const INTRO = '공부하거나 조사한 내용을 기록합니다.';
const PRIMARY_CTA = '최신 글 읽기';
const SECONDARY_CTA = '전체 글 보기';
const LATEST_LABEL = '가장 최근 글';
const GRAPHIC_CAPTION = '글 41편이 별 하나씩입니다. 같은 태그를 쓴 글끼리 이어집니다.';
const SKIP_LABEL = '별자리 목록 건너뛰기';

/*
 * 건너뛰기 링크의 목적지 id.
 *
 * 🔴 `useId()` 를 쓰지 않습니다. React 19 의 id 는 `«r0»` 처럼 비 ASCII 를
 *    포함해서 ① 주소창에 `#%C2%ABr0%C2%BB` 가 남고 ② `querySelector` 로는
 *    이스케이프 없이 못 찾습니다. 히어로는 페이지에 하나뿐이라 고정 id 가
 *    안전하고, 명세(§3-7)도 `#hero-end` 를 씁니다.
 */
const SKIP_TARGET_ID = 'hero-end';

/* ------------------------------------------------------------
 * 애니메이션 수명주기 (§4-2 · §4-3)
 * ---------------------------------------------------------- */

/** 연결선 순차 그리기 구간(초) */
const LINK_DRAW_SECONDS = 1.4;
/** 드리프트·맥동이 도는 구간(초) */
const MOTION_SECONDS = 12;
/** 진폭을 0 으로 감쇠하는 구간의 끝(초) */
const MOTION_STOP_SECONDS = 12.4;
/** 포인터가 히어로를 떠난 뒤 rAF 를 유지하는 시간(ms) */
const POINTER_TAIL_MS = 200;
/** 리사이즈 디바운스(ms) */
const RESIZE_DEBOUNCE_MS = 150;
/** 호버 히트 반경(px) */
const HIT_RADIUS = 16;

/* 패럴랙스 최대 이동량. 라이트는 "도표" 라 더 얌전합니다(§3-5) */
const PARALLAX = { dark: { x: 10, y: 7 }, light: { x: 7, y: 5 } };

/* ------------------------------------------------------------
 * 플롯 영역 (§3-2 (5))
 * ---------------------------------------------------------- */

type Breakpoint = 'sm' | 'md' | 'desktop';

/**
 * lg 이상에서는 플롯 자체를 텍스트 오른쪽으로 밀어냅니다.
 *
 * 🔴 라이트("페이퍼 위 도표")에서 잉크 점이 본문 글자 뒤에 깔리면 지저분해집니다.
 *    텍스트 블록의 실제 우측 끝을 재서 padLeft 를 잡습니다 — 명세는 xl 748 /
 *    lg 592 를 제시하지만, 그건 텍스트 폭이 명세값 그대로일 때의 결과입니다.
 *    서체 스왑·글자 수 변화에 따라오도록 측정값을 씁니다.
 */
function buildPlotBox(
    breakpoint: Breakpoint,
    width: number,
    height: number,
    textRight: number,
): PlotBox {
    if (breakpoint === 'sm') {
        return {
            width,
            height,
            padLeft: 18,
            padRight: 18,
            padTop: 14,
            padBottom: 14,
            minSeparation: 11,
        };
    }

    if (breakpoint === 'md') {
        /*
         * 텍스트가 위, 별이 아래인 단일 컬럼.
         *
         * 🔴 padBottom 이 명세의 48 이 아니라 110 입니다. §3-5 가 md 에도 요구하는
         *    캡션 링크(--tap-min 44px)가 히어로 바닥에 붙기 때문입니다 — 실측
         *    900×768 에서 링크가 바닥 84px 을 씁니다. 48 로 두면 별이 링크 글자
         *    뒤에 깔려, 라이트("페이퍼 위 도표")에서 §3-2 (5)가 막으려던 바로 그
         *    상태가 됩니다. 26px 은 여유입니다.
         */
        return {
            width,
            height,
            padLeft: 40,
            padRight: 40,
            padTop: 190,
            padBottom: 110,
            minSeparation: 14,
        };
    }

    /* 별이 들어갈 최소 폭 260px 은 남깁니다 — 텍스트가 길어져도 플롯이 사라지지 않게 */
    const padLeft = Math.min(Math.max(textRight + 40, 320), Math.max(320, width - 260));

    return {
        width,
        height,
        padLeft,
        padRight: 48,
        padTop: 56,
        /* 하단 64px 은 연도 눈금 자리입니다 */
        padBottom: 64,
        minSeparation: width >= 1280 ? 16 : 15,
    };
}

interface CanvasSize {
    width: number;
    height: number;
    textRight: number;
}

/* ------------------------------------------------------------
 * 컴포넌트
 * ---------------------------------------------------------- */

function ConstellationHero() {
    const heroRef = useRef<HTMLElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const slotRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const navigate = useNavigate();

    const { resolved: theme } = useTheme();
    const isMobileViewport = useMediaMatch(MEDIA_MOBILE);
    const isDesktopViewport = useMediaMatch(MEDIA_DESKTOP);

    /*
     * 🔴 CSS 전역 리셋으로는 canvas 가 멈추지 않습니다. rAF 로 도는 그림은
     *    `animation-duration: .01ms` 와 아무 상관이 없습니다 — JS 에서 직접
     *    읽어야 합니다(§4-1). 런타임 변경도 새로고침 없이 반영됩니다.
     */
    const prefersReducedMotion = useMediaMatch(MEDIA_REDUCED_MOTION);

    const breakpoint: Breakpoint = isMobileViewport ? 'sm' : isDesktopViewport ? 'desktop' : 'md';

    const [size, setSize] = useState<CanvasSize | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    /*
     * 🔴 커서 전용 상태입니다. `activeIndex` 로 커서를 정하면 안 됩니다 —
     *    그 값은 **대체 목록의 `onFocus`** 도 설정하기 때문에, 마우스를 빈 하늘에
     *    둔 채 키보드로 대체 링크에 Tab 하면 **빈 하늘에서 손가락 커서**가 됩니다.
     *    그건 이 화면이 막으려던 바로 그 상태("빈 하늘도 눌린다고 말하는 것")입니다.
     *
     *    강조(미리보기 카드·별 하이라이트)는 포인터든 키보드든 일어나야 하지만,
     *    커서는 **포인터의 사실**만 말해야 합니다. 그래서 두 상태를 분리합니다.
     */
    const [isPointerOnStar, setIsPointerOnStar] = useState(false);

    /* 뷰포트와 무관한 계산은 한 번만. 리사이즈해도 다시 하지 않습니다 */
    const model = useMemo(() => buildConstellationModel(POSTS), []);

    const layout: ConstellationLayout | null = useMemo(() => {
        if (!size || size.width < 1 || size.height < 1) {
            return null;
        }

        return layoutConstellation(
            model,
            buildPlotBox(breakpoint, size.width, size.height, size.textRight),
        );
    }, [model, size, breakpoint]);

    /** 최신순 41편. 대체 목록·CTA·캡션 링크가 씁니다 */
    const byRecency = useMemo(
        () => [...model.posts].slice().reverse(),
        [model.posts],
    );
    const latestPost = byRecency[0];

    /* --- 크기 관측 (150ms 디바운스) --- */
    useEffect(() => {
        const slot = slotRef.current;
        const text = textRef.current;
        if (!slot) {
            return;
        }

        let timer = 0;

        const measure = () => {
            const slotRect = slot.getBoundingClientRect();
            const textRect = text?.getBoundingClientRect();

            setSize(previous => {
                const next: CanvasSize = {
                    width: Math.round(slotRect.width),
                    height: Math.round(slotRect.height),
                    textRight: textRect ? Math.round(textRect.right - slotRect.left) : 0,
                };

                return previous &&
                    previous.width === next.width &&
                    previous.height === next.height &&
                    previous.textRight === next.textRight
                    ? previous
                    : next;
            });
        };

        /*
         * 🔴 디바운스가 없으면 드래그 리사이즈 중에 완화 패스(19,680회 거리 계산)와
         *    스프라이트 32장 굽기가 프레임마다 돕니다(§3-6).
         */
        const observer = new ResizeObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(measure, RESIZE_DEBOUNCE_MS);
        });

        measure();
        observer.observe(slot);
        if (text) {
            observer.observe(text);
        }

        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
        };
    }, [breakpoint]);

    /* --- 렌더 루프 --- */
    /*
     * 🔴 강조 상태는 ref 와 state 양쪽에 둡니다. canvas 는 React 렌더를 기다리지
     *    않고 즉시 다시 그려야 하고(그래야 호버가 한 프레임 늦지 않습니다),
     *    미리보기 카드는 DOM 이라 state 가 필요합니다. 렌더 중에 ref 를 쓰면
     *    그리는 시점에는 아직 이전 값입니다.
     */
    const activeIndexRef = useRef<number | null>(null);

    /** 포인터 핸들러가 부를 수 있는 "지금 한 장" */
    const requestFrameRef = useRef<(() => void) | null>(null);
    const parallaxTargetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const hero = heroRef.current;
        if (!canvas || !hero || !layout || !size) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            /* canvas 미지원 — 히어로 텍스트는 그대로입니다(§3-8) */
            return;
        }

        /* DPR 은 2 에서 자릅니다. 3배 화면에서 픽셀 수가 2.25배가 됩니다 */
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(size.width * dpr);
        canvas.height = Math.round(size.height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const palette = readHeroPalette(theme);
        const sprites = createSpriteSheet(palette, theme, dpr);
        const backgroundGradient =
            theme === 'dark'
                ? createBackgroundGradient(context, palette, size.width, size.height)
                : null;

        const plot = buildPlotBox(breakpoint, size.width, size.height, size.textRight);
        /*
         * 연도 눈금은 lg 이상에서만 그립니다.
         * sm 밴드는 높이 130px 이라 애초에 자리가 없고, md 는 플롯 아래 26px 이
         * 캡션 링크와 범례 차지라 눈금(20px)을 넣으면 겹칩니다. 시간축 정보는
         * lg 이상에서 전달되고, sm·md 에서는 캡션 링크가 최신 글을 직접 말합니다.
         */
        const tickBaseline =
            breakpoint === 'desktop' ? size.height - plot.padBottom + 20 : null;

        const frame: FrameState = {
            linkProgress: prefersReducedMotion ? 1 : 0,
            amplitude: 0,
            time: 0,
            parallaxX: 0,
            parallaxY: 0,
            activeIndex: null,
        };

        const render = () => {
            frame.activeIndex = activeIndexRef.current;
            drawConstellation({
                context,
                layout,
                palette,
                sprites,
                theme,
                width: size.width,
                height: size.height,
                backgroundGradient,
                state: frame,
                tickBaseline,
            });
        };

        let rafId = 0;
        let startedAt = 0;
        let pointerWakeUntil = 0;
        let isOnScreen = true;

        const step = (now: number) => {
            rafId = 0;

            if (!startedAt) {
                startedAt = now;
            }
            const elapsed = (now - startedAt) / 1000;

            frame.time = elapsed;
            frame.linkProgress = Math.min(1, elapsed / LINK_DRAW_SECONDS);

            /*
             * 🔴 WCAG 2.2.2 — 5초 이상 자동으로 움직이는 콘텐츠에는 정지 수단이
             *    필요합니다. 별도 버튼을 두는 대신 **스스로 멈춥니다.** 정상
             *    방문에서 rAF 가 도는 시간은 총 12.4초이고 그 뒤로는 0 입니다.
             */
            frame.amplitude =
                elapsed < MOTION_SECONDS
                    ? 1
                    : elapsed < MOTION_STOP_SECONDS
                      ? 1 - (elapsed - MOTION_SECONDS) / (MOTION_STOP_SECONDS - MOTION_SECONDS)
                      : 0;

            const target = parallaxTargetRef.current;
            frame.parallaxX += (target.x - frame.parallaxX) * 0.12;
            frame.parallaxY += (target.y - frame.parallaxY) * 0.12;

            render();

            const isSettling =
                Math.abs(target.x - frame.parallaxX) > 0.1 ||
                Math.abs(target.y - frame.parallaxY) > 0.1;
            const needsMore = elapsed < MOTION_STOP_SECONDS || now < pointerWakeUntil || isSettling;

            if (needsMore && isOnScreen && !document.hidden) {
                rafId = requestAnimationFrame(step);
            }
        };

        const startLoop = () => {
            /* 저감 모션이면 루프를 **아예 돌리지 않습니다.** 이벤트마다 한 장씩입니다 */
            if (prefersReducedMotion) {
                render();
                return;
            }

            if (!rafId && isOnScreen && !document.hidden) {
                rafId = requestAnimationFrame(step);
            }
        };

        const stopLoop = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
        };

        requestFrameRef.current = () => {
            if (prefersReducedMotion) {
                render();
                return;
            }

            pointerWakeUntil = performance.now() + POINTER_TAIL_MS;
            startLoop();
        };

        /* 첫 프레임. 저감 모션이면 연결선 33개가 **완성된 상태**로 한 번에 그려집니다 */
        render();
        startLoop();

        /* 히어로가 화면 밖이면 돌 이유가 없습니다 */
        const intersection = new IntersectionObserver(entries => {
            isOnScreen = entries[0]?.isIntersecting ?? true;
            if (isOnScreen) {
                startLoop();
            } else {
                stopLoop();
            }
        });
        intersection.observe(hero);

        const onVisibilityChange = () => {
            if (document.hidden) {
                stopLoop();
            } else {
                startLoop();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            stopLoop();
            intersection.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            requestFrameRef.current = null;
        };
    }, [layout, size, theme, breakpoint, prefersReducedMotion]);

    /** 강조 상태 갱신 + 즉시 한 장 다시 그리기 */
    const setActive = useCallback((index: number | null) => {
        activeIndexRef.current = index;
        setActiveIndex(index);
        requestFrameRef.current?.();
    }, []);

    /* --- 포인터 (데스크톱 전용) --- */
    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            /*
             * 🔴 터치 기기에서는 개별 별이 탭 대상이 아닙니다 — sm 최소 간격이
             *    11px 이라 44px 타깃에 4배 미달합니다(§3-5). 캡션 링크가 대신합니다.
             */
            if (event.pointerType !== 'mouse' || !layout || !slotRef.current) {
                return;
            }

            const rect = slotRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (!prefersReducedMotion) {
                const amount = theme === 'dark' ? PARALLAX.dark : PARALLAX.light;
                parallaxTargetRef.current = {
                    x: (x / rect.width - 0.5) * 2 * amount.x,
                    y: (y / rect.height - 0.5) * 2 * amount.y,
                };
            }

            const nearest = findNearestStar(layout.stars, x, y, HIT_RADIUS);
            setActive(nearest ? nearest.index : null);
            /* 커서는 **포인터가 실제로 별 위에 있을 때만** 바뀝니다 — 아래 주석 참고 */
            setIsPointerOnStar(nearest !== null);
        },
        [layout, prefersReducedMotion, setActive, theme],
    );

    const handlePointerLeave = useCallback(() => {
        parallaxTargetRef.current = { x: 0, y: 0 };
        setActive(null);
        setIsPointerOnStar(false);
    }, [setActive]);

    /*
     * 별 클릭 → 글로 이동 (§3-5 데스크톱 표).
     *
     * 🔴 미리보기 카드가 뜨는 것 자체가 "누를 수 있다" 는 약속입니다. 제목·
     *    카테고리·날짜·읽기시간을 보여 주고 클릭에 아무 반응이 없으면 그 약속이
     *    깨집니다. 카드와 이동은 **같은 히트 판정**(findNearestStar, 반경 16px)을
     *    쓰므로 "본 카드 ≠ 열린 글" 이 될 수 없습니다.
     *
     * 🔴 핸들러를 canvas 에 답니다. 히어로 전체에 달면 텍스트·CTA·범례·대체
     *    목록 위의 클릭까지 여기로 들어옵니다. canvas 는 z-index 가 가장 낮아
     *    (--z-base) 그 요소들에 가려지고, sm·md 에서는 pointer-events: none 이라
     *    아예 받지 않습니다.
     */
    const lastPointerTypeRef = useRef<string>('mouse');

    const handleCanvasPointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
        lastPointerTypeRef.current = event.pointerType;
    }, []);

    const handleCanvasClick = useCallback(
        (event: React.MouseEvent<HTMLCanvasElement>) => {
            /*
             * 터치로는 별을 열지 않습니다 — 히트 반경 16px 은 지름 32px 이라
             * --tap-min 44px 에 미달합니다(§3-5). 큰 화면의 터치 기기도 같습니다.
             */
            if (lastPointerTypeRef.current === 'touch' || !layout || !slotRef.current) {
                return;
            }

            const rect = slotRef.current.getBoundingClientRect();
            const nearest = findNearestStar(
                layout.stars,
                event.clientX - rect.left,
                event.clientY - rect.top,
                HIT_RADIUS,
            );

            if (nearest) {
                navigate(`/posts/${nearest.slug}`);
            }
        },
        [layout, navigate],
    );

    const activeStar: ConstellationStar | null =
        layout && activeIndex !== null
            ? layout.stars.find(star => star.index === activeIndex) ?? null
            : null;

    const latestStar = layout?.stars.find(star => star.rank === 0) ?? null;

    const canvasLabel = `글 ${POSTS.length}편으로 그린 별자리입니다. 가로축은 발행 시점, 선은 같은 태그를 쓴 글끼리 잇습니다. 가장 밝은 별은 ${formatPostDate(latestPost.date)}에 쓴 가장 최근 글입니다.`;

    return (
        <section
            ref={heroRef}
            id="hero"
            className={styles.hero}
            aria-labelledby="hero-name"
            onPointerMove={isDesktopViewport ? handlePointerMove : undefined}
            onPointerLeave={isDesktopViewport ? handlePointerLeave : undefined}
        >
            <div className={styles.text} ref={textRef}>
                <h1 id="hero-name" className={styles.name}>
                    {NAME}
                </h1>
                <p className={styles.role}>{ROLE}</p>
                <p className={styles.intro}>{INTRO}</p>
                {/* 🔴 개수는 데이터에서 셉니다. 하드코딩하면 글이 늘 때 거짓이 됩니다 */}
                <p className={styles.stats}>
                    {formatPostDate(model.posts[0].date).slice(0, 7)}부터 · 글 {POSTS.length}편
                </p>

                <div className={styles.actions}>
                    {/*
                     * sm 에서는 주 CTA 를 내립니다 — 밴드 아래 캡션 링크가 같은
                     * 목적지를 더 많은 정보와 함께 제공하고, 버튼 2개를 세로로
                     * 쌓으면 첫 화면 56% 예산이 깨집니다(§7-2).
                     */}
                    {!isMobileViewport && (
                        <Link className={styles.cta_primary} to={`/posts/${latestPost.slug}`}>
                            <span className={styles.cta_prompt} aria-hidden="true">
                                $
                            </span>
                            {PRIMARY_CTA}
                        </Link>
                    )}
                    <Link className={styles.cta_secondary} to={POST_LIST_PATH}>
                        {SECONDARY_CTA}
                    </Link>
                </div>

                {/*
                 * 별자리 캡션. 🔴 canvas 가 그려지는 구간에서만 노출합니다 —
                 * 폴백·sm 에서는 그래픽이 없거나 형태가 달라 문장이 사실과
                 * 어긋납니다(§10 "시안 문구 중 수정한 것"). 명세는 "canvas 아래"
                 * 라고 적었지만, 실제 그 자리는 연도 눈금이 쓰고 있어 텍스트 열
                 * 하단으로 옮겼습니다. 조건(그래픽이 있을 때만)은 그대로입니다.
                 */}
                {isDesktopViewport && <p className={styles.caption}>{GRAPHIC_CAPTION}</p>}
            </div>

            <div className={styles.slot} ref={slotRef}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    /*
                     * 별 위에서만 커서가 pointer 가 됩니다(§3-5). 빈 하늘은 기본 커서입니다.
                     * 🔴 `activeIndex` 가 아니라 `isPointerOnStar` 입니다 — 앞의
                     *    상태 선언 주석 참고(키보드 포커스로는 커서가 바뀌면 안 됩니다).
                     */
                    data-hit={isPointerOnStar ? 'true' : undefined}
                    onPointerDown={isDesktopViewport ? handleCanvasPointerDown : undefined}
                    onClick={isDesktopViewport ? handleCanvasClick : undefined}
                    /* sm·md 에서는 접근성 경로를 캡션 링크와 아래 목록이 담당합니다 */
                    role={isDesktopViewport ? 'img' : undefined}
                    aria-label={isDesktopViewport ? canvasLabel : undefined}
                    aria-hidden={isDesktopViewport ? undefined : 'true'}
                />

                {/*
                 * 최신 별의 **색 외 단서** 세 번째. 다크에서 골드(#ffd770)가
                 * Survey 카테고리 색과 같은 값이고 실제 최신 글이 Survey 라,
                 * 색만으로는 최신 별을 구분할 수 없습니다(§3-4 · §7.5).
                 */}
                {isDesktopViewport && latestStar && size && (
                    <span
                        className={styles.latest_label}
                        /* 최신 별은 항상 가장 오른쪽입니다 — 라벨을 왼쪽에 답니다 */
                        style={{ right: size.width - latestStar.x + 8, top: latestStar.y }}
                        aria-hidden="true"
                    >
                        {LATEST_LABEL}
                    </span>
                )}

                {/*
                 * 미리보기 카드. `pointer-events: none` + `aria-hidden` 입니다 —
                 * 실제 접근성 경로는 아래 대체 목록입니다(§3-5).
                 */}
                {isDesktopViewport && activeStar && size && (
                    <div
                        className={styles.preview}
                        /* 뷰포트 좌우 경계에서 클램프합니다(카드 폭 320 → 반폭 160) */
                        style={{
                            left: Math.min(Math.max(activeStar.x, 168), size.width - 168),
                            top: activeStar.y,
                        }}
                        aria-hidden="true"
                    >
                        <p className={styles.preview_title}>{activeStar.title}</p>
                        <p className={styles.preview_meta} data-category={activeStar.category}>
                            {[
                                activeStar.category,
                                formatPostDate(activeStar.date),
                                formatReadingMinutes(
                                    POSTS.find(post => post.slug === activeStar.slug)
                                        ?.readingMinutes,
                                ),
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                )}
            </div>

            {/*
             * sm·md 캡션 링크 — 별자리 밴드의 유일한 조작 지점입니다.
             * 높이 --tap-min 이상이고, 주 CTA 와 같은 목적지입니다(§3-5).
             *
             * 🔴 조건이 `isMobileViewport`(≤767) 였습니다. §3-5 터치 표와 §3-7 은
             *    **sm·md 공통**으로 이 링크를 요구합니다. md(768~1023)에서는
             *    canvas 가 aria-hidden 이고 대체 목록도 없고 별이 탭 대상도
             *    아니어서, 링크가 빠지면 별자리에 닿는 경로가 **0개**가 됩니다.
             */}
            {!isDesktopViewport && (
                <Link className={styles.band_link} to={`/posts/${latestPost.slug}`}>
                    <span className={styles.band_link_meta}>
                        {LATEST_LABEL} · {formatPostDate(latestPost.date)}
                    </span>
                    <span className={styles.band_link_title}>{latestPost.title}</span>
                </Link>
            )}

            {/* 색 의존을 없애는 장치 — 항상 함께 노출합니다(§7.5) */}
            <ul className={styles.legend}>
                {CATEGORY_SUMMARIES.map(summary => (
                    <li className={styles.legend_item} key={summary.name}>
                        <span
                            className={styles.legend_dot}
                            data-category={summary.name}
                            aria-hidden="true"
                        />
                        {summary.name} {summary.count}
                    </li>
                ))}
            </ul>

            {/*
             * 🔴 canvas 는 스크린리더에게 아무것도 아닙니다. 별이 링크로 동작하는
             *    이상 키보드 경로가 반드시 있어야 합니다(WCAG 2.1.1 · §3-7).
             *    목록은 기본적으로 숨어 있다가 **포커스를 받으면 화면에 보입니다** —
             *    포커스가 보이지 않는 곳으로 가면 안 됩니다.
             *    41개 탭 스톱을 강제하지 않기 위해 건너뛰기 링크가 **필수**입니다.
             */}
            {isDesktopViewport && (
                <div className={styles.alternates}>
                    <a className={styles.skip} href={`#${SKIP_TARGET_ID}`}>
                        {SKIP_LABEL}
                    </a>

                    {/* 글을 세는 단위는 `편` 입니다 — WRITING_GUIDE §3.4 (2026-08-02 정정) */}
                    <nav aria-label={`별자리 — 글 ${POSTS.length}편`}>
                        <ul className={styles.alt_list}>
                            {byRecency.map(post => {
                                const star = layout?.stars.find(item => item.slug === post.slug);

                                return (
                                    <li key={post.slug}>
                                        {/* 🔴 제목을 자르지 않습니다 — 링크 목록 탐색에서 유일한 단서입니다 */}
                                        <Link
                                            to={`/posts/${post.slug}`}
                                            onFocus={() => setActive(star?.index ?? null)}
                                            onBlur={() => setActive(null)}
                                        >
                                            {post.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <span id={SKIP_TARGET_ID} tabIndex={-1} />
                </div>
            )}
        </section>
    );
}

export default ConstellationHero;
