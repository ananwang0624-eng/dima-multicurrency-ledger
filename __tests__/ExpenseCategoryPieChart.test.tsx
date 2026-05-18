import { render, screen } from "@testing-library/react-native";

import ExpenseCategoryPieChart from "@/components/ExpenseCategoryPieChart";
import type { TransactionRecord } from "@/utils/dataManager";
import type { ExchangeRateData } from "@/utils/exchangeRateManager";

describe("ExpenseCategoryPieChart component tests", () => {
  it("renders the empty state when no matching transaction data exists", () => {
    render(
      <ExpenseCategoryPieChart
        transactions={[]}
        defaultCurrency="USD"
        exchangeRates={new Map()}
        transactionType="expense"
      />,
    );

    expect(screen.getByText("No expense data")).toBeTruthy();
  });

  it("renders totals and legend rows after multi-currency conversion", () => {
    const transactions: TransactionRecord[] = [
      {
        uuid: "tx-1",
        amount: 10,
        currency: "USD",
        category: 0,
        date: "2025-12-29T10:30:00.000+01:00",
        type: "expense",
      },
      {
        uuid: "tx-2",
        amount: 10,
        currency: "EUR",
        category: 1,
        date: "2025-12-29T10:30:00.000+01:00",
        type: "expense",
      },
    ];

    const exchangeRates = new Map<string, ExchangeRateData>([
      [
        "EUR-USD",
        {
          baseCurrency: "EUR",
          targetCurrency: "USD",
          rates: {
            "2025-12-29": 2,
          },
          lastUpdated: "2025-12-29T00:00:00.000Z",
        },
      ],
    ]);

    render(
      <ExpenseCategoryPieChart
        transactions={transactions}
        defaultCurrency="USD"
        exchangeRates={exchangeRates}
        transactionType="expense"
      />,
    );

    expect(screen.getByTestId("pie-chart")).toBeTruthy();
    expect(screen.getByText("Total Expense")).toBeTruthy();
    expect(screen.getByText("30.00 USD")).toBeTruthy();
    expect(screen.getByText("Dining")).toBeTruthy();
    expect(screen.getByText("Transport")).toBeTruthy();
  });
});
