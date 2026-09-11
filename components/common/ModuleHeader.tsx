import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radii, space } from '../../theme/appTheme';
import { useRoleColors } from '../../hooks/useRoleColors';

interface ModuleHeaderProps {
    title: string;
    subtitle: string;
    onActionPress?: () => void;
    actionIcon?: string;
    style?: ViewStyle;
    children?: React.ReactNode;
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({
    title,
    subtitle,
    style,
    children,
}) => {
    const insets = useSafeAreaInsets();
    const { horizontalPadding, isTablet, scale, contentMaxWidth } = useResponsiveLayout();
    const brand = useRoleColors();

    const HeaderWrap: any = brand.isStaff ? LinearGradient : View;
    const headerWrapProps = brand.isStaff
        ? {
              colors: brand.headerGradient,
              start: brand.headerStart,
              end: brand.headerEnd,
          }
        : {};

    return (
        <HeaderWrap
            {...headerWrapProps}
            style={[
                styles.header,
                {
                    backgroundColor: brand.primary,
                    shadowColor: brand.primary,
                    paddingTop: Math.max(insets.top, 8) + space.sm,
                    paddingBottom: isTablet ? space.md : 12,
                    paddingHorizontal: horizontalPadding,
                },
                style,
            ]}
        >
            <View style={[styles.inner, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                <View style={styles.headerContent}>
                    <BackButton
                        color={brand.primaryDark}
                        backgroundColor="#FFFFFF"
                        size={isTablet ? 52 : 48}
                        iconSize={isTablet ? 24 : 22}
                        style={[styles.backButton, { borderColor: brand.primaryBorder }]}
                    />

                    <View style={styles.headerCenter}>
                        <Text
                            style={[styles.headerTitle, { fontSize: scale(18) }]}
                            numberOfLines={2}
                            allowFontScaling
                        >
                            {title}
                        </Text>
                        {!!subtitle && (
                            <Text
                                style={[styles.headerSubtitle, { fontSize: scale(12) }]}
                                numberOfLines={2}
                                allowFontScaling
                            >
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </View>
                {children}
            </View>
        </HeaderWrap>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: colors.primary,
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 4,
    },
    inner: {
        width: '100%',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
    },
    headerCenter: {
        flex: 1,
        marginLeft: space.sm,
        marginRight: space.xs,
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
        lineHeight: 24,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.88)',
        fontWeight: '600',
        marginTop: 2,
        lineHeight: 16,
    },
    backButton: {
        borderWidth: 1,
        borderColor: colors.primaryBorder,
    },
});

export default ModuleHeader;
