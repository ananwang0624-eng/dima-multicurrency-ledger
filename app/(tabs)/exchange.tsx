/**
 * 汇率标签页
 * 显示各记账币种对默认币种的汇率信息、趋势和水平位置
 */
import { useFocusEffect } from "@react-navigation/native";
import { getSettings, subscribeSettings } from "@/utils/settingsManager";
import {
  ensureExchangeRates,
  getStoredExchangeRates,
  getMonthlyRateLevel,
  getYearlyRateLevel,
  getDailyFluctuationPercentage,
  getWeeklyFluctuationPercentage,
  getMonthlyFluctuationPercentage,
  getLast7WeeksAverageData,
  getLast7MonthsAverageData,
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
import { useAppTheme } from "@/providers/AppThemeProvider";

/**
 * 从汇率数据中提取最近7天的汇率值和日期标签
 */
function getLastSevenDaysData(data: ExchangeRateData): {
  rates: number[];
  labels: string[];
} {
  const dates = Object.keys(data.rates).sort();
  const last7Dates = dates.slice(-7);

  const rates = last7Dates.map((date) => data.rates[date]);
  const labels = last7Dates.map((date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  // 如果不足7天，用0填充
  while (rates.length < 7) {
    rates.unshift(0);
    labels.unshift("");
  }

  return { rates, labels };
}

export default function ExchangeTab() {
  const { theme } = useAppTheme();
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData[]>(
    [],
  );
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // 趋势时间范围：天/周/月
  const [trendPeriod, setTrendPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  // 水平区间：月/年
  const [levelPeriod, setLevelPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );

  // 从本地缓存读取已有汇率数据（同步快速，不发网络请求）
  const loadCachedRates = useCallback(async () => {
    const settings = await getSettings();
    const targetCurrency = settings.defaultCurrencyCode;
    const bookkeepingCurrencies = settings.bookkeepingCurrencyCodes;

    const cachedList = (
      await Promise.all(
        bookkeepingCurrencies.map((baseCurrency) =>
          getStoredExchangeRates(baseCurrency, targetCurrency),
        ),
      )
    ).filter(
      (data): data is ExchangeRateData =>
        data !== null && Object.keys(data.rates).length > 0,
    );

    return cachedList;
  }, []);

  // 加载并聚合汇率数据：先展示缓存，再后台刷新
  const loadExchangeRates = useCallback(async () => {
    try {
      setRatesError(null);

      // 第一步：立即用缓存数据渲染，避免闪烁
      const cached = await loadCachedRates();
      if (cached.length > 0) {
        setExchangeRateData(cached);
        setIsLoadingRates(false);
      }
      // 无缓存时保持 loading 状态

      // 第二步：后台确保汇率最新（可能发网络请求）
      const settings = await getSettings();
      const targetCurrency = settings.defaultCurrencyCode;
      const bookkeepingCurrencies = settings.bookkeepingCurrencyCodes;

      await Promise.all(
        bookkeepingCurrencies.map((baseCurrency) =>
          ensureExchangeRates(baseCurrency, targetCurrency),
        ),
      );

      // 第三步：重新读取最新数据并更新 UI
      const freshList = await loadCachedRates();
      setExchangeRateData(freshList);
    } catch (error) {
      console.error("Failed to load exchange rates:", error);
      setRatesError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoadingRates(false);
    }
  }, [loadCachedRates]);

  // 监听设置变化并刷新
  useEffect(() => {
    const unsubscribe = subscribeSettings(() => {
      loadExchangeRates();
    });
    return unsubscribe;
  }, [loadExchangeRates]);

  // 页面获得焦点时刷新
  useFocusEffect(
    useCallback(() => {
      loadExchangeRates();
    }, [loadExchangeRates]),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ height: 16 }} />

      {/* 趋势与水平区间选择 */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <OptionPicker
            label="Trend Range"
            value={trendPeriod}
            options={["daily", "weekly", "monthly"] as const}
            formatOption={(v) => {
              if (v === "daily") return "Day";
              if (v === "weekly") return "Week";
              return "Month";
            }}
            onChange={setTrendPeriod}
          />
        </View>

        <View style={{ flex: 1 }}>
          <OptionPicker
            label="Rating Range"
            value={levelPeriod}
            options={["monthly", "yearly"] as const}
            formatOption={(v) => (v === "monthly" ? "Month" : "Year")}
            onChange={setLevelPeriod}
          />
        </View>
      </View>

      <View style={{ height: 16 }} />

      {/* 汇率卡片列表 */}
      {isLoadingRates ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading...
          </Text>
        </View>
      ) : ratesError ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Failed to load: {ratesError}
        </Text>
      ) : exchangeRateData.length > 0 ? (
        <View style={{ gap: 12 }}>
          {exchangeRateData.map((data) => {
            // Skip exchange rate for same currency
            if (data.baseCurrency === data.targetCurrency) return null;

            // Get latest exchange rate
            const dates = Object.keys(data.rates).sort();
            const latestDate = dates[dates.length - 1];
            const currentRate = latestDate ? data.rates[latestDate] : 0;

            // Calculate trend and fluctuation based on selected time range
            let trend: "up" | "down" | "flat" | "insufficient-data";
            let fluctuationPercentage: number | null = null;

            if (trendPeriod === "daily") {
              fluctuationPercentage = getDailyFluctuationPercentage(data);
            } else if (trendPeriod === "weekly") {
              fluctuationPercentage = getWeeklyFluctuationPercentage(data);
            } else {
              fluctuationPercentage = getMonthlyFluctuationPercentage(data);
            }

            // Determine trend based on fluctuation
            if (fluctuationPercentage !== null) {
              if (fluctuationPercentage > 0) trend = "up";
              else if (fluctuationPercentage < 0) trend = "down";
              else trend = "flat";
            } else {
              trend = "insufficient-data";
            }

            // Calculate level based on selected time range
            const level =
              levelPeriod === "monthly"
                ? getMonthlyRateLevel(data)
                : getYearlyRateLevel(data);

            // Get historical data for chart based on trend period
            let historicalRates: number[];

            if (trendPeriod === "weekly") {
              const data7Weeks = getLast7WeeksAverageData(data);
              historicalRates = data7Weeks.rates;
            } else if (trendPeriod === "monthly") {
              const data7Months = getLast7MonthsAverageData(data);
              historicalRates = data7Months.rates;
            } else {
              // Default to daily (last 7 days)
              const data7Days = getLastSevenDaysData(data);
              historicalRates = data7Days.rates;
            }

            return (
              <ExchangeRateCard
                key={`${data.baseCurrency}-${data.targetCurrency}`}
                baseCurrency={data.baseCurrency}
                targetCurrency={data.targetCurrency}
                currentRate={currentRate}
                trend={trend}
                level={level}
                historicalRates={historicalRates}
                fluctuationPercentage={fluctuationPercentage}
              />
            );
          })}
        </View>
      ) : (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No exchange rate data
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
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
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
