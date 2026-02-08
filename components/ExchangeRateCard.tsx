/**
 * 汇率卡片组件
 * 显示汇率信息、趋势箭头和 5 档水平指示器
 */
import { StyleSheet, Text, View } from "react-native";
import BarChart from "./BarChart";
import { getCurrencyByCode } from "@/data/currencies";

// 主题色彩常量
const BG_COLOR = "rgb(253, 247, 245)";
const HEADER_COLOR = "rgb(128, 75, 56)";
const DIVIDER_COLOR = "rgb(239, 222, 216)";
const DARK_GRAY = "rgba(54, 48, 46, 1)";
const TREND_UP_COLOR = "rgb(0, 150, 0)";
const TREND_DOWN_COLOR = "rgb(220, 50, 50)";
const LEVEL_INDICATOR_COLOR = "rgb(128, 75, 56)";
const BAR_COLOR = "#96543f";
const BAR_GRADIENT_END_COLOR = "#f8af9a";

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
  const baseCurrencySymbol = getCurrencyByCode(baseCurrency)?.symbol || "";

  // 根据趋势渲染箭头
  const renderTrendArrow = () => {
    if (trend === "up") {
      return <Text style={styles.trendUp}>↑</Text>;
    } else if (trend === "down") {
      return <Text style={styles.trendDown}>↓</Text>;
    } else if (trend === "flat") {
      return <Text style={styles.trendFlat}>→</Text>;
    } else {
      return <Text style={styles.trendUnknown}>-</Text>;
    }
  };

  // 5 档水平指示器
  const renderLevelIndicator = () => {
    const effectiveLevel = typeof level === "number" ? level : 0;

    return (
      <View style={{ height: "100%", justifyContent: "space-between" }}>
        <View style={styles.levelLabels}>
          <Text style={styles.levelLabelText}>Buy</Text>
          <Text style={styles.levelLabelText}>Sell</Text>
        </View>
        <View style={styles.levelContainer}>
          {[1, 2, 3, 4, 5].map((slot) => (
            <View key={slot} style={styles.levelSlotWrapper}>
              <View
                style={[
                  styles.levelSlot,
                  effectiveLevel === slot && styles.levelSlotActive,
                ]}
              />
              {effectiveLevel === slot && (
                <Text style={styles.levelArrow}>▼</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>
            {baseCurrencySymbol} {baseCurrency}/{targetCurrency}
          </Text>
          <Text style={styles.rateValue}>
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
                      trend === "up" && { color: TREND_UP_COLOR },
                      trend === "down" && { color: TREND_DOWN_COLOR },
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
              barColor={BAR_COLOR}
              gradientToColor={BAR_GRADIENT_END_COLOR}
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
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    shadowColor: "#000",
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
    color: HEADER_COLOR,
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
    color: DARK_GRAY,
  },
  trendContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  fluctuationText: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK_GRAY,
  },
  trendUp: {
    fontSize: 20,
    fontWeight: "bold",
    color: TREND_UP_COLOR,
  },
  trendDown: {
    fontSize: 20,
    fontWeight: "bold",
    color: TREND_DOWN_COLOR,
  },
  trendFlat: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK_GRAY,
    opacity: 0.5,
  },
  trendUnknown: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK_GRAY,
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
    color: LEVEL_INDICATOR_COLOR,
    fontWeight: "bold",
    position: "absolute",
    top: -14,
  },
  levelSlot: {
    width: 12,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: DIVIDER_COLOR,
    backgroundColor: "transparent",
  },
  levelSlotActive: {
    backgroundColor: LEVEL_INDICATOR_COLOR,
    borderColor: LEVEL_INDICATOR_COLOR,
  },
  levelLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  levelLabelText: {
    fontSize: 14,
    color: HEADER_COLOR,
    fontWeight: "600",
  },
});
