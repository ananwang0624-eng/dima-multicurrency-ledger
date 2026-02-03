import { PieChart } from "react-native-gifted-charts";
import { StyleSheet, Text, View } from "react-native";
import { ICON_TILE_ITEMS } from "@/data/iconTileItems";
import type { TransactionRecord } from "@/utils/dataManager";
import type { ExchangeRateData } from "@/utils/exchangeRateManager";
import { getExchangeRateForDate } from "@/utils/exchangeRateManager";

type TransactionType = "income" | "expense";

type ExpenseCategoryPieChartProps = {
  transactions: TransactionRecord[];
  defaultCurrency: string;
  exchangeRates: Map<string, ExchangeRateData>;
  transactionType: TransactionType;
  width?: number;
  height?: number;
};

// 为每个分类定义颜色
const CATEGORY_COLORS = [
  "#F5DAD0", // Dining
  "#F0E1A9", // Transport
  "#EFDEE8", // Shopping
  "#E8B4A0", // Gaming
  "#D4C5A9", // Health
  "#C9B8D0", // Education
  "#F5C4B0", // Daily
  "#E8D4A9", // Others
  "#D9C8D8", // Exchange
];

export default function ExpenseCategoryPieChart({
  transactions,
  defaultCurrency,
  exchangeRates,
  transactionType,
  width = 280,
  height = 200,
}: ExpenseCategoryPieChartProps) {
  // 将金额统一转换成默认币种
  // 将金额转换为默认货币
  const convertToDefaultCurrency = (
    amount: number,
    currency: string,
    date: string,
  ): number => {
    if (currency === defaultCurrency) {
      return amount;
    }

    const rateData = exchangeRates.get(`${currency}-${defaultCurrency}`);
    if (!rateData) {
      return amount; // 如果没有汇率数据，返回原始金额
    }

    const dateOnly = date.split("T")[0]; // 从ISO日期中提取YYYY-MM-DD
    const rate = getExchangeRateForDate(rateData, dateOnly);
    if (!rate) {
      return amount;
    }

    return amount * rate;
  };

  // 计算每个分类的总额（转换为默认货币）
  const categoryExpenses = transactions
    .filter((t) => t.type === transactionType)
    .reduce(
      (acc, t) => {
        const convertedAmount = convertToDefaultCurrency(
          t.amount,
          t.currency,
          t.date,
        );
        acc[t.category] = (acc[t.category] || 0) + convertedAmount;
        return acc;
      },
      {} as Record<number, number>,
    );

  const totalExpenseAmount = Object.values(categoryExpenses).reduce(
    (a, b) => a + b,
    0,
  );

  // 转换为饼图数据格式
  const pieData = Object.entries(categoryExpenses)
    .map(([categoryValue, amount]) => {
      const category = Number(categoryValue);
      const categoryInfo = ICON_TILE_ITEMS[category];
      const percentage =
        totalExpenseAmount > 0
          ? ((amount / totalExpenseAmount) * 100).toFixed(1)
          : "0.0";
      return {
        value: amount,
        color: CATEGORY_COLORS[category] || "#DDD",
        label: categoryInfo?.label || "Unknown",
        percentage: `${percentage}%`,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // 如果没有数据
  if (pieData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No {transactionType === "expense" ? "expense" : "income"} data
        </Text>
      </View>
    );
  }

  const totalExpense = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          radius={Math.min(width, height) / 2.5}
          innerRadius={Math.min(width, height) / 5}
        />
      </View>

      {/* 总额 */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>
          {transactionType === "expense" ? "Total Expense" : "Total Income"}
        </Text>
        <Text style={styles.totalValue}>
          {totalExpense.toFixed(2)} {defaultCurrency}
        </Text>
      </View>

      {/* 图例 */}
      <View style={styles.legendContainer}>
        {pieData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View
                style={[styles.legendColor, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>
                {item.value.toFixed(2)} {defaultCurrency}
              </Text>
              <Text style={styles.legendPercentage}>{item.percentage}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgb(250, 244, 242)",
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  legendContainer: {
    width: "100%",
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgb(87, 83, 78)",
  },
  legendRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgb(87, 83, 78)",
  },
  legendPercentage: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    minWidth: 45,
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgb(133, 115, 110)",
  },
});
