import styles from './SearchIcon.module.css';

/**
 * 돋보기 비트맵 7×7. 원 + 우하단 손잡이.
 * 명세(§4-7)는 5×5 를 제시하면서 "돋보기로 안 읽히면 7×7 로 올려도 된다"고
 * frontend 재량을 뒀습니다. 5×5 는 원이 2×2 로 뭉개져 점 네 개로 보여
 * 7×7 을 채택했습니다.
 *
 *   . # # # . . .
 *   # . . . # . .
 *   # . . . # . .
 *   . # # # . . .
 *   . . . . # . .
 *   . . . . . # .
 *   . . . . . . #
 */
const BITMAP = [
    0, 1, 1, 1, 0, 0, 0,
    1, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 0, 1, 0, 0,
    0, 1, 1, 1, 0, 0, 0,
    0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 1,
];

interface SearchIconProps {
    className?: string;
}

/**
 * 검색 아이콘. 색은 currentColor 를 따르므로 감싸는 쪽에서 정합니다.
 * 의미는 옆의 라벨·aria-label 이 전달하므로 이 요소는 순수 장식입니다.
 */
function SearchIcon({ className }: SearchIconProps) {
    return (
        <span
            className={className ? `${styles.icon} ${className}` : styles.icon}
            aria-hidden="true"
        >
            {BITMAP.map((isOn, index) => (
                <span key={index} className={isOn ? styles.dot : styles.dot_off} />
            ))}
        </span>
    );
}

export default SearchIcon;
