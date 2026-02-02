import { useFocusEffect } from "@react-navigation/native";
import { getSettings, subscribeSettings } from "@/utils/settingsManager";
import {
  ensureExchangeRates,
  getExchangeRateSummary,
  getStoredExchangeRates,
  getDailyTrend,
  getWeeklyTrend,
  getMonthlyTrend,
  getMonthlyRateLevel,
  getYearlyRateLevel,
  type ExchangeRateData,
} from "@/utils/exchangeRateManager";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ExchangeRateCard from "@/components/ExchangeRateCard";
import { OptionPicker } from "@/components/OptionPicker";

export default function ExchangeTab() {
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData[]>(
    [],
  );
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // 趋势时间范围：日/周/月
  const [trendPeriod, setTrendPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  // 档次时间范围：月/年
  const [levelPeriod, setLevelPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const loadExchangeRates = useCallback(async () => {
    try {
      setIsLoadingRates(true);
      setRatesError(null);

      const settings = await getSettings();
      const targetCurrency = settings.defaultCurrencyCode;
      const bookkeepingCurrencies = settings.bookkeepingCurrencyCodes;

      const dataList: ExchangeRateData[] = [];

      for (const baseCurrency of bookkeepingCurrencies) {
        await ensureExchangeRates(baseCurrency, targetCurrency);
        const data = await getStoredExchangeRates(
          baseCurrency,
          targetCurrency,
        );
        if (data && Object.keys(data.rates).length > 0) {
          dataList.push(data);
        }
      }

      setExchangeRateData(dataList);
    } catch (error) {
      console.error("Failed to load exchange rates:", error);
      setRatesError(error instanceof Error ? error.message : "未知错误");
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadExchangeRates();
  }, [loadExchangeRates]);

  // 订阅设置变化
  useEffect(() => {
    const unsubscribe = subscribeSettings(() => {
      loadExchangeRates();
    });
    return unsubscribe;
  }, [loadExchangeRates]);

  // 当页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadExchangeRates();
    }, [loadExchangeRates]),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Exchange Rates</Text>
      <Text style={styles.subtitle}>Exchange rate data summary</Text>

      <View style={{ height: 16 }} />

      {/* 趋势和档次时间范围选择器 */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <OptionPicker
            label="趋势范围"
            value={trendPeriod}
            options={["daily", "weekly", "monthly"] as const}
            formatOption={(v) => {
              if (v === "daily") return "日";
              if (v === "weekly") return "周";
              return "月";
            }}
            onChange={setTrendPeriod}
          />
        </View>

        <View style={{ flex: 1 }}>
          <OptionPicker
            label="档次范围"
            value={levelPeriod}
            options={["monthly", "yearly"] as const}
            formatOption={(v) => (v === "monthly" ? "月" : "年")}
            onChange={setLevelPeriod}
          />
        </View>
      </View>

      <View style={{ height: 16 }} />

      {/* 汇率卡片列表 */}
      {isLoadingRates ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="rgb(128, 75, 56)" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : ratesError ? (
        <Text style={styles.errorText}>加载失败: {ratesError}</Text>
      ) : exchangeRateData.length > 0 ? (
        <View style={{ gap: 12 }}>
          {exchangeRateData.map((data) => {
            // 跳过相同货币的汇率
            if (data.baseCurrency === data.targetCurrency) return null;

            // 获取最新汇率
            const dates = Object.keys(data.rates).sort();
            const latestDate = dates[dates.length - 1];
            const currentRate = latestDate ? data.rates[latestDate] : 0;

            // 根据选择的时间范围计算趋势
            let trend: "up" | "down" | "flat" | "insufficient-data";
            if (trendPeriod === "daily") {
              trend = getDailyTrend(data);
            } else if (trendPeriod === "weekly") {
              trend = getWeeklyTrend(data);
            } else {
              trend = getMonthlyTrend(data);
            }

            // 根据选择的时间范围计算档次
            const level =
              levelPeriod === "monthly"
                ? getMonthlyRateLevel(data)
                : getYearlyRateLevel(data);

            // 调试信息
            if (level === "insufficient-data") {
              console.log(
                `${data.baseCurrency}/${data.targetCurrency} - Level: insufficient-data`,
                `Period: ${levelPeriod}`,
                `Dates count: ${dates.length}`,
                `Date range: ${dates[0]} to ${latestDate}`
              );
            }

            return (
              <ExchangeRateCard
                key={`${data.baseCurrency}-${data.targetCurrency}`}
                baseCurrency={data.baseCurrency}
                targetCurrency={data.targetCurrency}
                currentRate={currentRate}
                trend={trend}
                level={level}
              />
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>暂无汇率数据</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "rgb(133, 115, 110)",
  },
  exchangeRateCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "rgb(133, 115, 110)",
  },
  errorText: {
    fontSize: 14,
    color: "rgb(220, 38, 38)",
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "rgb(133, 115, 110)",
    textAlign: "center",
    paddingVertical: 20,
  },
});
