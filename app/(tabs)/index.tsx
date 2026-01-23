import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import BalanceSummaryCard from "@/components/BalanceSummaryCard";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import TransactionRecordItem from "@/components/TransactionRecordItem";
import {
  getTransactionsByMonth,
  subscribeDataChanges,
  type TransactionRecord,
} from "@/utils/dataManager";

export default function HomeTab() {
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<TransactionRecord[]>([]);

  const refreshRecords = useCallback(async () => {
    const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    const list = await getTransactionsByMonth(yearMonth);
    setRecords(list);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    refreshRecords().catch((e) => console.error("Failed to load records:", e));
  }, [refreshRecords]);

  useEffect(() => {
    const unsubscribe = subscribeDataChanges(() => {
      refreshRecords().catch((e) =>
        console.error("Failed to refresh records after data change:", e),
      );
    });

    return unsubscribe;
  }, [refreshRecords]);

  useFocusEffect(
    useCallback(() => {
      refreshRecords().catch((e) =>
        console.error("Failed to refresh records:", e),
      );
    }, [refreshRecords]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BalanceSummaryCard />

        <View style={{ height: 16 }} />

        <MonthYearPicker
          year={selectedYear}
          month={selectedMonth}
          recordCount={records.length}
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
              <TransactionRecordItem key={record.uuid} record={record} />
            ))
          ) : (
            <Text style={styles.emptyText}>暂无记录</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
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
    color: "rgb(133, 115, 110)",
    textAlign: "center",
    paddingVertical: 40,
  },
});
