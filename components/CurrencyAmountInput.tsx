/**
 * 币种金额输入组件
 * 组合币种选择器和金额输入框，支持下拉选择币种
 */
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

import {
  CURRENCIES,
  getCurrencyByCode,
  type Currency,
} from "@/data/currencies";

// 主题色彩常量
const COLORS = {
  active: "rgb(128, 75, 56)",
  inactiveText: "rgb(133, 115, 110)",
  divider: "rgb(239, 222, 216)",
  placeholder: "rgb(133, 115, 110)",
} as const;

export function CurrencyAmountInput({
  currencyCode,
  onCurrencyChange,
  amount,
  onAmountChange,
  currencyCodes,
  style,
}: {
  currencyCode: string; // 当前选中的币种代码
  onCurrencyChange: (nextCode: string) => void; // 币种变化回调
  amount: string; // 金额字符串
  onAmountChange: (nextAmount: string) => void; // 金额变化回调
  currencyCodes?: string[]; // 限定的币种代码列表（可选）
  style?: ViewStyle; // 自定义样式
}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>();

  // 可选币种（若传入限定列表则过滤）
  const options = useMemo<Currency[]>(() => {
    if (!currencyCodes || currencyCodes.length === 0) return CURRENCIES;

    const resolved = currencyCodes
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.toUpperCase())
      .map((c) => getCurrencyByCode(c))
      .filter((c): c is Currency => Boolean(c));

    return resolved.length > 0 ? resolved : CURRENCIES;
  }, [currencyCodes]);

  // 当前选中币种（兜底到列表首项）
  const currency = useMemo<Currency>(() => {
    const normalized = currencyCode.toUpperCase();
    return (
      options.find((c) => c.code.toUpperCase() === normalized) ??
      options[0] ??
      getCurrencyByCode(normalized) ??
      CURRENCIES[0]
    );
  }, [currencyCode, options]);

  return (
    <View style={[styles.container, style]}>
      {/* 币种选择按钮 */}
      <Pressable style={styles.currencyButton} onPress={() => setOpen(true)}>
        <Text style={styles.currencySymbol}>{currency.symbol}</Text>
        <Text style={styles.currencyChevron}>▾</Text>
      </Pressable>

      {/* 金额输入框（用自定义占位文本避免 Android 基线问题） */}
      <View style={styles.amountField}>
        {amount.length === 0 ? (
          <Text style={styles.amountPlaceholder} pointerEvents="none">
            0.00
          </Text>
        ) : null}

        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          // 使用自定义占位文字以避免 Android baseline 偏移
          placeholder=""
          keyboardType="decimal-pad"
          inputMode="decimal"
          style={styles.amountInput}
          multiline={false}
          scrollEnabled={false}
          underlineColorAndroid="transparent"
          selection={selection}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          onFocus={() => {
            const end = amount.length;
            requestAnimationFrame(() => setSelection({ start: end, end }));
          }}
        />
      </View>

      {/* 币种下拉选择 */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdown} onPress={() => undefined}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.code}
              initialNumToRender={20}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const selected = item.code === currency.code;
                return (
                  <Pressable
                    style={[
                      styles.optionRow,
                      selected ? styles.optionRowSelected : null,
                    ]}
                    onPress={() => {
                      onCurrencyChange(item.code);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.optionSymbol}>{item.symbol}</Text>
                    <View style={styles.optionText}>
                      <Text style={styles.optionCode}>{item.code}</Text>
                      <Text style={styles.optionName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.active,
  },
  currencyChevron: {
    fontSize: 26,
    color: COLORS.inactiveText,
    paddingTop: 2,
  },
  amountField: {
    flex: 1,
    marginLeft: 12,
    height: 44,
    justifyContent: "center",
  },
  amountInput: {
    height: 44,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    textAlign: "right",
    textAlignVertical: "center",
    color: "#000",
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
  },
  amountPlaceholder: {
    position: "absolute",
    right: 0,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    color: COLORS.placeholder,
    includeFontPadding: false,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    maxHeight: "70%",
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  optionRowSelected: {
    backgroundColor: "rgba(128, 75, 56, 0.08)",
  },
  optionSymbol: {
    width: 34,
    textAlign: "center",
    fontSize: 20,
    color: COLORS.active,
  },
  optionText: {
    flex: 1,
  },
  optionCode: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.active,
  },
  optionName: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.inactiveText,
  },
});
