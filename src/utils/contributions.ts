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
 *
 * 🔴 **성공한 Promise 만** 남습니다. 거부된 Promise 가 캐시에 남으면 이후 모든
 *    마운트가 같은 거부를 즉시 돌려받아, 홈↔소개를 아무리 오가도 재시도가
 *    되지 않습니다. 그런데 실패 화면은 `잠시 후 다시 시도해 주세요` 라고
 *    말합니다 — 새로고침 말고는 방법이 없으니 그 문장이 거짓말이 됩니다.
 *    아래 `cache = null` 이 카피를 사실로 만듭니다.
 */
let cache: Promise<Contributions> | null = null;

/**
 * 최소 형태 가드.
 *
 * `response.json()` 은 무엇이든 돌려줄 수 있는데(워크플로 산출물이 바뀌거나
 * 404 HTML 이 JSON 으로 파싱되는 등) 타입 단언은 그것을 검사하지 않습니다.
 * 검증 없이 통과시키면 `data.weeks.slice()` 가 **렌더 도중** 터지고,
 * 그 자리에서 React 트리가 죽습니다 — url.ts 가 경고하는 바로 그 실패 양식입니다.
 * 여기서 던지면 호출부의 `.catch` 가 받아 정상적인 실패 화면이 됩니다.
 */
function assertContributions(data: unknown): asserts data is Contributions {
    const candidate = data as Partial<Contributions> | null;

    if (!candidate || !Array.isArray(candidate.weeks)) {
        throw new Error('contributions.json 의 형태가 계약과 다릅니다');
    }
}

export function loadContributions(): Promise<Contributions> {
    if (!cache) {
        const request = fetch('/contributions.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(String(response.status));
                }

                return response.json() as Promise<unknown>;
            })
            .then(data => {
                assertContributions(data);

                return data;
            });

        /*
         * 실패는 캐시하지 않습니다. `request` 를 비우는 것이 아니라 `cache` 가
         * 아직 이 요청일 때만 비웁니다 — 그 사이 누군가 재시도를 시작했다면
         * 그쪽 Promise 를 지워 버리면 안 됩니다.
         *
         * 이 `catch` 는 unhandledrejection 방지도 겸합니다. 컴포넌트가 결과를
         * 받기 전에 언마운트되면 아무도 거부를 처리하지 않아 콘솔에 뜹니다.
         * 호출부는 각자 체인을 따로 만들므로 이것이 호출부의 에러 처리를
         * 가리지 않습니다.
         */
        request.catch(() => {
            if (cache === request) {
                cache = null;
            }
        });

        cache = request;
    }

    return cache;
}
