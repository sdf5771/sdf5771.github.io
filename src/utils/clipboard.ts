/**
 * 클립보드 복사 — 성공 여부를 **불리언으로** 돌려줍니다.
 *
 * 🔴 왜 `navigator.clipboard.writeText(...).then(성공표시)` 로 쓰면 안 되는가
 * ---------------------------------------------------------------------------
 * 이 Promise 는 생각보다 자주 **거부**됩니다.
 *  - 문서에 포커스가 없을 때 (`NotAllowedError`) — 다른 창을 보다가 누르는 경우
 *  - 보안 컨텍스트가 아닐 때 (`navigator.clipboard` 자체가 `undefined`)
 *  - 브라우저 권한 정책이 막을 때
 *
 * `.catch` 없이 쓰면 두 가지가 동시에 납니다. ① 처리되지 않은 Promise 거부가
 * 콘솔에 쌓이고 ② 라벨이 `복사` 그대로 남아 **사용자는 버튼이 고장 났다고
 * 생각합니다.** 반대로 성공 여부를 확인하지 않고 무조건 `복사됨` 을 띄우면
 * **복사되지 않았는데 됐다고 말하는** 더 나쁜 거짓말이 됩니다.
 *
 * 그래서 결과를 돌려주고, 호출부가 성공했을 때만 `복사됨` 을 띄웁니다.
 */
export async function copyText(text: string): Promise<boolean> {
    try {
        if (!navigator.clipboard) {
            return false;
        }

        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('클립보드 복사에 실패했습니다', error);
        return false;
    }
}
