import { Fragment } from 'react';
import styles from './HighlightedText.module.css';
import { splitByTokens } from '../../utils/postSearch';

interface HighlightedTextProps {
    text: string;
    /** 정규화·토큰화된 검색어. 비면 원문을 그대로 렌더합니다 */
    tokens: readonly string[];
}

/**
 * 검색어 일치 구간을 `<mark>` 로 감쌉니다.
 * 명세: docs/handoff-step4-list.md §3-6
 *
 * `<span>` + 배경색이 아니라 `<mark>` 인 이유: 「관련이 있어 표시된 구간」이라는
 * 뜻이 요소 자체에 있습니다. 브라우저 기본 노랑 배경은 CSS 로 반드시 덮어씁니다
 * (안 덮으면 다크 모드에서 형광 노랑 블록이 됩니다).
 *
 * 🔴 **스크린리더용 텍스트를 덧붙이지 않습니다.** `<mark>` 는 NVDA·VoiceOver
 *    기본 설정에서 낭독되지 않는데, `aria-label` 이나 시각 숨김 텍스트로
 *    "일치"를 끼우면 제목 한 줄이 3~4토막으로 끊겨 낭독되어 **제목을 알아들을 수
 *    없게 됩니다.** 일치 사실은 "결과 목록에 있다"로 이미 전달되고, 결과 수는
 *    별도의 `aria-live` 영역이 알립니다(§9-4).
 */
function HighlightedText({ text, tokens }: HighlightedTextProps) {
    const segments = splitByTokens(text, tokens);

    return (
        <>
            {segments.map((segment, index) =>
                segment.isMatch ? (
                    <mark key={index} className={styles.mark}>
                        {segment.text}
                    </mark>
                ) : (
                    <Fragment key={index}>{segment.text}</Fragment>
                ),
            )}
        </>
    );
}

export default HighlightedText;
