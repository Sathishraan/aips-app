import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { SubjectType, ImageFile } from '../../../types/staffHomework.type';
import { isPdfFile } from '../../../utils/homeworkImage';
import { staffColors as colors, radii, shadows, space } from '../../../theme/appTheme';

interface SubjectHomeworkCardProps {
  subject: SubjectType;
  description: string;
  images: ImageFile[];
  onDescriptionChange: (text: string) => void;
  onImagePick: () => void;
  onImageRemove: (index: number) => void;
  onRemove: () => void;
}

const SubjectHomeworkCard: React.FC<SubjectHomeworkCardProps> = ({
  subject,
  description,
  images,
  onDescriptionChange,
  onImagePick,
  onImageRemove,
  onRemove,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Subject</Text>
          <Text style={styles.subject} numberOfLines={1}>
            {subject}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
          <Icon name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Instructions</Text>
      <TextInput
        style={styles.textArea}
        placeholder={`Notes for ${subject}`}
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={onDescriptionChange}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.attachHead}>
        <Text style={styles.label}>Attachments</Text>
        {images.length > 0 && (
          <Text style={styles.count}>{images.length}/5</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.upload, images.length >= 5 && styles.uploadDisabled]}
        onPress={onImagePick}
        disabled={images.length >= 5}
        activeOpacity={0.8}
      >
        <Icon name="attach-outline" size={20} color={colors.primary} />
        <Text style={styles.uploadText}>
          {images.length >= 5 ? 'Maximum 5 files' : 'Add image or PDF'}
        </Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {images.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.thumb}>
              <View style={[styles.thumbImg, { alignItems: 'center', justifyContent: 'center' }]}>
                <Icon
                  name={isPdfFile(image) ? 'document-text-outline' : 'image-outline'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <TouchableOpacity style={styles.thumbX} onPress={() => onImageRemove(index)}>
                <Icon name="close" size={12} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.thumbSize} numberOfLines={1}>
                {image.name || formatFileSize(image.size || 0)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
  },
  headerText: { flex: 1 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subject: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textArea: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: space.md,
  },
  attachHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: { fontSize: 12, fontWeight: '800', color: colors.primary, marginBottom: 6 },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.primarySoft,
  },
  uploadDisabled: { opacity: 0.5 },
  uploadText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  thumbs: { gap: 10, paddingTop: 12 },
  thumb: { width: 88 },
  thumbImg: {
    width: 88,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.borderLight,
  },
  thumbX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbSize: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

export default SubjectHomeworkCard;
