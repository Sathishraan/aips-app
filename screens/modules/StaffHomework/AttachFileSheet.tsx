import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { staffColors as colors, radii, shadows, space } from '../../../theme/appTheme';

type AttachKind = 'image' | 'pdf';

interface AttachFileSheetProps {
  visible: boolean;
  remaining?: number;
  onClose: () => void;
  onChoose: (kind: AttachKind) => void;
}

const OPTIONS: Array<{
  kind: AttachKind;
  title: string;
  hint: string;
  icon: keyof typeof Icon.glyphMap;
  tint: string;
  soft: string;
}> = [
  {
    kind: 'image',
    title: 'Image',
    hint: 'JPG, PNG, WEBP, HEIC, GIF',
    icon: 'image-outline',
    tint: colors.primary,
    soft: colors.primarySoft,
  },
  {
    kind: 'pdf',
    title: 'PDF',
    hint: 'Documents up to 10MB',
    icon: 'document-text-outline',
    tint: '#c45a2a',
    soft: '#fff1e8',
  },
];

const AttachFileSheet: React.FC<AttachFileSheetProps> = ({
  visible,
  remaining = 5,
  onClose,
  onChoose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add attachment</Text>
          <Text style={styles.subtitle}>
            Choose an image or PDF{remaining < 5 ? ` · ${remaining} remaining` : ''}
          </Text>

          <View style={styles.row}>
            {OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.kind}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => onChoose(option.kind)}
              >
                <View style={[styles.iconWrap, { backgroundColor: option.soft }]}>
                  <Icon name={option.icon} size={28} color={option.tint} />
                </View>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardHint}>{option.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    ...shadows.elevated,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: space.lg,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  cancel: {
    marginTop: space.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
});

export default AttachFileSheet;
