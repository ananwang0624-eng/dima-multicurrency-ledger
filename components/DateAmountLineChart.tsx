import { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export type DateAmountLineChartProps = {
  dates: string[];
  incomes: number[];
  expenses: number[];
  style?: ViewStyle;
  height?: number;
  incomeColor?: string;
  expenseColor?: string;
};

function coerceFiniteNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickLabel(dates: string[], index: number, labelEvery: number): string {
  if (dates.length <= 1) return dates[index] ?? "";
  if (index === 0 || index === dates.length - 1) return dates[index] ?? "";
  if (labelEvery <= 1) return dates[index] ?? "";
  return index % labelEvery === 0 ? (dates[index] ?? "") : "";
}

export default function DateAmountLineChart({
  dates,
  incomes,
  expenses,
  style,
  height = 180,
  incomeColor = "rgb(46, 204, 113)",
  expenseColor = "rgb(233, 79, 55)",
}: DateAmountLineChartProps) {
  const length = Math.min(dates.length, incomes.length, expenses.length);

  const labelEvery = useMemo(() => {
    // Heuristic to avoid overcrowded x-axis labels.
    if (length <= 7) return 1;
    if (length <= 14) return 2;
    if (length <= 30) return 5;
    return 7;
  }, [length]);

  const { incomeData, expenseData } = useMemo(() => {
    const d = dates.slice(0, length);
    const income = incomes.slice(0, length);
    const expense = expenses.slice(0, length);

    return {
      incomeData: income.map((value, index) => ({
        value: coerceFiniteNumber(value),
        label: pickLabel(d, index, labelEvery),
      })),
      expenseData: expense.map((value, index) => ({
        value: coerceFiniteNumber(value),
        label: pickLabel(d, index, labelEvery),
      })),
    };
  }, [dates, expenses, incomes, labelEvery, length]);

  const isEmpty = length === 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: incomeColor }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: expenseColor }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>

      {isEmpty ? (
        <View style={[styles.emptyState, { height }]}>
          <Text style={styles.emptyText}>No data</Text>
        </View>
      ) : (
        <LineChart
          height={height}
          data={incomeData}
          data2={expenseData}
          color1={incomeColor}
          color2={expenseColor}
          thickness={2}
          thickness2={2}
          hideDataPoints
          yAxisLabelWidth={40}
          xAxisLabelTextStyle={styles.axisLabel}
          yAxisTextStyle={styles.axisLabel}
          xAxisColor="rgba(0,0,0,0.2)"
          yAxisColor="rgba(0,0,0,0.2)"
          rulesColor="rgba(0,0,0,0.08)"
          showVerticalLines
          verticalLinesColor="rgba(0,0,0,0.05)"
          rotateLabel
          labelsExtraHeight={20}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(0,0,0,0.6)",
  },
  axisLabel: {
    fontSize: 10,
    color: "rgba(0,0,0,0.55)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(0,0,0,0.5)",
  },
});
