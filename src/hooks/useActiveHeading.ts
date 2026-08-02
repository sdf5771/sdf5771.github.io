import { useEffect, useRef, useState } from 'react';
import type { PostHeading } from '../utils/postContent';

/** 활성 판정 기준선. 헤더(48) + 진행바(3) + scroll-margin 여유와 맞춥니다(§8-4) */
const BASELINE_DESKTOP = 160;

/** 모바일은 헤더가 52px 이고 화면이 좁아 기준선을 올립니다 */
const BASELINE_MOBILE = 120;

const MOBILE_MAX_WIDTH = 767;

/**
 * 현재 활성 목차 항목의 id.
 * 명세: docs/handoff-step3-post.md §8-4
 *
 * ```
 * 활성 = 뷰포트 상단 기준선을 **마지막으로 통과한** 헤딩
 * ```
 *
 * - 여러 헤딩이 동시에 화면에 있어도 활성은 **항상 정확히 하나**입니다
 * - 🔴 **첫 헤딩보다 위에 있으면 활성 없음**(`null`)입니다. 시안은 무조건 0번을
 *   활성으로 뒀는데, 도입부를 읽는 중에 첫 섹션이 강조되면 거짓 정보입니다
 * - 마지막 헤딩을 지난 뒤에는 마지막 항목을 유지합니다
 *
 * 왜 IntersectionObserver 가 아니라 스크롤 계산인가
 *   IO 는 "헤딩이 화면에 보이는가" 를 알려 줍니다. 우리가 필요한 건 "기준선을
 *   마지막으로 통과한 것이 무엇인가" 이고, 화면 밖으로 나간 헤딩도 답이 될 수
 *   있습니다. IO 로 풀면 임계값 조합이 복잡해지는 데 비해 얻는 게 없습니다.
 *   진행바가 이미 같은 스크롤 프레임을 쓰고 있어 비용도 추가되지 않습니다.
 */
export function useActiveHeading(headings: PostHeading[]): string | null {
    const [activeId, setActiveId] = useState<string | null>(null);
    const frameRef = useRef(0);

    useEffect(() => {
        if (headings.length === 0) {
            setActiveId(null);
            return;
        }

        let lastReported: string | null = null;

        const measure = () => {
            frameRef.current = 0;

            const baseline =
                window.innerWidth <= MOBILE_MAX_WIDTH ? BASELINE_MOBILE : BASELINE_DESKTOP;

            let current: string | null = null;

            for (const heading of headings) {
                const element = document.getElementById(heading.id);
                if (!element) {
                    continue;
                }

                /* 기준선을 이미 지났으면 후보. 마지막 후보가 답입니다 */
                if (element.getBoundingClientRect().top <= baseline) {
                    current = heading.id;
                } else {
                    break;
                }
            }

            if (current !== lastReported) {
                lastReported = current;
                setActiveId(current);
            }
        };

        const schedule = () => {
            if (frameRef.current === 0) {
                frameRef.current = window.requestAnimationFrame(measure);
            }
        };

        measure();

        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return () => {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);

            if (frameRef.current !== 0) {
                window.cancelAnimationFrame(frameRef.current);
            }
        };
    }, [headings]);

    return activeId;
}
