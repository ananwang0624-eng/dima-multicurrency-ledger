import { StyleSheet, Text, View } from "react-native";

const BG_COLOR = "rgb(253, 247, 245)";
const HEADER_COLOR = "rgb(128, 75, 56)";
const DIVIDER_COLOR = "rgb(239, 222, 216)";
const DARK_GRAY = "rgba(54, 48, 46, 1)";
const TREND_UP_COLOR = "rgb(0, 150, 0)";
const TREND_DOWN_COLOR = "rgb(220, 50, 50)";
const LEVEL_INDICATOR_COLOR = "rgb(128, 75, 56)";

type TrendType = "up" | "down" | "flat" | "insufficient-data";

interface ExchangeRateCardProps {
  baseCurrency: string;
  targetCurrency: string;
  currentRate: number;
  trend: TrendType;
  level: number | "insufficient-data";
}

export default function ExchangeRateCard({
  baseCurrency,
  targetCurrency,
  currentRate,
  trend,
  level,
}: ExchangeRateCardProps) {
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

  const renderLevelIndicator = () => {
    const effectiveLevel = typeof level === "number" ? level : 0;

    return (
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
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>
          {baseCurrency}/{targetCurrency}
        </Text>

        <Text style={styles.rateValue}>
          {currentRate > 0 ? currentRate.toFixed(4) : "-"}
        </Text>

        <View style={styles.trendContainer}>{renderTrendArrow()}</View>

        <View style={styles.levelWrapper}>{renderLevelIndicator()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    backgroundColor: BG_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: HEADER_COLOR,
    minWidth: 80,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK_GRAY,
    minWidth: 60,
  },
  trendContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  trendUp: {
    fontSize: 28,
    fontWeight: "bold",
    color: TREND_UP_COLOR,
  },
  trendDown: {
    fontSize: 28,
    fontWeight: "bold",
    color: TREND_DOWN_COLOR,
  },
  trendFlat: {
    fontSize: 28,
    fontWeight: "bold",
    color: DARK_GRAY,
    opacity: 0.5,
  },
  trendUnknown: {
    fontSize: 28,
    fontWeight: "bold",
    color: DARK_GRAY,
    opacity: 0.3,
  },
  levelWrapper: {
    alignItems: "flex-end",
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
    marginTop: 5,
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
});
