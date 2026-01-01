import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  clearAllTransactions,
  readData,
  seedDeterministicTestTransactions,
  type TransactionRecord,
} from "@/utils/dataManager";

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

      <Link href="/test" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Test - Add Transaction</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
        <Text style={styles.dangerButtonText}>清空所有记账记录</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleSeedTestData}
      >
        <Text style={styles.secondaryButtonText}>
          生成固定测试记账数据（10条）
        </Text>
      </TouchableOpacity>

      <View style={styles.latestSection}>
        <Text style={styles.latestTitle}>最近一条记账记录</Text>
        {latest ? (
          <View>
            <Text style={styles.latestLine} numberOfLines={2}>
              uuid: {latest.uuid}
            </Text>
            <Text style={styles.latestLine} numberOfLines={2}>
              amount: {latest.amount}
            </Text>
            <Text style={styles.latestLine} numberOfLines={2}>
              currency: {latest.currency}
            </Text>
            <Text style={styles.latestLine} numberOfLines={2}>
              category: {latest.category}
            </Text>
            <Text style={styles.latestLine} numberOfLines={2}>
              date: {latest.date}
            </Text>
            <Text style={styles.latestLine} numberOfLines={2}>
              type: {latest.type}
            </Text>
            {latest.description ? (
              <Text style={styles.latestLine} numberOfLines={2}>
                description: {latest.description}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.latestEmpty}>暂无记录</Text>
        )}
      </View>
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
