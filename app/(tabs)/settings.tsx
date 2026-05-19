/**
 * 设置标签页
 * 提供币种设置、数据管理等功能入口
 */
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import SubmenuNavButton from "@/components/SubmenuNavButton";
import { useAppTheme } from "@/providers/AppThemeProvider";
import {
  clearAllTransactions,
  seedDeterministicTestTransactions,
} from "@/utils/dataManager";

export default function SettingsTab() {
  const { theme } = useAppTheme();

  // 清空所有交易记录
  const handleClearAll = useCallback(async () => {
    try {
      await clearAllTransactions();
    } catch (error) {
      console.error("Failed to clear transactions:", error);
    }
  }, []);

  // 生成固定测试数据（用于演示）
  const handleSeedTestData = useCallback(async () => {
    try {
      await seedDeterministicTestTransactions();
    } catch (error) {
      console.error("Failed to seed test transactions:", error);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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

      <TouchableOpacity
        style={[
          styles.dangerButton,
          {
            borderColor: theme.buttonSecondaryBorder,
            backgroundColor: theme.buttonSecondaryBg,
          },
        ]}
        onPress={handleClearAll}
      >
        <Text
          style={[styles.dangerButtonText, { color: theme.buttonSecondaryText }]}
        >
          Clear All Records
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          { backgroundColor: theme.buttonPrimaryBg },
        ]}
        onPress={handleSeedTestData}
      >
        <Text
          style={[
            styles.secondaryButtonText,
            { color: theme.buttonPrimaryText },
          ]}
        >
          Generate Fixed Test Data
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  dangerButton: {
    marginTop: 12,
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
