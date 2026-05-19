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
import { useAppTheme } from "@/providers/AppThemeProvider";
import {
  addBookkeepingCurrencyCode,
  getSettings,
  removeBookkeepingCurrencyCode,
  subscribeSettings,
  type AppSettings,
} from "@/utils/settingsManager";
import { getBalance, setBalance } from "@/utils/dataManager";

export default function SetCurTypeScreen() {
  const { theme } = useAppTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceCurrencyCode, setBalanceCurrencyCode] = useState<string | null>(
    null,
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
    }, [refresh]),
  );

  const enabledCodes = useMemo(
    () => settings?.bookkeepingCurrencyCodes ?? ["USD"],
    [settings?.bookkeepingCurrencyCodes],
  );

  const enabledCurrencies = useMemo(() => {
    return enabledCodes
      .map((c) => getCurrencyByCode(c))
      .filter((c): c is NonNullable<ReturnType<typeof getCurrencyByCode>> =>
        Boolean(c),
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
        (Number.isFinite(current) ? Number(current) : 0).toFixed(2),
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.accent }]}>
        Bookkeeping Currencies
      </Text>

      <View
        style={[
          styles.section,
          {
            borderColor: theme.buttonSecondaryBorder,
            backgroundColor: theme.cardBg,
          },
        ]}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            Added Currencies
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderColor: theme.divider,
                backgroundColor: theme.iconCircleBg,
              },
            ]}
            onPress={() => setPickerOpen(true)}
          >
            <Text style={[styles.addButtonText, { color: theme.accent }]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={enabledCurrencies}
          keyExtractor={(item) => item.code}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.divider }]} />
          )}
          renderItem={({ item }) => {
            const canDelete = enabledCurrencies.length > 1;
            return (
              <View style={styles.row}>
                <Text style={[styles.symbol, { color: theme.accent }]}>
                  {item.symbol}
                </Text>
                <View style={styles.rowText}>
                  <Text style={[styles.code, { color: theme.textPrimary }]}>
                    {item.code}
                  </Text>
                  <Text
                    style={[styles.name, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
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
                    style={[
                      styles.actionButton,
                      {
                        borderColor: theme.divider,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.accent }]}>
                      set balance
                    </Text>
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
                      styles.actionButton,
                      {
                        borderColor: theme.divider,
                        backgroundColor: theme.surface,
                      },
                      !canDelete ? styles.deleteButtonDisabled : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: canDelete ? theme.accent : theme.textSecondary },
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
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            At least 1 currency must be kept
          </Text>
        ) : null}
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.divider,
              },
            ]}
            onPress={() => undefined}
          >
            <Text style={[styles.modalTitle, { color: theme.accent }]}>
              Add Bookkeeping Currency
            </Text>
            <FlatList
              data={addableCurrencies}
              keyExtractor={(item) => item.code}
              ItemSeparatorComponent={() => (
                <View
                  style={[styles.separator, { backgroundColor: theme.divider }]}
                />
              )}
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
                    <Text style={[styles.symbol, { color: theme.accent }]}>
                      {item.symbol}
                    </Text>
                    <View style={styles.rowText}>
                      <Text style={[styles.code, { color: theme.textPrimary }]}>
                        {item.code}
                      </Text>
                      <Text
                        style={[styles.name, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: theme.textSecondary }]}>
                  All available currencies added
                </Text>
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
          style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}
          onPress={() => setBalanceModalOpen(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.divider,
              },
            ]}
            onPress={() => undefined}
          >
            <Text style={[styles.modalTitle, { color: theme.accent }]}>
              set balance
            </Text>
            <View style={styles.balanceModalBody}>
              <Text style={[styles.balanceHint, { color: theme.textSecondary }]}>
                Current Balance ({balanceCurrencyCode ?? ""})
              </Text>
              <TextInput
                value={balanceInput}
                onChangeText={setBalanceInput}
                placeholder="0.00"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="decimal-pad"
                style={[
                  styles.balanceInput,
                  {
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                    backgroundColor: theme.inputBg,
                  },
                ]}
              />

              <View style={styles.balanceActionsSpacer} />
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={[
                    styles.balanceActionButton,
                    {
                      borderColor: theme.divider,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => setBalanceModalOpen(false)}
                >
                  <Text
                    style={[styles.balanceActionText, { color: theme.accent }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.balanceActionButton,
                    {
                      borderColor: theme.divider,
                      backgroundColor: theme.iconCircleBg,
                    },
                  ]}
                  onPress={() => {
                    saveBalance().catch((e) =>
                      console.error("Failed to save balance:", e),
                    );
                  }}
                >
                  <Text
                    style={[styles.balanceActionText, { color: theme.accent }]}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
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
  },
  addButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "800",
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
  },
  name: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  actionButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: 1,
  },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 2,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalTitle: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "900",
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
    marginBottom: 8,
  },
  balanceInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "800",
  },
  balanceActionsSpacer: {
    height: 12,
  },
  balanceActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  balanceActionButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  balanceActionText: {
    fontSize: 14,
    fontWeight: "800",
  },
  empty: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700",
  },
});
