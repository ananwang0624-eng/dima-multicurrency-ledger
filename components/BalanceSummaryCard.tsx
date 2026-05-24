/**
 * 余额摘要卡片组件
 * 显示所有启用的记账币种及其余额
 * 支持自动刷新和订阅设置变化
 */
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getCurrencyByCode } from "@/data/currencies";
import { useAppTheme } from "@/providers/AppThemeProvider";
import { getBalances } from "@/utils/dataManager";
import {
  ensureExchangeRates,
  getExchangeRateForDate,
  getStoredExchangeRates,
  type ExchangeRateData,
} from "@/utils/exchangeRateManager";
import { getSettings, subscribeSettings } from "@/utils/settingsManager";

/**
 * 数值保留两位小数（避免浮点误差）
 */
function toFixed2(value: number): string {
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  return normalized.toFixed(2);
}

/**
 * 金额格式化（千分位）
 */
function formatAmount(value: number): string {
  const fixed = toFixed2(Math.abs(value));
  const unsigned = fixed;
  const [intPart, fracPart = "00"] = unsigned.split(".");

  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${intWithCommas}.${fracPart}`;
}

/**
 * 拼接币种符号与金额
 */
function formatCurrencyAmount(symbol: string, value: number): string {
  const sign = value < 0 ? "-" : " ";
  return `${sign}${symbol}${formatAmount(value)}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BalanceSummaryCard() {
  const { theme } = useAppTheme();
  const [currencyCodes, setCurrencyCodes] = useState<string[]>(["USD"]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState<Map<string, ExchangeRateData>>(
    new Map(),
  );

  // 读取设置与余额
  const refresh = useCallback(async () => {
    const s = await getSettings();

    const nextCodesRaw =
      s.bookkeepingCurrencyCodes && s.bookkeepingCurrencyCodes.length > 0
        ? s.bookkeepingCurrencyCodes
        : [s.bookkeepingCurrencyCode ?? s.defaultCurrencyCode ?? "USD"];

    const nextCodes = Array.from(
      new Set(
        nextCodesRaw
          .filter((c): c is string => typeof c === "string")
          .map((c) => c.toUpperCase()),
      ),
    );

    setCurrencyCodes(nextCodes.length > 0 ? nextCodes : ["USD"]);
    setDefaultCurrencyCode(s.defaultCurrencyCode ?? "USD");

    const all = await getBalances();
    const nextBalances: Record<string, number> = {};
    for (const code of nextCodes) {
      const b = all[code] ?? 0;
      nextBalances[code] = Number.isFinite(b) ? Number(b) : 0;
    }
    setBalances(nextBalances);
  }, []);

  useEffect(() => {
    let cancelled = false;

    refresh().catch((e) => console.error("Failed to load balances:", e));

    const unsubscribe = subscribeSettings((next) => {
      if (cancelled) return;

      const nextCodesRaw =
        next.bookkeepingCurrencyCodes &&
        next.bookkeepingCurrencyCodes.length > 0
          ? next.bookkeepingCurrencyCodes
          : [next.bookkeepingCurrencyCode ?? next.defaultCurrencyCode ?? "USD"];

      const nextCodes = Array.from(
        new Set(
          nextCodesRaw
            .filter((c): c is string => typeof c === "string")
            .map((c) => c.toUpperCase()),
        ),
      );

      setCurrencyCodes(nextCodes.length > 0 ? nextCodes : ["USD"]);
      setDefaultCurrencyCode(next.defaultCurrencyCode ?? "USD");

      getBalances()
        .then((all) => {
          if (cancelled) return;
          const nextBalances: Record<string, number> = {};
          for (const code of nextCodes) {
            const b = all[code] ?? 0;
            nextBalances[code] = Number.isFinite(b) ? Number(b) : 0;
          }
          setBalances(nextBalances);
        })
        .catch((e) => console.error("Failed to refresh balances:", e));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [refresh]);

  // 页面获得焦点时刷新
  useFocusEffect(
    useCallback(() => {
      refresh().catch((e) => console.error("Failed to refresh balances:", e));
    }, [refresh]),
  );

  useEffect(() => {
    const neededCurrencies = currencyCodes.filter(
      (code) => code !== defaultCurrencyCode,
    );

    if (neededCurrencies.length === 0) {
      setExchangeRates(new Map());
      return;
    }

    let cancelled = false;

    const loadRates = async () => {
      const ratesMap = new Map<string, ExchangeRateData>();

      const cachedResults = await Promise.all(
        neededCurrencies.map(async (code) => {
          const cached = await getStoredExchangeRates(code, defaultCurrencyCode);
          return { code, data: cached };
        }),
      );

      for (const { code, data } of cachedResults) {
        if (data && Object.keys(data.rates).length > 0) {
          ratesMap.set(`${code}-${defaultCurrencyCode}`, data);
        }
      }

      if (!cancelled) {
        setExchangeRates(new Map(ratesMap));
      }

      await Promise.all(
        neededCurrencies.map(async (code) => {
          try {
            await ensureExchangeRates(code, defaultCurrencyCode);
            const fresh = await getStoredExchangeRates(code, defaultCurrencyCode);
            if (fresh && Object.keys(fresh.rates).length > 0) {
              ratesMap.set(`${code}-${defaultCurrencyCode}`, fresh);
            }
          } catch (error) {
            console.error(`Failed to load exchange rate for ${code}:`, error);
          }
        }),
      );

      if (!cancelled) {
        setExchangeRates(new Map(ratesMap));
      }
    };

    loadRates().catch((error) =>
      console.error("Failed to prepare total balance exchange rates:", error),
    );

    return () => {
      cancelled = true;
    };
  }, [currencyCodes, defaultCurrencyCode]);

  // 生成展示行
  const rows = useMemo(() => {
    const currencyRows = currencyCodes.map((code) => {
      const meta = getCurrencyByCode(code);
      const symbol = meta?.symbol ?? "";
      const value = balances[code] ?? 0;
      return {
        code,
        amountText: formatCurrencyAmount(symbol, value),
      };
    });

    const totalValue = currencyCodes.reduce((sum, code) => {
      const balance = balances[code] ?? 0;
      if (code === defaultCurrencyCode) {
        return sum + balance;
      }

      const rateData = exchangeRates.get(`${code}-${defaultCurrencyCode}`);
      if (!rateData) {
        return sum + balance;
      }

      const rate = getExchangeRateForDate(rateData, getTodayDateString());
      if (!rate) {
        return sum + balance;
      }

      return sum + balance * rate;
    }, 0);

    const totalSymbol = getCurrencyByCode(defaultCurrencyCode)?.symbol ?? "";
    return [
      ...currencyRows,
      {
        code: "TOTAL",
        amountText: formatCurrencyAmount(totalSymbol, totalValue),
      },
    ];
  }, [balances, currencyCodes, defaultCurrencyCode, exchangeRates]);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.cardBorder,
          backgroundColor: theme.cardBg,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Total Balance
      </Text>
      <View style={{ height: 10 }} />
      {rows.map((row, index) => (
        <View key={row.code}>
          <View style={styles.rowContainer}>
            <Text style={[styles.rowCode, { color: theme.accent }]}>
              {row.code}:
            </Text>
            <Text style={[styles.rowAmount, { color: theme.accent }]}>
              {row.amountText}
            </Text>
          </View>
          {index < rows.length - 1 && (
            <View
              style={[styles.divider, { backgroundColor: theme.divider }]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  divider: {
    height: 1,
    marginTop: 6,
  },
  rowCode: {
    fontSize: 26,
    fontWeight: "800",
  },
  rowAmount: {
    fontSize: 26,
    fontWeight: "800",
  },
});
