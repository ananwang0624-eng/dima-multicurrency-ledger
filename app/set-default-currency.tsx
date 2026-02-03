import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";
import {
  getSettings,
  setDefaultCurrencyCode,
  subscribeSettings,
} from "@/utils/settingsManager";

export default function SetDefaultCurrencyScreen() {
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
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Select the default currency for new transactions
      </Text>

      <FlatList
        data={CURRENCIES}
        keyExtractor={(item) => item.code}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const selected = item.code === defaultCurrency;
          return (
            <Pressable
              style={[styles.row, selected ? styles.rowSelected : null]}
              onPress={async () => {
                try {
                  await setDefaultCurrencyCode(item.code);
                  setDefaultCurrency(item.code);
                } catch (e) {
                  console.error("Failed to save default currency:", e);
                }
              }}
            >
              <Text style={styles.symbol}>{item.symbol}</Text>
              <View style={styles.textContainer}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              {selected && <Text style={styles.checkmark}>✓</Text>}
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
    backgroundColor: "rgb(253, 247, 245)",
  },
  subtitle: {
    fontSize: 14,
    color: "rgb(133, 115, 110)",
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "rgb(239, 222, 216)",
    marginHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: "rgba(128, 75, 56, 0.08)",
  },
  symbol: {
    width: 40,
    textAlign: "center",
    fontSize: 24,
    color: "rgb(128, 75, 56)",
  },
  textContainer: {
    flex: 1,
  },
  code: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
  },
  name: {
    marginTop: 2,
    fontSize: 14,
    color: "rgb(133, 115, 110)",
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgb(128, 75, 56)",
  },
});
