import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { CurrencyAmountInput } from "@/components/CurrencyAmountInput";
import { DateTimePicker } from "@/components/DateTimePicker";
import {
  IconTilePicker,
  type IconTilePickerValue,
} from "@/components/IconTilePicker";
import { addTransaction, generateUUID } from "@/utils/dataManager";
import { getSettings, subscribeSettings } from "@/utils/settingsManager";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toRfc3339Local(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const offH = pad2(Math.floor(abs / 60));
  const offM = pad2(abs % 60);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}${sign}${offH}:${offM}`;
}

const COLORS = {
  background: "rgb(253, 247, 245)",
  segmentBg: "rgb(246, 233, 228)",
  active: "rgb(128, 75, 56)",
  inactiveText: "rgb(133, 115, 110)",
  activeText: "#fff",
};

const SEGMENTED = {
  height: 52,
  padding: 6,
  radius: 14,
} as const;

type SegmentedValue = 0 | 1 | 2;

function LedgerTypeSegmented({
  value,
  onChange,
}: {
  value: SegmentedValue;
  onChange: (next: SegmentedValue) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const position = useRef(new Animated.Value(value)).current;
  const dragStartPosition = useRef<number>(value);

  useEffect(() => {
    Animated.timing(position, {
      toValue: value,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [position, value]);

  const segmentedWidth = useMemo(
    () => Math.max(0, (windowWidth - 32) / 1.5),
    [windowWidth],
  );

  const indicatorWidth = useMemo(() => {
    const innerWidth = Math.max(0, segmentedWidth - SEGMENTED.padding * 2);
    return innerWidth / 3;
  }, [segmentedWidth]);

  const indicatorTranslateX = useMemo(() => {
    if (segmentedWidth <= 0) return 0;
    return position.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, indicatorWidth, indicatorWidth * 2],
      extrapolate: "clamp",
    });
  }, [position, segmentedWidth, indicatorWidth]);

  const goTo = useCallback(
    (nextIndex: SegmentedValue) => {
      onChange(nextIndex);
      Animated.timing(position, {
        toValue: nextIndex,
        duration: 160,
        useNativeDriver: true,
      }).start();
    },
    [onChange, position],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 6 && Math.abs(gesture.dy) < 12,
        onPanResponderGrant: () => {
          dragStartPosition.current = value;
        },
        onPanResponderMove: (_, gesture) => {
          if (indicatorWidth <= 0) return;
          const raw = dragStartPosition.current + gesture.dx / indicatorWidth;
          const clamped = Math.max(0, Math.min(1, raw));
          position.setValue(clamped);
        },
        onPanResponderRelease: () => {
          position.stopAnimation((val) => {
            const nextIndex: SegmentedValue =
              val >= 1.5 ? 2 : val >= 0.5 ? 1 : 0;
            goTo(nextIndex);
          });
        },
        onPanResponderTerminate: () => {
          goTo(value);
        },
      }),
    [goTo, indicatorWidth, position, value],
  );

  return (
    <View
      style={[styles.segmented, { width: segmentedWidth }]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.segmentIndicator,
          {
            width: indicatorWidth,
            transform: [{ translateX: indicatorTranslateX as any }],
          },
        ]}
      />

      <Pressable style={styles.segmentButton} onPress={() => goTo(0)}>
        <Text
          style={[
            styles.segmentText,
            value === 0 ? styles.segmentTextActive : styles.segmentTextInactive,
          ]}
        >
          Expense
        </Text>
      </Pressable>
      <Pressable style={styles.segmentButton} onPress={() => goTo(1)}>
        <Text
          style={[
            styles.segmentText,
            value === 1 ? styles.segmentTextActive : styles.segmentTextInactive,
          ]}
        >
          Income
        </Text>
      </Pressable>
      <Pressable style={styles.segmentButton} onPress={() => goTo(2)}>
        <Text
          style={[
            styles.segmentText,
            value === 2 ? styles.segmentTextActive : styles.segmentTextInactive,
          ]}
        >
          Exchange
        </Text>
      </Pressable>
    </View>
  );
}

export default function LedgerTab() {
  const [selected, setSelected] = useState<SegmentedValue>(0);
  const [selectedTile, setSelectedTile] = useState<IconTilePickerValue>(0);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [allowedCurrencyCodes, setAllowedCurrencyCodes] = useState<string[]>([
    "USD",
  ]);
  const currencyTouchedRef = useRef(false);
  const currencyCodeRef = useRef(currencyCode);
  const [amount, setAmount] = useState("");

  // 换汇模式的第二个货币输入
  const [currencyCode2, setCurrencyCode2] = useState("USD");
  const [amount2, setAmount2] = useState("");

  const [description, setDescription] = useState("");
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    currencyCodeRef.current = currencyCode;
  }, [currencyCode]);

  useEffect(() => {
    let cancelled = false;

    const applyFromSettings = (s: Awaited<ReturnType<typeof getSettings>>) => {
      const nextCodes =
        s.bookkeepingCurrencyCodes && s.bookkeepingCurrencyCodes.length > 0
          ? s.bookkeepingCurrencyCodes
          : ["USD"];

      setAllowedCurrencyCodes(nextCodes);

      const current = currencyCodeRef.current;
      const currentAllowed = nextCodes.some(
        (c) => c.toUpperCase() === current.toUpperCase(),
      );

      if (!currencyTouchedRef.current || !currentAllowed) {
        setCurrencyCode(nextCodes[0] ?? "USD");
        setCurrencyCode2(nextCodes[0] ?? "USD");
      }
    };

    (async () => {
      const s = await getSettings();
      if (cancelled) return;
      applyFromSettings(s);
    })().catch((e) => console.error("Failed to load settings:", e));

    const unsubscribe = subscribeSettings((next) => {
      if (cancelled) return;
      applyFromSettings(next);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const amountNumber = useMemo(() => {
    const normalized = amount.replace(/,/g, "").trim();
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const amountNumber2 = useMemo(() => {
    const normalized = amount2.replace(/,/g, "").trim();
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : NaN;
  }, [amount2]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (selected === 2) {
      // 换汇模式：需要两个金额都有效
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) return false;
      if (!Number.isFinite(amountNumber2) || amountNumber2 <= 0) return false;
    } else {
      // 支出/收入模式
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) return false;
    }
    return true;
  }, [amountNumber, amountNumber2, submitting, selected]);

  const onSubmit = useCallback(async () => {
    if (selected === 2) {
      // 换汇模式
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid first amount.");
        return;
      }
      if (!Number.isFinite(amountNumber2) || amountNumber2 <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid second amount.");
        return;
      }

      const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      const dateStr = toRfc3339Local(localDate);
      const desc =
        description.trim().length > 0 ? description.trim() : undefined;

      // 第一条记录：第一种货币的支出
      const record1 = {
        uuid: generateUUID(),
        amount: amountNumber,
        currency: currencyCode,
        category: 8 as IconTilePickerValue, // Exchange category
        date: dateStr,
        description: desc,
        type: "expense" as const,
      };

      // 第二条记录：第二种货币的收入
      const record2 = {
        uuid: generateUUID(),
        amount: amountNumber2,
        currency: currencyCode2,
        category: 8 as IconTilePickerValue, // Exchange category
        date: dateStr,
        description: desc,
        type: "income" as const,
      };

      try {
        setSubmitting(true);
        Keyboard.dismiss();
        await addTransaction(record1);
        await addTransaction(record2);
        setAmount("");
        setAmount2("");
        setDescription("");
        Alert.alert("Submitted", "Exchange record saved.");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Submission failed";
        Alert.alert("Submission Failed", message);
      } finally {
        setSubmitting(false);
      }
    } else {
      // 支出/收入模式
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        Alert.alert("Invalid Amount", "Please enter an amount greater than 0.");
        return;
      }

      const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      const record = {
        uuid: generateUUID(),
        amount: amountNumber,
        currency: currencyCode,
        category: selectedTile,
        date: toRfc3339Local(localDate),
        description:
          description.trim().length > 0 ? description.trim() : undefined,
        type: selected === 1 ? ("income" as const) : ("expense" as const),
      };

      try {
        setSubmitting(true);
        Keyboard.dismiss();
        await addTransaction(record);
        setAmount("");
        setDescription("");
        Alert.alert("Submitted", "Record saved.");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Submission failed";
        Alert.alert("Submission Failed", message);
      } finally {
        setSubmitting(false);
      }
    }
  }, [
    amountNumber,
    amountNumber2,
    currencyCode,
    currencyCode2,
    day,
    description,
    hour,
    minute,
    month,
    selected,
    selectedTile,
    setAmount,
    setAmount2,
    setDescription,
    year,
  ]);

  return (
    <View style={styles.container}>
      <LedgerTypeSegmented value={selected} onChange={setSelected} />
      <View style={styles.divider} />

      <CurrencyAmountInput
        currencyCode={currencyCode}
        onCurrencyChange={(next) => {
          currencyTouchedRef.current = true;
          setCurrencyCode(next);
        }}
        amount={amount}
        onAmountChange={setAmount}
        currencyCodes={allowedCurrencyCodes}
        style={styles.currencyAmount}
      />

      {selected === 2 ? (
        <>
          <View style={styles.exchangeArrowContainer}>
            <Text style={styles.exchangeArrow}>↓</Text>
          </View>
          <CurrencyAmountInput
            currencyCode={currencyCode2}
            onCurrencyChange={setCurrencyCode2}
            amount={amount2}
            onAmountChange={setAmount2}
            currencyCodes={allowedCurrencyCodes}
            style={styles.currencyAmount}
          />
        </>
      ) : null}

      <View style={[styles.divider, styles.dividerNoTopMargin]} />
      {selected !== 2 ? (
        <>
          <Text style={styles.categoryLabel}>Select Category</Text>
          <IconTilePicker value={selectedTile} onChange={setSelectedTile} />
          <View style={[styles.divider, styles.dividerNoTopMargin]} />
        </>
      ) : null}
      <Text style={styles.categoryLabel}>Select Date</Text>
      <DateTimePicker
        year={year}
        month={month}
        day={day}
        hour={hour}
        minute={minute}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onDayChange={setDay}
        onHourChange={setHour}
        onMinuteChange={setMinute}
      />
      <View style={[styles.divider, styles.dividerNoTopMargin]} />

      <Text style={styles.categoryLabel}>Description</Text>
      <View style={styles.descriptionContainer}>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add a note"
          placeholderTextColor={COLORS.inactiveText}
          style={styles.descriptionInput}
          returnKeyType="done"
          multiline={false}
          scrollEnabled={false}
          onFocus={() => setDescriptionFocused(true)}
          onBlur={() => setDescriptionFocused(false)}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          !canSubmit ? styles.submitButtonDisabled : null,
          pressed && canSubmit ? styles.submitButtonPressed : null,
        ]}
        onPress={onSubmit}
        disabled={!canSubmit}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? "提交中..." : "提交记录"}
        </Text>
      </Pressable>

      {descriptionFocused && keyboardHeight > 0 ? (
        <>
          <Pressable
            style={styles.keyboardDimmer}
            onPress={Keyboard.dismiss}
            accessible={false}
          />
          <View
            pointerEvents="none"
            style={[styles.keyboardPreview, { bottom: keyboardHeight }]}
          >
            <View style={styles.keyboardPreviewInner}>
              <Text
                style={
                  description.length > 0
                    ? styles.keyboardPreviewText
                    : styles.keyboardPreviewPlaceholder
                }
                numberOfLines={1}
              >
                {description.length > 0 ? description : "Add a note"}
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segmented: {
    alignSelf: "center",
    marginTop: 16,
    marginHorizontal: 16,
    height: SEGMENTED.height,
    padding: SEGMENTED.padding,
    borderRadius: SEGMENTED.radius,
    backgroundColor: COLORS.segmentBg,
    flexDirection: "row",
    overflow: "hidden",
  },
  segmentIndicator: {
    position: "absolute",
    left: SEGMENTED.padding,
    top: SEGMENTED.padding,
    bottom: SEGMENTED.padding,
    backgroundColor: COLORS.active,
    borderRadius: SEGMENTED.radius - SEGMENTED.padding,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: COLORS.activeText,
  },
  segmentTextInactive: {
    color: COLORS.inactiveText,
  },
  divider: {
    height: 2,
    backgroundColor: "rgb(239, 222, 216)",
    marginTop: 16,
    alignSelf: "stretch",
    width: "100%",
  },
  dividerNoTopMargin: {
    marginTop: 0,
  },
  currencyAmount: {
    marginVertical: 1,
  },
  categoryLabel: {
    marginTop: 12,
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.inactiveText,
    textAlign: "left",
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.segmentBg,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  descriptionInput: {
    fontSize: 16,
    lineHeight: 20,
    color: "#000",
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 48,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  keyboardPreview: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  keyboardPreviewInner: {
    borderRadius: 14,
    backgroundColor: COLORS.segmentBg,
    borderWidth: 2,
    borderColor: COLORS.active,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keyboardPreviewText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  keyboardPreviewPlaceholder: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.inactiveText,
  },
  keyboardDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  submitButton: {
    marginTop: 10,
    marginHorizontal: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.active,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.activeText,
  },
  exchangeArrowContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  exchangeArrow: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.active,
  },
});
