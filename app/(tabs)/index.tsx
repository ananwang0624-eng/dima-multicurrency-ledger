/**
 * 主页标签页
 * 显示余额摘要和按月筛选的交易记录列表
 */
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import BalanceSummaryCard from "@/components/BalanceSummaryCard";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useAppTheme } from "@/providers/AppThemeProvider";
import TransactionRecordItem from "@/components/TransactionRecordItem";
import {
  deleteTransaction,
  getTransactionsByMonth,
  subscribeDataChanges,
  type TransactionRecord,
} from "@/utils/dataManager";

export default function HomeTab() {
  const { theme } = useAppTheme();
  // 初始化为当前年月
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<TransactionRecord[]>([]);

  // 刷新交易记录
  const refreshRecords = useCallback(async () => {
    const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    const list = await getTransactionsByMonth(yearMonth);
    setRecords(list);
  }, [selectedYear, selectedMonth]);

  // 监听年月变化，刷新记录
  useEffect(() => {
    refreshRecords().catch((e) => console.error("Failed to load records:", e));
  }, [refreshRecords]);

  // 订阅数据变化事件
  useEffect(() => {
    const unsubscribe = subscribeDataChanges(() => {
      refreshRecords().catch((e) =>
        console.error("Failed to refresh records after data change:", e),
      );
    });

    return unsubscribe;
  }, [refreshRecords]);

  // 页面获得焦点时刷新
  useFocusEffect(
    useCallback(() => {
      refreshRecords().catch((e) =>
        console.error("Failed to refresh records:", e),
      );
    }, [refreshRecords]),
  );

  const handleDeleteRecord = useCallback((record: TransactionRecord) => {
    const label = record.description?.trim() || "this record";

    Alert.alert(
      "Delete Record",
      `Delete ${label}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTransaction(record.uuid).catch((e) =>
              console.error("Failed to delete transaction:", e),
            );
          },
        },
      ],
      { cancelable: true },
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <BalanceSummaryCard />

        <View style={{ height: 16 }} />

        <MonthYearPicker
          year={selectedYear}
          month={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />

        <View style={{ height: 8 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ gap: 12 }}>
          {records.length > 0 ? (
            records.map((record) => (
              <TransactionRecordItem
                key={record.uuid}
                record={record}
                onPress={() => handleDeleteRecord(record)}
                testID={`transaction-record-${record.uuid}`}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No records
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 40,
  },
});
