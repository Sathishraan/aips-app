import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { colors, radii } from "../../theme/appTheme";

interface DropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
}

const CustomDropdown: React.FC<DropdownProps> = ({
  value,
  onValueChange,
  items = [],
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = Array.isArray(items)
    ? items.filter((item, index, list) => {
        if (!item || item.value == null || String(item.value).trim() === '') return false;
        const value = String(item.value).trim().toLowerCase().replace(/^(section|sec)[\s.\-:]*/i, '');
        return list.findIndex((row) => {
          if (!row?.value) return false;
          const other = String(row.value).trim().toLowerCase().replace(/^(section|sec)[\s.\-:]*/i, '');
          return other === value;
        }) === index;
      })
    : [];

  const selectedItem = options.find((item) => item.value === value);

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text
          style={selectedItem ? styles.dropdownText : styles.dropdownPlaceholder}
          numberOfLines={1}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Icon name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView>
              {options.length === 0 ? (
                <Text style={styles.emptyText}>No options</Text>
              ) : (
                options.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.value}-${index}`}
                    style={[
                      styles.dropdownItem,
                      value === item.value && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      onValueChange(item.value);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        value === item.value && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {value === item.value ? (
                      <Icon name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radii.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dropdownText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  dropdownPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxHeight: 320,
    paddingVertical: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: "800",
    color: colors.primary,
  },
  emptyText: {
    padding: 16,
    textAlign: "center",
    color: colors.textMuted,
    fontWeight: "600",
  },
});
