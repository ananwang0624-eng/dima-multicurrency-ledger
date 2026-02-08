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
  const listRef = useRef<FlatList<TransactionOption>>(null);
  const containerHeight = itemHeight * visibleCount;
  const paddingVertical = (containerHeight - itemHeight) / 2;

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((opt) => opt.value === selectedValue);
    return idx >= 0 ? idx : 0;
  }, [selectedValue, options]);

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
      const clampedIndex = Math.max(0, Math.min(options.length - 1, nextIndex));
      const nextOption = options[clampedIndex];
      if (nextOption && nextOption.value !== selectedValue) {
        onValueChange(nextOption.value);
      }
    },
    [itemHeight, onValueChange, selectedValue, options],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TransactionOption>) => {
      const isSelected = item.value === selectedValue;
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
            {item.label}
          </Text>
        </View>
      );
    },
    [itemHeight, selectedValue],
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
  const [modalVisible, setModalVisible] = useState(false);

  // 打开/关闭选择器
  const open = useCallback(() => setModalVisible(true), []);
  const close = useCallback(() => setModalVisible(false), []);

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
          pressed ? styles.pickerBoxPressed : null,
        ]}
        onPress={open}
      >
        <Text style={styles.pickerText}>{selectedLabel}</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        {/* 选择面板 */}
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={close} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <Pressable onPress={close} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalDivider} />
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
    backgroundColor: COLORS.panelBg,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 60,
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
