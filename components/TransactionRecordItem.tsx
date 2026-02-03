/**
 * 交易记录单项组件
 * 显示单条交易记录，包括分类图标、描述、时间和金额
 */
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { SvgUri } from "react-native-svg";

import { getCurrencyByCode } from "@/data/currencies";
import { ICON_TILE_ITEMS } from "@/data/iconTileItems";
import type { TransactionRecord } from "@/utils/dataManager";

type Props = {
  record: TransactionRecord; // 交易记录
  style?: ViewStyle; // 自定义样式
  onPress?: () => void; // 点击事件
  testID?: string; // 测试 ID
};

/**
 * 数字补零
 */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 交易时间格式化（MM-DD HH:mm）
 */
function formatRecordTime(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${month}-${day} ${hour}:${minute}`;
}

/**
 * 保留两位小数
 */
function toFixed2(value: number): string {
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  return normalized.toFixed(2);
}

/**
 * 金额格式化（千分位）
 */
function formatAmount(value: number): string {
  const fixed = toFixed2(Math.abs(value));
  const [intPart, fracPart = "00"] = fixed.split(".");
  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${intWithCommas}.${fracPart}`;
}

/**
 * 币种符号 + 金额
 */
function formatCurrencyAmount(symbol: string, value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}${symbol}${formatAmount(value)}`;
}

export default function TransactionRecordItem({
  record,
  style,
  onPress,
  testID,
}: Props) {
  // 解析分类图标
  const categoryItem = useMemo(() => {
    return (
      ICON_TILE_ITEMS.find((it) => it.value === record.category) ??
      ICON_TILE_ITEMS[0]
    );
  }, [record.category]);

  // 备注为空时用分类名兜底
  const descriptionText = useMemo(() => {
    const trimmed = record.description?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : categoryItem.label;
  }, [categoryItem.label, record.description]);

  const timeText = useMemo(() => formatRecordTime(record.date), [record.date]);

  // 收入为正、支出为负
  const amountText = useMemo(() => {
    const symbol = getCurrencyByCode(record.currency)?.symbol ?? "";
    const signed = record.type === "income" ? record.amount : -record.amount;
    return formatCurrencyAmount(symbol, signed);
  }, [record.amount, record.currency, record.type]);

  const amountColor = record.type === "income" ? COLORS.income : COLORS.expense;

  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && onPress ? styles.pressed : null,
        style,
      ]}
    >
      <View
        style={[
          styles.leftIconCircle,
          { backgroundColor: categoryItem.bgColor },
        ]}
      >
        <SvgUri
          uri={categoryItem.uri}
          width={28}
          height={28}
          color={COLORS.iconTint}
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.description} numberOfLines={1}>
          {descriptionText}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {timeText}
        </Text>
      </View>

      <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
        {amountText}
      </Text>
    </Pressable>
  );
}

const COLORS = {
  pageBg: "rgb(253, 247, 245)",
  divider: "rgb(239, 222, 216)",
  iconTint: "rgb(128, 75, 56)",
  description: "rgb(32, 24, 23)",
  expense: "rgb(32, 24, 23)",
  income: "rgb(22, 163, 74)",
  time: "rgb(128, 75, 56)",
} as const;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: COLORS.pageBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.divider,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  leftIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  description: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.description,
  },
  time: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.time,
  },
  amount: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
    includeFontPadding: false,
  },
});
