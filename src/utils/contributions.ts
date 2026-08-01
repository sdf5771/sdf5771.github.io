/**
 * 기여 활동(잔디) 데이터 계약.
 * 명세: docs/handoff-step5-404-about.md §5-2
 *
 * `public/contributions.json` 은 GitHub Actions 가 **주 1회** 갱신·커밋합니다.
 * 매일 커밋하면 리포 히스토리가 1년에 365커밋 늘어나는데, 잔디는 주 단위
 * 그래픽이라 손실이 없습니다.
 *
 * ⚠️ 워크플로(`.github/workflows/contributions.yml`)는 **아직 없습니다**(별도 태스크).
 *    그때까지 이 파일은 404 를 받고 컴포넌트가 로드 실패 상태를 그립니다.
 */

export interface ContributionWeek {
    /** 그 주의 일요일. `YYYY-MM-DD` (GitHub 잔디와 같은 기준) */
    start: string;
    /**
     * 길이 **7 고정**. 값은 **레벨 0~4**이지 횟수가 아닙니다 —
     * GitHub 의 4분위 계산은 Actions 쪽에서 하고 클라이언트는 재계산하지 않습니다.
     * 첫 주·마지막 주의 범위 밖 날짜는 0 으로 채웁니다(null 금지 — 렌더 분기가 늘어납니다).
     */
    days: number[];
}

export interface Contributions {
    /** 이 JSON 을 만든 날. `YYYY-MM-DD` */
    generatedAt: string;
    /** 최근 1년 기여 총 횟수 */
    total: number;
    /** 마지막 기여일. `total === 0` 이면 null */
    lastActiveDate: string | null;
    /** 오래된 주 → 최근 주 순, 정확히 53개(52주 + 진행 중인 주) */
    weeks: ContributionWeek[];
}

/**
 * 모듈 레벨 Promise 캐시. 홈 → 소개로 이동해도 fetch 는 세션당 1회입니다.
 */
let cache: Promise<Contributions> | null = null;

export function loadContributions(): Promise<Contributions> {
    if (!cache) {
        cache = fetch('/contributions.json').then(response => {
            if (!response.ok) {
                throw new Error(String(response.status));
            }

            return response.json() as Promise<Contributions>;
        });

        /*
         * 캐시된 Promise 에 핸들러를 한 번 붙여 둡니다.
         * 컴포넌트가 결과를 받기 전에 언마운트되면 아무도 이 거부를 처리하지
         * 않아 unhandledrejection 이 콘솔에 뜹니다. 호출부는 각자 체인을 따로
         * 만들므로 이 no-op 이 호출부의 에러 처리를 가리지 않습니다.
         */
        cache.catch(() => {});
    }

    return cache;
}
