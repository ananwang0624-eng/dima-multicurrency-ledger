import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockGetTransactionsByMonth = jest.fn();
let mockDataChangeListener: (() => void) | null = null;

jest.mock("@/utils/dataManager", () => ({
  getTransactionsByMonth: (...args: unknown[]) => mockGetTransactionsByMonth(...args),
  subscribeDataChanges: (listener: () => void) => {
    mockDataChangeListener = listener;
    return jest.fn();
  },
}));

jest.mock("@/components/BalanceSummaryCard", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockBalanceSummaryCard() {
    return <Text>Balance Summary Mock</Text>;
  };
});

jest.mock("@/components/MonthYearPicker", () => ({
  MonthYearPicker: ({
    year,
    month,
    onMonthChange,
  }: {
    year: number;
    month: number;
    onMonthChange: (next: number) => void;
  }) => {
    const React = require("react");
    const { Pressable, Text, View } = require("react-native");

    return (
      <View>
        <Text>{`Selected: ${year}-${String(month).padStart(2, "0")}`}</Text>
        <Pressable onPress={() => onMonthChange(2)}>
          <Text>Switch To February</Text>
        </Pressable>
      </View>
    );
  },
}));

import HomeTab from "@/app/(tabs)/index";

describe("HomeTab integration tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataChangeListener = null;
  });

  it("loads and renders the balance summary and transaction list on mount", async () => {
    mockGetTransactionsByMonth.mockResolvedValue([
      {
        uuid: "tx-1",
        amount: 20,
        currency: "USD",
        category: 0,
        date: "2025-12-29T10:30:00.000+01:00",
        description: "Lunch",
        type: "expense",
      },
    ]);

    render(<HomeTab />);

    expect(screen.getByText("Balance Summary Mock")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Lunch")).toBeTruthy();
    });
  });

  it("renders the empty state when the selected month has no records", async () => {
    mockGetTransactionsByMonth.mockResolvedValue([]);

    render(<HomeTab />);

    await waitFor(() => {
      expect(screen.getByText("No records")).toBeTruthy();
    });
  });

  it("refreshes the overview after month changes and data-change events", async () => {
    let refreshed = false;

    mockGetTransactionsByMonth.mockImplementation((yearMonth: string) => {
      if (yearMonth.endsWith("-02")) {
        return Promise.resolve(
          refreshed
            ? [
                {
                  uuid: "tx-3",
                  amount: 40,
                  currency: "USD",
                  category: 2,
                  date: "2025-02-11T10:30:00.000+01:00",
                  description: "Refreshed Record",
                  type: "expense",
                },
              ]
            : [
                {
                  uuid: "tx-2",
                  amount: 30,
                  currency: "USD",
                  category: 1,
                  date: "2025-02-10T10:30:00.000+01:00",
                  description: "February Record",
                  type: "expense",
                },
              ],
        );
      }

      return Promise.resolve([
        {
          uuid: "tx-1",
          amount: 20,
          currency: "USD",
          category: 0,
          date: "2025-12-29T10:30:00.000+01:00",
          description: "January Record",
          type: "expense",
        },
      ]);
    });

    render(<HomeTab />);

    await waitFor(() => {
      expect(screen.getByText("January Record")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Switch To February"));

    await waitFor(() => {
      expect(screen.getByText("February Record")).toBeTruthy();
    });

    expect(mockDataChangeListener).toBeTruthy();
    refreshed = true;
    mockDataChangeListener?.();

    await waitFor(() => {
      expect(screen.getByText("Refreshed Record")).toBeTruthy();
    });
  });
});
