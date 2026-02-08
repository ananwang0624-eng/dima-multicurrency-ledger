import { useCallback, useMemo, useRef, useState } from "react";
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

const COLORS = {
  background: "rgb(253, 247, 245)",
  panelBg: "rgb(246, 233, 228)",
  active: "rgb(128, 75, 56)",
  inactiveText: "rgb(133, 115, 110)",
  divider: "rgb(239, 222, 216)",
  overlay: "rgba(0,0,0,0.25)",
} as const;

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
  const listRef = useRef<FlatList<T>>(null);
  const containerHeight = itemHeight * visibleCount;
  const paddingVertical = (containerHeight - itemHeight) / 2;

  const selectedIndex = useMemo(() => {
    const idx = values.indexOf(selectedValue);
    return idx >= 0 ? idx : 0;
  }, [selectedValue, values]);

  useEffect(() => {
    // 保持滚轮与外部受控值一致
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
        <View
          style={{
            height: itemHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={[
              styles.wheelItemText,
              isSelected && styles.wheelItemTextActive,
            ]}
          >
            {format(item)}
          </Text>
        </View>
      );
    },
    [format, itemHeight, selectedValue],
  );

  const keyExtractor = useCallback((item: T) => item, []);

  const getItemLayout = useCallback(
    (_: T[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight],
  );

  const scrollHandler = useCallback(
    (ev: any) => {
      const offsetY = ev.nativeEvent.contentOffset.y;
      onMomentumEnd(offsetY);
    },
    [onMomentumEnd],
  );

  return (
    <View style={{ height: containerHeight }}>
      <FlatList
        ref={listRef}
        data={values}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={scrollHandler}
        contentContainerStyle={{
          paddingVertical: paddingVertical,
        }}
      />
      <View
        style={[
          styles.wheelHighlight,
          {
            top: paddingVertical,
            height: itemHeight,
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
  const [isOpen, setIsOpen] = useState(false);

  // 打开/关闭选择器
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.pickerBox,
            pressed && styles.pickerBoxPressed,
          ]}
          onPress={open}
        >
          <Text style={styles.pickerText}>{formatOption(value)}</Text>
        </Pressable>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        {/* 选择面板 */}
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={close} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <Pressable onPress={close} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalDivider} />

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
    color: COLORS.active,
  },
  pickerBox: {
    backgroundColor: COLORS.panelBg,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 50,
    alignItems: "center",
  },
  pickerBoxPressed: {
    borderColor: COLORS.active,
    opacity: 0.9,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.active,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  modalPanel: {
    backgroundColor: "#fff",
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
    color: COLORS.active,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.active,
  },
  modalDivider: {
    height: 2,
    backgroundColor: COLORS.divider,
  },
  wheelItemText: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.inactiveText,
  },
  wheelItemTextActive: {
    color: COLORS.active,
  },
  wheelHighlight: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.active,
    backgroundColor: "transparent",
  },
});
