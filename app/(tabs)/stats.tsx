/**
 * 统计标签页
 * 显示按月和类型筛选的收支分类饼图
 */
import ExpenseCategoryPieChart from "@/components/ExpenseCategoryPieChart";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useAppTheme } from "@/providers/AppThemeProvider";
import TransactionTypeSelector from "@/components/TransactionTypeSelector";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  getTransactionsByMonth,
  subscribeDataChanges,
  type TransactionRecord,
} from "@/utils/dataManager";
import { getSettings, subscribeSettings } from "@/utils/settingsManager";
import {
  ensureExchangeRates,
  getStoredExchangeRates,
  type ExchangeRateData,
} from "@/utils/exchangeRateManager";

type TransactionType = "income" | "expense";

export default function StatsTab() {
  const { theme } = useAppTheme();
  // 初始化为当前年月
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<
    Map<string, ExchangeRateData>
  >(new Map());

  // 拉取指定月份的交易记录
  const refreshTransactions = useCallback(async () => {
    const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    const list = await getTransactionsByMonth(yearMonth);
    setTransactions(list);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // 订阅数据变化
  useEffect(() => {
    const unsubscribe = subscribeDataChanges(() => {
      refreshTransactions();
    });

    return unsubscribe;
  }, [refreshTransactions]);

  // 从交易记录中提取涉及的币种（排除默认币种）
  const neededCurrencies = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      if (t.currency !== defaultCurrency) {
        set.add(t.currency);
      }
    }
    return Array.from(set);
  }, [transactions, defaultCurrency]);

  // 加载设置与汇率（用于统一币种展示）
  useEffect(() => {
    const loadSettingsAndRates = async () => {
      const settings = await getSettings();
      setDefaultCurrency(settings.defaultCurrencyCode);
    };

    loadSettingsAndRates();

    const unsubscribeSettings = subscribeSettings((settings) => {
      setDefaultCurrency(settings.defaultCurrencyCode);
    });

    return unsubscribeSettings;
  }, []);

  // 当需要的币种变化时，加载对应汇率：优先用缓存，后台刷新
  useEffect(() => {
    if (neededCurrencies.length === 0) {
      setExchangeRates(new Map());
      return;
    }

    let cancelled = false;

    const loadRates = async () => {
      const ratesMap = new Map<string, ExchangeRateData>();

      // 第一步：立即用本地缓存渲染
      const cachedResults = await Promise.all(
        neededCurrencies.map(async (code) => {
          const cached = await getStoredExchangeRates(code, defaultCurrency);
          return { code, data: cached };
        }),
      );
      for (const { code, data } of cachedResults) {
        if (data && Object.keys(data.rates).length > 0) {
          ratesMap.set(`${code}-${defaultCurrency}`, data);
        }
      }
      if (!cancelled) setExchangeRates(new Map(ratesMap));

      // 第二步：后台并行确保最新
      await Promise.all(
        neededCurrencies.map(async (code) => {
          try {
            await ensureExchangeRates(code, defaultCurrency);
            const fresh = await getStoredExchangeRates(code, defaultCurrency);
            if (fresh && Object.keys(fresh.rates).length > 0) {
              ratesMap.set(`${code}-${defaultCurrency}`, fresh);
            }
          } catch (error) {
            console.error(`Failed to load exchange rate for ${code}:`, error);
          }
        }),
      );
      if (!cancelled) setExchangeRates(new Map(ratesMap));
    };

    loadRates();

    return () => {
      cancelled = true;
    };
  }, [neededCurrencies, defaultCurrency]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* 选择器行 */}
        <View style={styles.selectorsRow}>
          <View style={styles.monthPickerContainer}>
            <MonthYearPicker
              year={selectedYear}
              month={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          </View>
          <View style={styles.typeSelectorContainer}>
            <TransactionTypeSelector
              selectedType={transactionType}
              onTypeChange={setTransactionType}
            />
          </View>
        </View>

        {/* 分类饼图 */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBg,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {transactionType === "expense" ? "Expense" : "Income"} Distribution
            by Category
          </Text>
          <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
            Shows {transactionType === "expense" ? "expense" : "income"}{" "}
            proportion by category (converted to {defaultCurrency})
          </Text>
          <ExpenseCategoryPieChart
            transactions={transactions}
            defaultCurrency={defaultCurrency}
            exchangeRates={exchangeRates}
            transactionType={transactionType}
          />
        </View>
      </View>
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
  selectorsRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  monthPickerContainer: {
    flex: 1,
  },
  typeSelectorContainer: {
    paddingTop: 0,
  },
  section: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
});
