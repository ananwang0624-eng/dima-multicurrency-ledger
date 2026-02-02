import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [defaultCurrency, setDefaultCurrency] = useState<string>("USD");
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

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

  const refreshSettings = useCallback(async () => {
    try {
      const s = await getSettings();
      setDefaultCurrency(s.defaultCurrencyCode);
    } catch (error) {
      console.error("Failed to read settings:", error);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshLatest();
      refreshSettings();
    }, [refreshLatest, refreshSettings])
  );

  const currencyMeta = getCurrencyByCode(defaultCurrency);

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity
          style={styles.rowButton}
          onPress={() => setCurrencyPickerOpen(true)}
        >
          <Text style={styles.rowLabel}>Default Currency</Text>
          <Text style={styles.rowValue}>
            {currencyMeta
              ? `${currencyMeta.code} (${currencyMeta.symbol})`
              : defaultCurrency}
          </Text>
        </TouchableOpacity>
      </View>

      <Link href="/test" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Test - Add Transaction</Text>
        </TouchableOpacity>
      </Link>

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

      <View style={styles.latestSection}>
        <Text style={styles.latestTitle}>Latest Record</Text>
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
          <Text style={styles.latestEmpty}>No records</Text>
        )}
      </View>

      <Modal
        visible={currencyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCurrencyPickerOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Select Default Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => (
                <View style={styles.modalSeparator} />
              )}
              renderItem={({ item }) => {
                const selected = item.code === defaultCurrency;
                return (
                  <Pressable
                    style={[
                      styles.modalRow,
                      selected ? styles.modalRowSelected : null,
                    ]}
                    onPress={async () => {
                      try {
                        const next = await setDefaultCurrencyCode(item.code);
                        setDefaultCurrency(next.defaultCurrencyCode);
                      } catch (e) {
                        console.error("Failed to save default currency:", e);
                      } finally {
                        setCurrencyPickerOpen(false);
                      }
                    }}
                  >
                    <Text style={styles.modalSymbol}>{item.symbol}</Text>
                    <View style={styles.modalText}>
                      <Text style={styles.modalCode}>{item.code}</Text>
                      <Text style={styles.modalName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  section: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgb(128, 75, 56)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
    marginBottom: 8,
  },
  rowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgb(133, 115, 110)",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    maxHeight: "70%",
  },
  modalTitle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "rgb(128, 75, 56)",
  },
  modalSeparator: {
    height: 1,
    backgroundColor: "rgb(239, 222, 216)",
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  modalRowSelected: {
    backgroundColor: "rgba(128, 75, 56, 0.08)",
  },
  modalSymbol: {
    width: 34,
    textAlign: "center",
    fontSize: 20,
    color: "rgb(128, 75, 56)",
  },
  modalText: {
    flex: 1,
  },
  modalCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgb(128, 75, 56)",
  },
  modalName: {
    marginTop: 2,
    fontSize: 14,
    color: "rgb(133, 115, 110)",
  },
});
