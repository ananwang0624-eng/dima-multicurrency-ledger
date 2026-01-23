import DateAmountLineChart from "@/components/DateAmountLineChart";
import { getSettings } from "@/utils/settingsManager";
import {
  ensureExchangeRates,
  getExchangeRateSummary,
  getStoredExchangeRates,
  type ExchangeRateData,
} from "@/utils/exchangeRateManager";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StatsTab() {
  const [exchangeRateInfos, setExchangeRateInfos] = useState<
    Array<{
      baseCurrency: string;
      targetCurrency: string;
      startDate: string | null;
      endDate: string | null;
      count: number;
    }>
  >([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // 加载汇率数据
  useEffect(() => {
    let mounted = true;

    async function loadExchangeRates() {
      try {
        setIsLoadingRates(true);
        setRatesError(null);

        // 获取设置
        const settings = await getSettings();
        const targetCurrency = settings.defaultCurrencyCode;
        const bookkeepingCurrencies = settings.bookkeepingCurrencyCodes;

        // 为每个记账货币获取汇率
        const summaries: Array<{
          baseCurrency: string;
          targetCurrency: string;
          startDate: string | null;
          endDate: string | null;
          count: number;
        }> = [];

        for (const baseCurrency of bookkeepingCurrencies) {
          // 确保汇率数据是最新的
          await ensureExchangeRates(baseCurrency, targetCurrency);

          // 获取存储的汇率数据
          const data = await getStoredExchangeRates(
            baseCurrency,
            targetCurrency,
          );
          const summary = getExchangeRateSummary(data);

          if (summary) {
            summaries.push(summary);
          }
        }

        if (mounted) {
          setExchangeRateInfos(summaries);
        }
      } catch (error) {
        console.error("Failed to load exchange rates:", error);
        if (mounted) {
          setRatesError(error instanceof Error ? error.message : "未知错误");
        }
      } finally {
        if (mounted) {
          setIsLoadingRates(false);
        }
      }
    }

    loadExchangeRates();

    return () => {
      mounted = false;
    };
  }, []);
  const { days, expenses, incomes } = useMemo(() => {
    const count = 30;
    const outDays: string[] = [];
    const outExpenses: number[] = [];
    const outIncomes: number[] = [];

    const now = new Date();
    const anchor = new Date(now);
    anchor.setHours(12, 0, 0, 0);

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      outDays.push(`${m}-${day}`);

      // Example data (kept deterministic enough for demo, but varied in range).
      outExpenses.push(Math.round((Math.random() * 80 + 5) * 100) / 100);
      outIncomes.push(Math.round(Math.random() * 120 * 100) / 100);
    }

    return { days: outDays, expenses: outExpenses, incomes: outIncomes };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Statistics</Text>
      <Text style={styles.subtitle}>折线图示例（横轴日期 / 纵轴金额）</Text>

      <View style={{ height: 16 }} />

      {/* 汇率信息卡片 */}
      <View style={styles.exchangeRateCard}>
        <Text style={styles.cardTitle}>汇率数据</Text>
        {isLoadingRates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="rgb(128, 75, 56)" />
            <Text style={styles.loadingText}>加载汇率数据...</Text>
          </View>
        ) : ratesError ? (
          <Text style={styles.errorText}>加载失败: {ratesError}</Text>
        ) : exchangeRateInfos.length > 0 ? (
          <View style={styles.infoContainer}>
            {exchangeRateInfos.map((info, index) => (
              <View
                key={`${info.baseCurrency}-${info.targetCurrency}`}
                style={[
                  styles.currencySection,
                  index > 0 && styles.currencySectionBorder,
                ]}
              >
                <Text style={styles.currencyPairText}>
                  {info.baseCurrency} → {info.targetCurrency}
                </Text>
                {info.baseCurrency === info.targetCurrency ? (
                  <Text style={styles.infoText}>
                    默认货币与记账货币相同，无需汇率转换
                  </Text>
                ) : info.startDate && info.endDate ? (
                  <>
                    <Text style={styles.infoText}>
                      起始日期: {info.startDate}
                    </Text>
                    <Text style={styles.infoText}>
                      结束日期: {info.endDate}
                    </Text>
                    <Text style={styles.infoText}>
                      数据条数: {info.count} 天
                    </Text>
                  </>
                ) : (
                  <Text style={styles.infoText}>暂无汇率数据</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.infoText}>暂无汇率数据</Text>
        )}
      </View>

      <View style={{ height: 16 }} />

      <Text style={styles.sectionTitle}>收入 / 支出趋势</Text>
      <Text style={styles.sectionHint}>基于 react-native-gifted-charts</Text>
      <View style={{ height: 10 }} />
      <DateAmountLineChart dates={days} incomes={incomes} expenses={expenses} />
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
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
  },
  loadingText: {
    fontSize: 14,
    color: "rgb(133, 115, 110)",
  },
  errorText: {
    fontSize: 14,
    color: "rgb(220, 38, 38)",
  },
  infoContainer: {
    gap: 12,
  },
  currencySection: {
    gap: 6,
  },
  currencySectionBorder: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgb(231, 229, 228)",
  },
  currencyPairText: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "rgb(87, 83, 78)",
    lineHeight: 20,
  },
});
