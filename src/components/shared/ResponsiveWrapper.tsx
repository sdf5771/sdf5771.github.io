import React from 'react';
import { useMediaQuery } from 'react-responsive';

type Tchildren = {
    children: React.ReactNode
}

/**
 * Hydration이 되었으며, max-width 768이하 모바일 사이즈일 경우 자식 component를 렌더링하는 Wrapping Component
 * @param {React.ReactNode} children Wrapping 될 자식 Component
 * @returns React.JSX.Element
 */
export const ResponsiveMobile = ({children}: Tchildren) => {
    const isMobile = useMediaQuery({
        query : "(max-width: 767px)"
    });

    return <React.Fragment>{isMobile && children}</React.Fragment>
}

/**
 * Hydration이 되었으며, min-width 769이하 max-width 1439이상 타블렛PC 사이즈일 경우 자식 component를 렌더링하는 Wrapping Component
 * @param {React.ReactNode} children Wrapping 될 자식 Component
 * @returns React.JSX.Element
 */
export const ResponsiveTabletPC = ({children}: Tchildren) => {
    const isTabletPC = useMediaQuery({
    query : "(min-width: 768px) and (max-width: 1023px)"
    })

     return <React.Fragment>{isTabletPC && children}</React.Fragment>
}

/**
 * Hydration이 되었으며, max-width 1440이상 PC 사이즈일 경우 자식 component를 렌더링하는 Wrapping Component
 * @param {React.ReactNode} children Wrapping 될 자식 Component
 * @returns React.JSX.Element
 */
export const ResponsivePC = ({children}: Tchildren) => {
    const isPC = useMediaQuery({
        query : "(min-width: 1024px)"
    })

    return <React.Fragment>{isPC && children}</React.Fragment>
}