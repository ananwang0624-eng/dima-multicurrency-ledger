import { Link } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  clearAllTransactions,
  seedDeterministicTestTransactions,
} from "@/utils/dataManager";

export default function SettingsTab() {
  const handleClearAll = useCallback(async () => {
    try {
      await clearAllTransactions();
    } catch (error) {
      console.error("Failed to clear transactions:", error);
    }
  }, []);

  const handleSeedTestData = useCallback(async () => {
    try {
      await seedDeterministicTestTransactions();
    } catch (error) {
      console.error("Failed to seed test transactions:", error);
    }
  }, []);

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
