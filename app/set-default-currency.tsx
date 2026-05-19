import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CURRENCIES } from "@/data/currencies";
import {
  getSettings,
  setDefaultCurrencyCode,
  subscribeSettings,
} from "@/utils/settingsManager";
import { useAppTheme } from "@/providers/AppThemeProvider";

export default function SetDefaultCurrencyScreen() {
  const { theme } = useAppTheme();
  const [defaultCurrency, setDefaultCurrency] = useState<string>("USD");

  const refresh = useCallback(async () => {
    try {
      const s = await getSettings();
      setDefaultCurrency(s.defaultCurrencyCode);
    } catch (e) {
      console.error("Failed to read settings:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeSettings((next) =>
      setDefaultCurrency(next.defaultCurrencyCode)
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select the default currency for new transactions
      </Text>

      <FlatList
        data={CURRENCIES}
        keyExtractor={(item) => item.code}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: theme.divider }]}
          />
        )}
        renderItem={({ item }) => {
          const selected = item.code === defaultCurrency;
          return (
            <Pressable
              style={[
                styles.row,
                selected ? { backgroundColor: theme.selectedBg } : null,
              ]}
              onPress={async () => {
                try {
                  await setDefaultCurrencyCode(item.code);
                  setDefaultCurrency(item.code);
                } catch (e) {
                  console.error("Failed to save default currency:", e);
                }
              }}
            >
              <Text style={[styles.symbol, { color: theme.accent }]}>
                {item.symbol}
              </Text>
              <View style={styles.textContainer}>
                <Text style={[styles.code, { color: theme.accent }]}>
                  {item.code}
                </Text>
                <Text
                  style={[styles.name, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              {selected && (
                <Text style={[styles.checkmark, { color: theme.accent }]}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  symbol: {
    width: 40,
    textAlign: "center",
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  code: {
    fontSize: 16,
    fontWeight: "700",
  },
  name: {
    marginTop: 2,
    fontSize: 14,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
