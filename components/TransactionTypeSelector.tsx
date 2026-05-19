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

type TransactionType = "income" | "expense";

type TransactionOption = {
  value: TransactionType;
  label: string;
};

const TRANSACTION_OPTIONS: TransactionOption[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

function WheelPicker({
  options,
  selectedValue,
  onValueChange,
  itemHeight = 44,
  visibleCount = 5,
}: {
  options: TransactionOption[];
  selectedValue: TransactionType;
  onValueChange: (next: TransactionType) => void;
  itemHeight?: number;
  visibleCount?: number;
}) {
  const { theme } = useAppTheme();
  const listRef = useRef<FlatList<TransactionOption>>(null);
  const containerHeight = itemHeight * visibleCount;
  const paddingVertical = (containerHeight - itemHeight) / 2;

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((opt) => opt.value === selectedValue);
    return idx >= 0 ? idx : 0;
  }, [selectedValue, options]);

  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * itemHeight,
      animated: false,
    });
  }, [itemHeight, selectedIndex]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TransactionOption>) => {
      const isSelected = item.value === selectedValue;
      return (
        <View style={[styles.wheelItem, { height: itemHeight }]}>
          <Text
            style={[
              styles.wheelItemText,
              { color: isSelected ? theme.accent : theme.textSecondary },
            ]}
          >
            {item.label}
          </Text>
        </View>
      );
    },
    [itemHeight, selectedValue, theme.accent, theme.textSecondary],
  );

  return (
    <View style={[styles.wheelContainer, { height: containerHeight }]}>
      <FlatList
        ref={listRef}
        data={options}
        keyExtractor={(opt) => opt.value}
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
          const clampedIndex = Math.max(
            0,
            Math.min(options.length - 1, nextIndex),
          );
          const nextOption = options[clampedIndex];
          if (nextOption && nextOption.value !== selectedValue) {
            onValueChange(nextOption.value);
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

type TransactionTypeSelectorProps = {
  selectedType: TransactionType;
  onTypeChange: (type: TransactionType) => void;
  style?: ViewStyle;
};

export default function TransactionTypeSelector({
  selectedType,
  onTypeChange,
  style,
}: TransactionTypeSelectorProps) {
  const { theme } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = useMemo(() => {
    const option = TRANSACTION_OPTIONS.find(
      (opt) => opt.value === selectedType,
    );
    return option?.label || "Expense";
  }, [selectedType]);

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.pickerBox,
          { backgroundColor: theme.surfaceAlt },
          pressed ? { borderColor: theme.accent, opacity: 0.9 } : null,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerText, { color: theme.accent }]}>
          {selectedLabel}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalPanel, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.accent }]}>
                Select Type
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
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
              options={TRANSACTION_OPTIONS}
              selectedValue={selectedType}
              onValueChange={onTypeChange}
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
  pickerBox: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 60,
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
