import { useWindowDimensions } from 'react-native';

/**
 * Hook to detect screen size and orientation for responsive layouts.
 * iPad Pro 11-inch is 834px wide.
 * iPad Mini is 744px wide.
 * Standard iPad is 810px wide.
 * We use 768px as the standard tablet breakpoint.
 */
export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;
    const isLandscape = width > height;

    // Helper for grid layouts
    const getColumnCount = (phoneCount = 1, tabletCount = 2, largeTabletCount = 3) => {
        if (isLargeTablet) return largeTabletCount;
        if (isTablet) return tabletCount;
        return phoneCount;
    };

    // Helper for content width limiting (prevens lines from getting too long on iPad)
    const contentMaxWidth: any = isTablet ? 800 : '100%';

    return {
        isTablet,
        isLargeTablet,
        isLandscape,
        width,
        height,
        getColumnCount,
        contentMaxWidth
    };
};
