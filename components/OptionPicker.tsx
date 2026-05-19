import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/providers/AppThemeProvider";

function WheelPicker<T extends string>({
  values,
  selectedValue,
  onValueChange,
  format,
  itemHeight = 44,
  visibleCount = 5,
}: {
  values: T[];
  selectedValue: T;
  onValueChange: (next: T) => void;
  format: (v: T) => string;
  itemHeight?: number;
  visibleCount?: number;
}) {
  const { theme } = useAppTheme();
  const listRef = useRef<FlatList<T>>(null);
  const containerHeight = itemHeight * visibleCount;
  const paddingVertical = (containerHeight - itemHeight) / 2;

  const selectedIndex = useMemo(() => {
    const idx = values.indexOf(selectedValue);
    return idx >= 0 ? idx : 0;
  }, [selectedValue, values]);

  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * itemHeight,
      animated: false,
    });
  }, [itemHeight, selectedIndex]);

  const onMomentumEnd = useCallback(
    (offsetY: number) => {
      const rawIndex = offsetY / itemHeight;
      const nextIndex = Math.round(rawIndex);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, nextIndex));
      const nextValue = values[clampedIndex];
      if (nextValue !== undefined && nextValue !== selectedValue) {
        onValueChange(nextValue);
      }
    },
    [itemHeight, onValueChange, selectedValue, values],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<T>) => {
      const isSelected = item === selectedValue;
      return (
        <View style={[styles.wheelItem, { height: itemHeight }]}>
          <Text
            style={[
              styles.wheelItemText,
              { color: isSelected ? theme.accent : theme.textSecondary },
            ]}
          >
            {format(item)}
          </Text>
        </View>
      );
    },
    [format, itemHeight, selectedValue, theme.accent, theme.textSecondary],
  );

  return (
    <View style={{ height: containerHeight }}>
      <FlatList
        ref={listRef}
        data={values}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={(ev) =>
          onMomentumEnd(ev.nativeEvent.contentOffset.y)
        }
        contentContainerStyle={{ paddingVertical }}
      />
      <View
        style={[
          styles.wheelHighlight,
          {
            top: paddingVertical,
            height: itemHeight,
            borderColor: theme.accent,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

interface OptionPickerProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  formatOption: (v: T) => string;
  onChange: (next: T) => void;
  style?: ViewStyle;
}

export function OptionPicker<T extends string>({
  label,
  value,
  options,
  formatOption,
  onChange,
  style,
}: OptionPickerProps<T>) {
  const { theme } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.accent }]}>{label}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.pickerBox,
            { backgroundColor: theme.surfaceAlt },
            pressed ? { borderColor: theme.accent, opacity: 0.9 } : null,
          ]}
          onPress={() => setIsOpen(true)}
        >
          <Text style={[styles.pickerText, { color: theme.accent }]}>
            {formatOption(value)}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}
            onPress={() => setIsOpen(false)}
          />
          <View style={[styles.modalPanel, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.accent }]}>
                Select {label}
              </Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                style={styles.doneButton}
              >
                <Text style={[styles.doneButtonText, { color: theme.accent }]}>
                  Done
                </Text>
              </Pressable>
            </View>
            <View
              style={[styles.modalDivider, { backgroundColor: theme.divider }]}
            />

            <WheelPicker
              values={[...options]}
              selectedValue={value}
              onValueChange={onChange}
              format={formatOption}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  pickerBox: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 50,
    alignItems: "center",
  },
  pickerText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalDivider: {
    height: 2,
  },
  wheelItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemText: {
    fontSize: 22,
    fontWeight: "800",
  },
  wheelHighlight: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
});
