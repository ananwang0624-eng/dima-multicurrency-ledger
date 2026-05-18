import { fireEvent, render, screen } from "@testing-library/react-native";

import TransactionRecordItem from "@/components/TransactionRecordItem";
import type { TransactionRecord } from "@/utils/dataManager";

const baseRecord: TransactionRecord = {
  uuid: "tx-1",
  amount: 25.5,
  currency: "USD",
  category: 0,
  date: "2025-12-29T10:30:00.000+01:00",
  description: "Lunch",
  type: "expense",
};

describe("TransactionRecordItem component tests", () => {
  it("renders the category description, time, and signed amount correctly", () => {
    render(<TransactionRecordItem record={baseRecord} />);

    expect(screen.getByText("Lunch")).toBeTruthy();
    expect(screen.getByText("12-29 10:30")).toBeTruthy();
    expect(screen.getByText("-$25.50")).toBeTruthy();
  });

  it("falls back to the category label when the description is empty", () => {
    render(
      <TransactionRecordItem
        record={{ ...baseRecord, description: "   ", type: "income" }}
      />,
    );

    expect(screen.getByText("Dining")).toBeTruthy();
    expect(screen.getByText("$25.50")).toBeTruthy();
  });

  it("supports optional press interaction", () => {
    const onPress = jest.fn();

    render(
      <TransactionRecordItem
        record={baseRecord}
        onPress={onPress}
        testID="transaction-item"
      />,
    );

    fireEvent.press(screen.getByTestId("transaction-item"));
    expect(onPress).toHaveBeenCalled();
  });
});
