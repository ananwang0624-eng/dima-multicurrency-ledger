/**
 * 日期时间选择器组件
 * 支持选择年、月、日、时、分，使用滚轮式界面
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

// 主题色彩常量
const COLORS = {
  background: "rgb(253, 247, 245)",
  panelBg: "rgb(246, 233, 228)",
  active: "rgb(128, 75, 56)",
  inactiveText: "rgb(133, 115, 110)",
  divider: "rgb(239, 222, 216)",
  overlay: "rgba(0,0,0,0.25)",
} as const;

type DateTimeField = "year" | "month" | "day" | "hour" | "minute";

/**
 * 数字补零
 */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 计算指定年月的天数
 */
function daysInMonth(year: number, month: number) {
  // month: 1-12
  return new Date(year, month, 0).getDate();
}

/**
 * 生成连续数字数组（包含边界）
 */
function rangeInclusive(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

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
      // 根据滚动位置取最近值
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
              isSelected
                ? styles.wheelItemTextSelected
                : styles.wheelItemTextIdle,
            ]}
          >
            {format(item)}
          </Text>
        </View>
      );
    },
    [format, itemHeight, selectedValue],
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
          },
        ]}
      />
    </View>
  );
}

export function DateTimePicker({
  year,
  month,
  day,
  hour,
  minute,
  onYearChange,
  onMonthChange,
  onDayChange,
  onHourChange,
  onMinuteChange,
  minYear = 2000,
  maxYear = 2099,
  style,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  onYearChange: (next: number) => void;
  onMonthChange: (next: number) => void;
  onDayChange: (next: number) => void;
  onHourChange: (next: number) => void;
  onMinuteChange: (next: number) => void;
  minYear?: number;
  maxYear?: number;
  style?: ViewStyle;
}) {
  const [activeField, setActiveField] = useState<DateTimeField | null>(null);

  const maxDay = useMemo(() => daysInMonth(year, month), [year, month]);

  // 当年份/月份变化导致日期越界时，自动回落到最大值
  useEffect(() => {
    if (day > maxDay) onDayChange(maxDay);
  }, [day, maxDay, onDayChange]);

  const years = useMemo(() => {
    const start = Math.min(minYear, maxYear);
    const end = Math.max(minYear, maxYear);
    return rangeInclusive(start, end);
  }, [maxYear, minYear]);

  const months = useMemo(() => rangeInclusive(1, 12), []);
  const days = useMemo(() => rangeInclusive(1, maxDay), [maxDay]);
  const hours = useMemo(() => rangeInclusive(0, 23), []);
  const minutes = useMemo(() => rangeInclusive(0, 59), []);

  // 打开/关闭选择器
  const open = useCallback((field: DateTimeField) => setActiveField(field), []);
  const close = useCallback(() => setActiveField(null), []);

  // 选择年份时同步修正最大日期
  const onPickYear = useCallback(
    (nextYear: number) => {
      onYearChange(nextYear);
      const nextMax = daysInMonth(nextYear, month);
      if (day > nextMax) onDayChange(nextMax);
    },
    [day, month, onDayChange, onYearChange],
  );

  // 选择月份时同步修正最大日期
  const onPickMonth = useCallback(
    (nextMonth: number) => {
      onMonthChange(nextMonth);
      const nextMax = daysInMonth(year, nextMonth);
      if (day > nextMax) onDayChange(nextMax);
    },
    [day, onDayChange, onMonthChange, year],
  );

  const modalTitle = useMemo(() => {
    switch (activeField) {
      case "year":
        return "Select Year";
      case "month":
        return "Select Month";
      case "day":
        return "Select Day";
      case "hour":
        return "Select Hour";
      case "minute":
        return "Select Minute";
      default:
        return "";
    }
  }, [activeField]);

  const wheelConfig = useMemo(() => {
    if (!activeField) return null;
    if (activeField === "year") {
      return {
        values: years,
        selectedValue: year,
        onValueChange: onPickYear,
        format: (v: number) => String(v),
      };
    }
    if (activeField === "month") {
      return {
        values: months,
        selectedValue: month,
        onValueChange: onPickMonth,
        format: (v: number) => pad2(v),
      };
    }
    if (activeField === "day") {
      return {
        values: days,
        selectedValue: Math.min(day, maxDay),
        onValueChange: onDayChange,
        format: (v: number) => pad2(v),
      };
    }
    if (activeField === "hour") {
      return {
        values: hours,
        selectedValue: hour,
        onValueChange: onHourChange,
        format: (v: number) => pad2(v),
      };
    }

    return {
      values: minutes,
      selectedValue: minute,
      onValueChange: onMinuteChange,
      format: (v: number) => pad2(v),
    };
  }, [
    activeField,
    day,
    days,
    hour,
    hours,
    maxDay,
    minute,
    minutes,
    month,
    months,
    onDayChange,
    onHourChange,
    onMinuteChange,
    onPickMonth,
    onPickYear,
    year,
    years,
  ]);

  return (
    <View style={[styles.row, style]}>
      {/* 日期时间字段 */}
      <Pressable
        style={({ pressed }) => [
          styles.box,
          pressed ? styles.boxPressed : null,
        ]}
        onPress={() => open("year")}
      >
        <Text style={styles.boxLabel}>year</Text>
        <Text style={styles.boxText}>{String(year)}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.box,
          pressed ? styles.boxPressed : null,
        ]}
        onPress={() => open("month")}
      >
        <Text style={styles.boxLabel}>month</Text>
        <Text style={styles.boxText}>{pad2(month)}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.box,
          pressed ? styles.boxPressed : null,
        ]}
        onPress={() => open("day")}
      >
        <Text style={styles.boxLabel}>day</Text>
        <Text style={styles.boxText}>{pad2(Math.min(day, maxDay))}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.box,
          pressed ? styles.boxPressed : null,
        ]}
        onPress={() => open("hour")}
      >
        <Text style={styles.boxLabel}>hour</Text>
        <Text style={styles.boxText}>{pad2(hour)}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.box,
          pressed ? styles.boxPressed : null,
        ]}
        onPress={() => open("minute")}
      >
        <Text style={styles.boxLabel}>min</Text>
        <Text style={styles.boxText}>{pad2(minute)}</Text>
      </Pressable>

      <Modal
        visible={activeField !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        {/* 选择面板 */}
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={close} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Pressable onPress={close} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalDivider} />
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
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  box: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.panelBg,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  boxPressed: {
    opacity: 0.9,
    borderColor: COLORS.active,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.inactiveText,
    lineHeight: 12,
    marginBottom: 2,
  },
  boxText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.active,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalPanel: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 18,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.inactiveText,
  },
  doneButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.panelBg,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.active,
  },
  modalDivider: {
    height: 2,
    backgroundColor: COLORS.divider,
    alignSelf: "stretch",
    width: "100%",
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
  wheelItemTextSelected: {
    color: COLORS.active,
  },
  wheelItemTextIdle: {
    color: COLORS.inactiveText,
  },
  wheelSelectionFrame: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.active,
    backgroundColor: "transparent",
  },
});
