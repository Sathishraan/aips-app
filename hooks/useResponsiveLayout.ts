import { useMemo } from 'react';
import { useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '../theme/appTheme';

/** Shared responsive layout tokens for phones & tablets (portrait + landscape). */
export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortest = Math.min(width, height);
    const longest = Math.max(width, height);
    const isTablet = shortest >= 600;
    const isLandscape = width > height;
    const isCompactPhone = width < 360;
    const isFoldableExpanded = width >= 600 && width < 840 && height >= 600;

    // Module / card columns
    let columns = 3;
    if (isCompactPhone) columns = 2;
    else if (isTablet && isLandscape) columns = 5;
    else if (isTablet || isFoldableExpanded) columns = 4;

    // List / form: tablet can show 2-up cards
    const listColumns = isTablet ? 2 : 1;

    const horizontalPadding = isTablet ? space.lg + 4 : isCompactPhone ? 12 : space.md;
    const gap = isTablet ? space.md : isCompactPhone ? 8 : 10;
    const contentMaxWidth = isTablet
      ? Math.min(920, width - insets.left - insets.right)
      : width;
    const formMaxWidth = isTablet ? 520 : width;
    const fontScale = Math.min(PixelRatio.getFontScale(), 1.35);

    const scale = (size: number) => {
      const base = isTablet ? size * 1.1 : size;
      return Math.round(base * Math.min(fontScale, 1.2));
    };

    // WhatsApp-style full-width tab bar
    const tabBarBaseHeight = isTablet ? 60 : 56;
    const systemNavInset = Math.max(
      insets.bottom,
      Platform.OS === 'android' ? 8 : 4
    );
    const tabBarHeight = tabBarBaseHeight + systemNavInset;

    return {
      width,
      height,
      insets,
      isTablet,
      isLandscape,
      isCompactPhone,
      isFoldableExpanded,
      columns,
      listColumns,
      gap,
      horizontalPadding,
      contentMaxWidth,
      formMaxWidth,
      scale,
      tabBarHeight,
      tabBarBaseHeight,
      systemNavInset,
      space,
      longest,
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right]);
};
