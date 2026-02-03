/**
 * 统计标签页
 * 显示按月和类型筛选的收支分类饼图
 */
import ExpenseCategoryPieChart from "@/components/ExpenseCategoryPieChart";
import { MonthYearPicker } from "@/components/MonthYearPicker";
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
  type ExchangeRateData,
} from "@/utils/exchangeRateManager";
import { CURRENCIES } from "@/data/currencies";

type TransactionType = "income" | "expense";

export default function StatsTab() {
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

  // 加载设置与汇率（用于统一币种展示）
  useEffect(() => {
    const loadSettingsAndRates = async () => {
      const settings = await getSettings();
      setDefaultCurrency(settings.defaultCurrencyCode);

      // 获取所有需要的汇率
      const ratesMap = new Map<string, ExchangeRateData>();
      for (const currency of CURRENCIES) {
        if (currency.code !== settings.defaultCurrencyCode) {
          try {
            const rateData = await ensureExchangeRates(
              currency.code,
              settings.defaultCurrencyCode,
            );
            ratesMap.set(
              `${currency.code}-${settings.defaultCurrencyCode}`,
              rateData,
            );
          } catch (error) {
            console.error(
              `Failed to load exchange rate for ${currency.code}:`,
              error,
            );
          }
        }
      }
      setExchangeRates(ratesMap);
    };

    loadSettingsAndRates();

    const unsubscribeSettings = subscribeSettings((settings) => {
      setDefaultCurrency(settings.defaultCurrencyCode);
      loadSettingsAndRates();
    });

    return unsubscribeSettings;
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 选择器行 */}
        <View style={styles.selectorsRow}>
          <View style={styles.monthPickerContainer}>
            <MonthYearPicker
              year={selectedYear}
              month={selectedMonth}
              recordCount={transactions.length}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {transactionType === "expense" ? "Expense" : "Income"} Distribution
            by Category
          </Text>
          <Text style={styles.sectionHint}>
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
    backgroundColor: "rgb(253, 247, 245)",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "rgb(133, 115, 110)",
    marginBottom: 12,
  },
});
