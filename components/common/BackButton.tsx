import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, touch } from '../../theme/appTheme';

interface BackButtonProps {
    onPress?: () => void;
    style?: ViewStyle;
    color?: string;
    backgroundColor?: string;
    size?: number;
    iconSize?: number;
}

const BackButton: React.FC<BackButtonProps> = ({
    onPress,
    style,
    color = '#fff',
    backgroundColor = colors.primary,
    size = touch.min,
    iconSize = 22,
}) => {
    const navigation = useNavigation();
    const hit = Math.max(size, touch.min);

    return (
        <TouchableOpacity
            onPress={onPress || (() => navigation.goBack())}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
                styles.backButton,
                {
                    width: hit,
                    height: hit,
                    borderRadius: hit / 2,
                    backgroundColor,
                },
                style,
            ]}
        >
            <Icon name={'chevron-back' as any} size={iconSize} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 3,
    },
});

export default BackButton;
