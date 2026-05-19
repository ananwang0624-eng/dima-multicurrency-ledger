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

type DateTimeField = "year" | "month" | "day" | "hour" | "minute";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

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
  const { theme } = useAppTheme();
  const listRef = useRef<FlatList<number>>(null);
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
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical }}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        onMomentumScrollEnd={(e) => {
          const rawIndex = e.nativeEvent.contentOffset.y / itemHeight;
          const nextIndex = Math.round(rawIndex);
          const clampedIndex = Math.max(0, Math.min(values.length - 1, nextIndex));
          const nextValue = values[clampedIndex];
          if (nextValue !== undefined && nextValue !== selectedValue) {
            onValueChange(nextValue);
          }
        }}
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
  const { theme } = useAppTheme();
  const [activeField, setActiveField] = useState<DateTimeField | null>(null);

  const maxDay = useMemo(() => daysInMonth(year, month), [year, month]);

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

  const onPickYear = useCallback(
    (nextYear: number) => {
      onYearChange(nextYear);
      const nextMax = daysInMonth(nextYear, month);
      if (day > nextMax) onDayChange(nextMax);
    },
    [day, month, onDayChange, onYearChange],
  );

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

  const renderBox = (field: DateTimeField, label: string, valueText: string) => (
    <Pressable
      style={({ pressed }) => [
        styles.box,
        {
          backgroundColor: theme.cardBg,
          borderColor: pressed ? theme.accent : theme.cardBorder,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() => setActiveField(field)}
    >
      <Text style={[styles.boxLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.boxText, { color: theme.accent }]}>{valueText}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.row, style]}>
      {renderBox("year", "year", String(year))}
      {renderBox("month", "month", pad2(month))}
      {renderBox("day", "day", pad2(Math.min(day, maxDay)))}
      {renderBox("hour", "hour", pad2(hour))}
      {renderBox("minute", "min", pad2(minute))}

      <Modal
        visible={activeField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveField(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setActiveField(null)}
          />
          <View
            style={[
              styles.modalPanel,
              {
                backgroundColor: theme.cardBg,
                borderTopColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.accent }]}>
                {modalTitle}
              </Text>
              <Pressable
                onPress={() => setActiveField(null)}
                style={[
                  styles.doneButton,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
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
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 12,
    marginBottom: 2,
  },
  boxText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalPanel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
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
  },
  doneButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalDivider: {
    height: 2,
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
  wheelSelectionFrame: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
});
