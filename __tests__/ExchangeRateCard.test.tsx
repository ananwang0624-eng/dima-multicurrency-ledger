import { render, screen } from "@testing-library/react-native";

import ExchangeRateCard from "@/components/ExchangeRateCard";

describe("ExchangeRateCard component tests", () => {
  it("renders the currency pair, current rate, trend, and chart correctly", () => {
    render(
      <ExchangeRateCard
        baseCurrency="USD"
        targetCurrency="CNY"
        currentRate={7.1234}
        trend="up"
        level={2}
        historicalRates={[1, 2, 3, 4, 5, 6, 7]}
        fluctuationPercentage={1.25}
      />,
    );

    expect(screen.getByText("$ USD/CNY")).toBeTruthy();
    expect(screen.getByText("7.1234")).toBeTruthy();
    expect(screen.getByText(/1\.25%/)).toBeTruthy();
    expect(screen.getByText("Buy")).toBeTruthy();
    expect(screen.getByText("Sell")).toBeTruthy();
    expect(screen.getByTestId("bar-chart")).toBeTruthy();
  });

  it("renders the insufficient-data state without fluctuation text", () => {
    render(
      <ExchangeRateCard
        baseCurrency="EUR"
        targetCurrency="USD"
        currentRate={0}
        trend="insufficient-data"
        level="insufficient-data"
      />,
    );

    expect(screen.getByText("€ EUR/USD")).toBeTruthy();
    expect(screen.queryAllByText("-").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+\.\d+%/)).toBeNull();
  });
});
