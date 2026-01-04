import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { getCurrencyByCode } from "@/data/currencies";
import { getBalances } from "@/utils/dataManager";
import { getSettings, subscribeSettings } from "@/utils/settingsManager";

const BG_COLOR = "rgb(253, 247, 245)";
const HEADER_COLOR = "rgb(128, 75, 56)";
const DIVIDER_COLOR = "rgb(239, 222, 216)";
const DARK_GRAY = "rgba(54, 48, 46, 1)";

const MONO_FONT_FAMILY = Platform.select({
  ios: "SFMono-Regular",
  android: "monospace",
  web: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  default: "monospace",
});

function toFixed2(value: number): string {
  const normalized = Math.abs(value) < 1e-9 ? 0 : value;
  return normalized.toFixed(2);
}

function formatAmount(value: number): string {
  const fixed = toFixed2(Math.abs(value));
  const unsigned = fixed;
  const [intPart, fracPart = "00"] = unsigned.split(".");

  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${intWithCommas}.${fracPart}`;
}

function formatCurrencyAmount(symbol: string, value: number): string {
  const sign = value < 0 ? "-" : " ";
  return `${sign}${symbol}${formatAmount(value)}`;
}

export default function BalanceSummaryCard() {
  const [currencyCodes, setCurrencyCodes] = useState<string[]>(["USD"]);
  const [balances, setBalances] = useState<Record<string, number>>({});

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
          .map((c) => c.toUpperCase())
      )
    );

    setCurrencyCodes(nextCodes.length > 0 ? nextCodes : ["USD"]);

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
            .map((c) => c.toUpperCase())
        )
      );

      setCurrencyCodes(nextCodes.length > 0 ? nextCodes : ["USD"]);

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

  useFocusEffect(
    useCallback(() => {
      refresh().catch((e) => console.error("Failed to refresh balances:", e));
    }, [refresh])
  );

  const rows = useMemo(() => {
    return currencyCodes.map((code) => {
      const meta = getCurrencyByCode(code);
      const symbol = meta?.symbol ?? "";
      const value = balances[code] ?? 0;
      return {
        code,
        amountText: formatCurrencyAmount(symbol, value),
      };
    });
  }, [balances, currencyCodes]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>总余额</Text>
      <View style={{ height: 10 }} />
      {rows.map((row) => (
        <Text key={row.code} style={styles.row}>
          {row.code}: <Text style={styles.rowMono}>{row.amountText}</Text>
        </Text>
      ))}
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
    fontWeight: "600",
    color: DARK_GRAY,
  },
  row: {
    fontSize: 26,
    fontWeight: "800",
    color: HEADER_COLOR,
    marginTop: 6,
  },
  rowMono: {
    fontSize: 26,
    fontWeight: "800",
    color: HEADER_COLOR,
    fontFamily: MONO_FONT_FAMILY,
  },
});
