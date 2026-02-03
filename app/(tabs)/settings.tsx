import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";
import SubmenuNavButton from "@/components/SubmenuNavButton";
import {
  clearAllTransactions,
  readData,
  seedDeterministicTestTransactions,
  type TransactionRecord,
} from "@/utils/dataManager";
import { getSettings, setDefaultCurrencyCode } from "@/utils/settingsManager";

async function getLatestTransactionFromStorage(): Promise<TransactionRecord | null> {
  const data = await readData();

  let latest: TransactionRecord | null = null;
  let latestTimestamp = -Infinity;

  for (const records of Object.values(data)) {
    for (const record of records) {
      const ts = Date.parse(record.date);
      if (Number.isNaN(ts)) continue;
      if (ts > latestTimestamp) {
        latestTimestamp = ts;
        latest = record;
      }
    }
  }

  return latest;
}

export default function SettingsTab() {
  const [latest, setLatest] = useState<TransactionRecord | null>(null);

  const refreshLatest = useCallback(async () => {
    try {
      const record = await getLatestTransactionFromStorage();
      setLatest(record);
    } catch (error) {
      console.error("Failed to get latest transaction:", error);
      setLatest(null);
    }
  }, []);

  useEffect(() => {
    refreshLatest();
  }, [refreshLatest]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshLatest();
    }, [refreshLatest]),
  );

  const handleClearAll = useCallback(async () => {
    try {
      await clearAllTransactions();
      await refreshLatest();
    } catch (error) {
      console.error("Failed to clear transactions:", error);
    }
  }, [refreshLatest]);

  const handleSeedTestData = useCallback(async () => {
    try {
      await seedDeterministicTestTransactions();
      await refreshLatest();
    } catch (error) {
      console.error("Failed to seed test transactions:", error);
    }
  }, [refreshLatest]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <SubmenuNavButton
        title="Currency Units"
        subtitle="Set bookkeeping currency units"
        href="/set-cur-type"
        iconName="settings-outline"
      />

      <View style={{ height: 16 }} />

      <SubmenuNavButton
        title="Default Currency"
        subtitle="Set default currency for new transactions"
        href="/set-default-currency"
        iconName="cash-outline"
      />

      <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
        <Text style={styles.dangerButtonText}>Clear All Records</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleSeedTestData}
      >
        <Text style={styles.secondaryButtonText}>
          Generate Fixed Test Data (10 records)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "rgb(128, 75, 56)",
  },

  latestSection: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgb(128, 75, 56)",
  },
  latestTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    marginBottom: 8,
  },
  latestLine: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  latestEmpty: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "rgb(128, 75, 56)",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerButton: {
    marginTop: 12,
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgb(128, 75, 56)",
  },
  dangerButtonText: {
    color: "rgb(128, 75, 56)",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: "rgb(128, 75, 56)",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
