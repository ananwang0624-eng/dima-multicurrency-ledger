/**
 * 汇率卡片组件
 * 显示汇率信息、趋势箭头和 5 档水平指示器
 */
import { StyleSheet, Text, View } from "react-native";
import BarChart from "./BarChart";
import { getCurrencyByCode } from "@/data/currencies";
import { useAppTheme } from "@/providers/AppThemeProvider";

type TrendType = "up" | "down" | "flat" | "insufficient-data";

interface ExchangeRateCardProps {
  baseCurrency: string; // 基准币种
  targetCurrency: string; // 目标币种
  currentRate: number; // 当前汇率
  trend: TrendType; // 趋势类型
  level: number | "insufficient-data"; // 水平位置 (1-5)
  historicalRates?: number[]; // 最近7天的汇率数据
  fluctuationPercentage?: number | null; // 波动比例
}

export default function ExchangeRateCard({
  baseCurrency,
  targetCurrency,
  currentRate,
  trend,
  level,
  historicalRates,
  fluctuationPercentage,
}: ExchangeRateCardProps) {
  const { theme } = useAppTheme();
  const baseCurrencySymbol = getCurrencyByCode(baseCurrency)?.symbol || "";

  // 根据趋势渲染箭头
  const renderTrendArrow = () => {
    if (trend === "up") {
      return <Text style={[styles.trendUp, { color: theme.success }]}>↑</Text>;
    } else if (trend === "down") {
      return <Text style={[styles.trendDown, { color: theme.danger }]}>↓</Text>;
    } else if (trend === "flat") {
      return <Text style={[styles.trendFlat, { color: theme.textPrimary }]}>→</Text>;
    } else {
      return <Text style={[styles.trendUnknown, { color: theme.textPrimary }]}>-</Text>;
    }
  };

  // 5 档水平指示器
  const renderLevelIndicator = () => {
    const effectiveLevel = typeof level === "number" ? level : 0;

    return (
      <View style={{ height: "100%", justifyContent: "space-between" }}>
        <View style={styles.levelLabels}>
          <Text style={[styles.levelLabelText, { color: theme.accent }]}>Buy</Text>
          <Text style={[styles.levelLabelText, { color: theme.accent }]}>Sell</Text>
        </View>
        <View style={styles.levelContainer}>
          {[1, 2, 3, 4, 5].map((slot) => (
            <View key={slot} style={styles.levelSlotWrapper}>
              <View
                style={[
                  styles.levelSlot,
                  { borderColor: theme.divider },
                  effectiveLevel === slot && styles.levelSlotActive,
                  effectiveLevel === slot
                    ? {
                        backgroundColor: theme.accent,
                        borderColor: theme.accent,
                      }
                    : null,
                ]}
              />
              {effectiveLevel === slot && (
                <Text style={[styles.levelArrow, { color: theme.accent }]}>
                  ▼
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, shadowColor: theme.shadow },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftSection}>
          <Text style={[styles.title, { color: theme.accent }]}>
            {baseCurrencySymbol} {baseCurrency}/{targetCurrency}
          </Text>
          <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
            {currentRate > 0 ? currentRate.toFixed(4) : "-"}
          </Text>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.trendContainer}>
            <Text style={{ textAlign: "center" }}>
              {renderTrendArrow()}
              {fluctuationPercentage !== undefined &&
                fluctuationPercentage !== null && (
                  <Text
                    style={[
                      styles.fluctuationText,
                      { color: theme.textPrimary },
                      trend === "up" && { color: theme.success },
                      trend === "down" && { color: theme.danger },
                    ]}
                  >
                    {"  "}
                    {fluctuationPercentage > 0 ? "+" : ""}
                    {fluctuationPercentage.toFixed(2)}%
                  </Text>
                )}
            </Text>
          </View>
          {historicalRates && historicalRates.length === 7 && (
            <BarChart
              data={historicalRates}
              height={50}
              barColor={theme.chartBar}
              gradientToColor={theme.chartBarGradientEnd}
              backgroundColor="transparent"
              showValues={false}
            />
          )}
        </View>

        <View style={styles.rightSection}>
          <View style={styles.levelWrapper}>{renderLevelIndicator()}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: 75,
    paddingTop: 4,
  },
  chartSection: {
    width: 90,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  rightSection: {
    height: 75,
    paddingBottom: 8,
    paddingTop: 4,
  },
  rateValue: {
    fontSize: 26,
    fontWeight: "700",
  },
  trendContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  fluctuationText: {
    fontSize: 14,
    fontWeight: "600",
  },
  trendUp: {
    fontSize: 20,
    fontWeight: "bold",
  },
  trendDown: {
    fontSize: 20,
    fontWeight: "bold",
  },
  trendFlat: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.5,
  },
  trendUnknown: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.3,
  },
  levelWrapper: {
    height: "100%",
  },
  levelContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  levelSlotWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  levelArrow: {
    fontSize: 10,
    fontWeight: "bold",
    position: "absolute",
    top: -14,
  },
  levelSlot: {
    width: 12,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  levelSlotActive: {},
  levelLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  levelLabelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
