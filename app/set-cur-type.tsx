import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";
import {
  addBookkeepingCurrencyCode,
  getSettings,
  removeBookkeepingCurrencyCode,
  subscribeSettings,
  type AppSettings,
} from "@/utils/settingsManager";

import { getBalance, setBalance } from "@/utils/dataManager";

export default function SetCurTypeScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceCurrencyCode, setBalanceCurrencyCode] = useState<string | null>(
    null
  );
  const [balanceInput, setBalanceInput] = useState("0.00");

  const refresh = useCallback(async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (e) {
      console.error("Failed to read settings:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeSettings((next) => setSettings(next));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const enabledCodes = useMemo(() => {
    return settings?.bookkeepingCurrencyCodes ?? ["USD"];
  }, [settings?.bookkeepingCurrencyCodes]);

  const enabledCurrencies = useMemo(() => {
    return enabledCodes
      .map((c) => getCurrencyByCode(c))
      .filter((c): c is NonNullable<ReturnType<typeof getCurrencyByCode>> =>
        Boolean(c)
      );
  }, [enabledCodes]);

  const addableCurrencies = useMemo(() => {
    const enabledSet = new Set(enabledCodes.map((c) => c.toUpperCase()));
    return CURRENCIES.filter((c) => !enabledSet.has(c.code.toUpperCase()));
  }, [enabledCodes]);

  const openBalanceModal = useCallback(async (code: string) => {
    const upper = code.toUpperCase();
    setBalanceCurrencyCode(upper);
    setBalanceModalOpen(true);
    try {
      const current = await getBalance(upper);
      setBalanceInput(
        (Number.isFinite(current) ? Number(current) : 0).toFixed(2)
      );
    } catch (e) {
      console.error("Failed to load balance:", e);
      setBalanceInput("0.00");
    }
  }, []);

  const saveBalance = useCallback(async () => {
    const code = balanceCurrencyCode;
    if (!code) return;

    const normalized = balanceInput.replace(/,/g, "").trim();
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value)) {
      Alert.alert("Invalid Amount", "Please enter a valid numeric amount");
      return;
    }

    try {
      await setBalance(code, value);
      setBalanceModalOpen(false);
    } catch (e) {
      console.error("Failed to set balance:", e);
      Alert.alert(
        "Save Failed",
        "Unable to save balance, please try again later",
      );
    }
  }, [balanceCurrencyCode, balanceInput]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookkeeping Currencies</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Added Currencies</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setPickerOpen(true)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={enabledCurrencies}
          keyExtractor={(item) => item.code}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const canDelete = enabledCurrencies.length > 1;
            return (
              <View style={styles.row}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => {
                      openBalanceModal(item.code).catch((e) =>
                        console.error("Failed to open balance modal:", e),
                      );
                    }}
                    style={styles.setBalanceButton}
                  >
                    <Text style={styles.setBalanceButtonText}>set balance</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!canDelete}
                    onPress={async () => {
                      if (!canDelete) return;
                      try {
                        await removeBookkeepingCurrencyCode(item.code);
                      } catch (e) {
                        console.error("Failed to remove currency:", e);
                      }
                    }}
                    style={[
                      styles.deleteButton,
                      !canDelete ? styles.deleteButtonDisabled : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.deleteButtonText,
                        !canDelete ? styles.deleteButtonTextDisabled : null,
                      ]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        {enabledCurrencies.length <= 1 ? (
          <Text style={styles.hint}>At least 1 currency must be kept</Text>
        ) : null}
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Add Bookkeeping Currency</Text>
            <FlatList
              data={addableCurrencies}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                return (
                  <Pressable
                    style={styles.modalRow}
                    onPress={async () => {
                      try {
                        await addBookkeepingCurrencyCode(item.code);
                      } catch (e) {
                        console.error("Failed to add currency:", e);
                      } finally {
                        setPickerOpen(false);
                      }
                    }}
                  >
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    <View style={styles.rowText}>
                      <Text style={styles.code}>{item.code}</Text>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>All available currencies added</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={balanceModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBalanceModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setBalanceModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>set balance</Text>
            <View style={styles.balanceModalBody}>
              <Text style={styles.balanceHint}>
                Current Balance ({balanceCurrencyCode ?? ""})
              </Text>
              <TextInput
                value={balanceInput}
                onChangeText={setBalanceInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.balanceInput}
              />

              <View style={{ height: 12 }} />
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={styles.balanceCancelButton}
                  onPress={() => setBalanceModalOpen(false)}
                >
                  <Text style={styles.balanceCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.balanceSaveButton}
                  onPress={() => {
                    saveBalance().catch((e) =>
                      console.error("Failed to save balance:", e),
                    );
                  }}
                >
                  <Text style={styles.balanceSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const HEADER_COLOR = "rgb(128, 75, 56)";
const BORDER_COLOR = "rgb(128, 75, 56)";
const BG_COLOR = "rgb(253, 247, 245)";
const CARD_BG = "rgb(255, 255, 255)";
const DIVIDER_COLOR = "rgb(239, 222, 216)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: HEADER_COLOR,
  },
  section: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    backgroundColor: CARD_BG,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: HEADER_COLOR,
  },
  addButton: {
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgb(245, 218, 208)",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: HEADER_COLOR,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "800",
    color: HEADER_COLOR,
    width: 32,
    textAlign: "center",
  },
  rowText: {
    flex: 1,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  code: {
    fontSize: 15,
    fontWeight: "800",
    color: "rgb(32, 24, 23)",
  },
  name: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "rgb(133, 115, 110)",
  },
  deleteButton: {
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgb(255, 255, 255)",
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: HEADER_COLOR,
  },
  deleteButtonTextDisabled: {
    color: "rgb(133, 115, 110)",
  },
  setBalanceButton: {
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgb(255, 255, 255)",
  },
  setBalanceButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: HEADER_COLOR,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "rgb(133, 115, 110)",
  },
  separator: {
    height: 1,
    backgroundColor: DIVIDER_COLOR,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 20,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalTitle: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "900",
    color: HEADER_COLOR,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  balanceModalBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  balanceHint: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgb(133, 115, 110)",
    marginBottom: 8,
  },
  balanceInput: {
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "rgb(32, 24, 23)",
    backgroundColor: "rgb(255, 255, 255)",
  },
  balanceActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  balanceCancelButton: {
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgb(255, 255, 255)",
  },
  balanceCancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: HEADER_COLOR,
  },
  balanceSaveButton: {
    borderWidth: 2,
    borderColor: DIVIDER_COLOR,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgb(245, 218, 208)",
  },
  balanceSaveText: {
    fontSize: 14,
    fontWeight: "800",
    color: HEADER_COLOR,
  },
  empty: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700",
    color: "rgb(133, 115, 110)",
  },
});
