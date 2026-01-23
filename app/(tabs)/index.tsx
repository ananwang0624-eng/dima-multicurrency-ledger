import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import BalanceSummaryCard from "@/components/BalanceSummaryCard";
import TransactionRecordItem from "@/components/TransactionRecordItem";
import {
  getAvailableMonths,
  getTransactionsByMonth,
  subscribeDataChanges,
  type TransactionRecord,
} from "@/utils/dataManager";

export default function HomeTab() {
  const [recent, setRecent] = useState<TransactionRecord[]>([]);

  const refreshRecent = useCallback(async () => {
    const months = await getAvailableMonths();
    const next: TransactionRecord[] = [];

    for (const month of months) {
      if (next.length >= 10) break;
      const list = await getTransactionsByMonth(month);
      for (const record of list) {
        next.push(record);
        if (next.length >= 10) break;
      }
    }

    setRecent(next);
  }, []);

  useEffect(() => {
    refreshRecent().catch((e) => console.error("Failed to load recent:", e));
  }, [refreshRecent]);

  useEffect(() => {
    const unsubscribe = subscribeDataChanges(() => {
      refreshRecent().catch((e) =>
        console.error("Failed to refresh recent after data change:", e)
      );
    });

    return unsubscribe;
  }, [refreshRecent]);

  useFocusEffect(
    useCallback(() => {
      refreshRecent().catch((e) =>
        console.error("Failed to refresh recent:", e)
      );
    }, [refreshRecent])
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgb(253, 247, 245)",
        padding: 20,
      }}
    >
      <BalanceSummaryCard />

      <View style={{ height: 16 }} />

      <View style={{ gap: 12 }}>
        {recent.map((record) => (
          <TransactionRecordItem key={record.uuid} record={record} />
        ))}
      </View>
    </View>
  );
}
