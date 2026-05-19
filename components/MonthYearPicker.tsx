/**
 * 年月选择器组件
 * 提供滚轮式的年份和月份选择，并显示记录数量
 */
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

/**
 * 数字补零
 */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 生成连续数字数组（包含边界）
 */
function rangeInclusive(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

type FieldType = "year" | "month";

/**
 * 滚轮选择器组件
 * 支持滚动选择数值
 */
function WheelPicker({
  values,
  selectedValue,
  onValueChange,
  format,
  itemHeight = 44,
  visibleCount = 5,
}: {
  values: number[];
  selectedValue: number;
  onValueChange: (next: number) => void;
  format: (v: number) => string;
  itemHeight?: number;
  visibleCount?: number;
}) {
  const { theme } = useAppTheme();
  const listRef = useRef<FlatList<number>>(null);
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
    ({ item }: ListRenderItemInfo<number>) => {
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
    <View style={[styles.wheelContainer, { height: containerHeight }]}>
      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(v) => String(v)}
        showsVerticalScrollIndicator={false}
        bounces={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingVertical }}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        onMomentumScrollEnd={(e) =>
          onMomentumEnd(e.nativeEvent.contentOffset.y)
        }
        renderItem={renderItem}
      />

      <View
        pointerEvents="none"
        style={[
          styles.wheelSelectionFrame,
          {
            top: paddingVertical,
            height: itemHeight,
            borderColor: theme.accent,
          },
        ]}
      />
    </View>
  );
}

export function MonthYearPicker({
  year,
  month,
  onYearChange,
  onMonthChange,
  minYear = 2000,
  maxYear = 2099,
  style,
}: {
  year: number;
  month: number;
  onYearChange: (next: number) => void;
  onMonthChange: (next: number) => void;
  minYear?: number;
  maxYear?: number;
  style?: ViewStyle;
}) {
  const { theme } = useAppTheme();
  const [activeField, setActiveField] = useState<FieldType | null>(null);

  const years = useMemo(() => {
    const start = Math.min(minYear, maxYear);
    const end = Math.max(minYear, maxYear);
    return rangeInclusive(start, end);
  }, [maxYear, minYear]);

  const months = useMemo(() => rangeInclusive(1, 12), []);

  // 打开/关闭选择器
  const open = useCallback((field: FieldType) => setActiveField(field), []);
  const close = useCallback(() => setActiveField(null), []);

  const modalTitle = useMemo(() => {
    return activeField === "year" ? "Select Year" : "Select Month";
  }, [activeField]);

  const wheelConfig = useMemo(() => {
    if (!activeField) return null;
    if (activeField === "year") {
      return {
        values: years,
        selectedValue: year,
        onValueChange: onYearChange,
        format: (v: number) => String(v),
      };
    }
    return {
      values: months,
      selectedValue: month,
      onValueChange: onMonthChange,
      format: (v: number) => pad2(v),
    };
  }, [activeField, month, months, onMonthChange, onYearChange, year, years]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.accent }]}>Records</Text>

        <View style={styles.pickerRow}>
          {/* 年月选择 */}
          <Pressable
            style={({ pressed }) => [
              styles.pickerBox,
              { backgroundColor: theme.surfaceAlt },
              pressed ? styles.pickerBoxPressed : null,
              pressed ? { borderColor: theme.accent } : null,
            ]}
            onPress={() => open("year")}
          >
            <Text style={[styles.pickerText, { color: theme.accent }]}>
              {String(year)}
            </Text>
          </Pressable>

          <Text style={[styles.separator, { color: theme.textSecondary }]}>-</Text>

          <Pressable
            style={({ pressed }) => [
              styles.pickerBox,
              { backgroundColor: theme.surfaceAlt },
              pressed ? styles.pickerBoxPressed : null,
              pressed ? { borderColor: theme.accent } : null,
            ]}
            onPress={() => open("month")}
          >
            <Text style={[styles.pickerText, { color: theme.accent }]}>
              {pad2(month)}
            </Text>
          </Pressable>

          <Text style={[styles.separator, { color: theme.textSecondary }]}></Text>
        </View>
      </View>

      <Modal
        visible={activeField !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        {/* 选择面板 */}
        <View style={styles.modalOverlay}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}
            onPress={close}
          />
          <View style={[styles.modalPanel, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.accent }]}>
                {modalTitle}
              </Text>
              <Pressable onPress={close} style={styles.doneButton}>
                <Text style={[styles.doneButtonText, { color: theme.accent }]}>
                  Done
                </Text>
              </Pressable>
            </View>
            <View
              style={[styles.modalDivider, { backgroundColor: theme.divider }]}
            />
            {wheelConfig ? (
              <WheelPicker
                values={wheelConfig.values}
                selectedValue={wheelConfig.selectedValue}
                onValueChange={wheelConfig.onValueChange}
                format={wheelConfig.format}
              />
            ) : null}
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
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  pickerBoxPressed: {
    opacity: 0.9,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: "700",
  },
  separator: {
    fontSize: 14,
    fontWeight: "600",
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
  wheelContainer: {
    alignSelf: "stretch",
  },
  wheelItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: {
    fontSize: 22,
    fontWeight: "800",
  },
  wheelSelectionFrame: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
});
