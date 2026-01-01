import { CURRENCIES } from "@/data/currencies";
import type { IconTilePickerValue } from "@/data/iconTileItems";
import {
  addTransaction,
  generateUUID,
  TransactionRecord,
} from "@/utils/dataManager";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES: { id: IconTilePickerValue; name: string }[] = [
  { id: 0, name: "Dining" },
  { id: 1, name: "Transparent" },
  { id: 2, name: "Shopping" },
  { id: 3, name: "Gaming" },
  { id: 4, name: "Health" },
  { id: 5, name: "Education" },
  { id: 6, name: "Daily" },
  { id: 7, name: "Others" },
];

const TRANSACTION_TYPES: ("income" | "expense")[] = ["income", "expense"];

export default function TestPage() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<IconTilePickerValue>(0);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Date state
  const now = new Date();
  const [year, setYear] = useState(() => String(now.getFullYear()));
  const [month, setMonth] = useState(() => String(now.getMonth() + 1));
  const [day, setDay] = useState(() => String(now.getDate()));

  // Time state
  const [hours, setHours] = useState(() => String(now.getHours()));
  const [minutes, setMinutes] = useState(() => String(now.getMinutes()));

  const handleAddTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // Create date with selected date and time
    const dateWithTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours) || 0,
      parseInt(minutes) || 0,
      0,
      0
    );

    const record: TransactionRecord = {
      uuid: generateUUID(),
      amount: parseFloat(amount),
      currency,
      category,
      date: dateWithTime.toISOString(),
      description: description || undefined,
      type,
    };

    try {
      await addTransaction(record);
      Alert.alert("Success", "Transaction added successfully");
      // Reset form
      setAmount("");
      setDescription("");
      // Navigate back to settings to trigger refresh
      router.push("/(tabs)/settings");
    } catch (error) {
      Alert.alert("Error", "Failed to add transaction");
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Add Transaction</Text>

      {/* Amount */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
      </View>

      {/* Currency Picker */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowCurrencyPicker(true)}
        >
          <Text>{currency}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Picker */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text>
            {CATEGORIES.find((c) => c.id === category)?.name || "Select"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Type Picker */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Type</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowTypePicker(true)}
        >
          <Text style={{ textTransform: "capitalize" }}>{type}</Text>
        </TouchableOpacity>
      </View>

      {/* Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {year}-{month.padStart(2, "0")}-{day.padStart(2, "0")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowTimePicker(true)}
        >
          <Text>
            {hours.padStart(2, "0")}:{minutes.padStart(2, "0")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add notes..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleAddTransaction}>
        <Text style={styles.buttonText}>Add Transaction</Text>
      </TouchableOpacity>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCurrency(item.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text>
                    {item.code} - {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCurrencyPicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.modalItem}
                onPress={() => {
                  setCategory(cat.id);
                  setShowCategoryPicker(false);
                }}
              >
                <Text>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Type</Text>
            {TRANSACTION_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.modalItem}
                onPress={() => {
                  setType(t);
                  setShowTypePicker(false);
                }}
              >
                <Text style={{ textTransform: "capitalize" }}>{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={styles.datePickerContainer}>
              {/* Year Picker */}
              <View style={styles.wheelPickerWrapper}>
                <Text style={styles.timeLabel}>Year</Text>
                <View style={styles.wheelPicker}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    contentContainerStyle={styles.wheelScrollContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const index = Math.round(offsetY / 50);
                      const selectedYear = 2000 + index;
                      if (selectedYear >= 2000 && selectedYear < 2050) {
                        setYear(String(selectedYear));
                      }
                    }}
                  >
                    {Array.from({ length: 50 }, (_, i) => 2000 + i).map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[
                          styles.wheelItem,
                          parseInt(year) === y && styles.wheelItemSelected,
                        ]}
                        onPress={() => setYear(String(y))}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            parseInt(year) === y &&
                              styles.wheelItemTextSelected,
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Month Picker */}
              <View style={styles.wheelPickerWrapper}>
                <Text style={styles.timeLabel}>Month</Text>
                <View style={styles.wheelPicker}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    contentContainerStyle={styles.wheelScrollContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const index = Math.round(offsetY / 50);
                      const selectedMonth = index + 1;
                      if (selectedMonth >= 1 && selectedMonth <= 12) {
                        setMonth(String(selectedMonth));
                      }
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.wheelItem,
                          parseInt(month) === m && styles.wheelItemSelected,
                        ]}
                        onPress={() => setMonth(String(m))}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            parseInt(month) === m &&
                              styles.wheelItemTextSelected,
                          ]}
                        >
                          {String(m).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Day Picker */}
              <View style={styles.wheelPickerWrapper}>
                <Text style={styles.timeLabel}>Day</Text>
                <View style={styles.wheelPicker}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    contentContainerStyle={styles.wheelScrollContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const index = Math.round(offsetY / 50);
                      const selectedDay = index + 1;
                      if (selectedDay >= 1 && selectedDay <= 31) {
                        setDay(String(selectedDay));
                      }
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.wheelItem,
                          parseInt(day) === d && styles.wheelItemSelected,
                        ]}
                        onPress={() => setDay(String(d))}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            parseInt(day) === d && styles.wheelItemTextSelected,
                          ]}
                        >
                          {String(d).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalCloseText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <View style={styles.timePickerContainer}>
              {/* Hour Picker */}
              <View style={styles.wheelPickerWrapper}>
                <Text style={styles.timeLabel}>Hour</Text>
                <View style={styles.wheelPicker}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    contentContainerStyle={styles.wheelScrollContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const index = Math.round(offsetY / 50);
                      if (index >= 0 && index < 24) {
                        setHours(String(index));
                      }
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.wheelItem,
                          parseInt(hours) === hour && styles.wheelItemSelected,
                        ]}
                        onPress={() => setHours(String(hour))}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            parseInt(hours) === hour &&
                              styles.wheelItemTextSelected,
                          ]}
                        >
                          {String(hour).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minute Picker */}
              <View style={styles.wheelPickerWrapper}>
                <Text style={styles.timeLabel}>Minute</Text>
                <View style={styles.wheelPicker}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    contentContainerStyle={styles.wheelScrollContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const index = Math.round(offsetY / 50);
                      if (index >= 0 && index < 60) {
                        setMinutes(String(index));
                      }
                    }}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.wheelItem,
                          parseInt(minutes) === minute &&
                            styles.wheelItemSelected,
                        ]}
                        onPress={() => setMinutes(String(minute))}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            parseInt(minutes) === minute &&
                              styles.wheelItemTextSelected,
                          ]}
                        >
                          {String(minute).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.modalCloseText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 247, 245)",
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "rgb(128, 75, 56)",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "rgb(128, 75, 56)",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "rgb(128, 75, 56)",
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  wheelPickerWrapper: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  wheelPicker: {
    height: 200,
    width: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  wheelScrollContent: {
    paddingVertical: 75,
  },
  wheelItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemSelected: {
    backgroundColor: "rgba(128, 75, 56, 0.1)",
  },
  wheelItemText: {
    fontSize: 24,
    color: "#999",
  },
  wheelItemTextSelected: {
    color: "rgb(128, 75, 56)",
    fontWeight: "bold",
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: "bold",
    marginHorizontal: 16,
    color: "rgb(128, 75, 56)",
  },
});
