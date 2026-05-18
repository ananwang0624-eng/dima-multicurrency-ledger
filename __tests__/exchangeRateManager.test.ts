import {
  getDailyFluctuationPercentage,
  getMonthlyRateLevel,
  getYearlyRateLevel,
  type ExchangeRateData,
} from "@/utils/exchangeRateManager";

function createExchangeRateData(values: number[]): ExchangeRateData {
  const rates: Record<string, number> = {};
  const start = new Date("2025-01-01T00:00:00.000Z");

  values.forEach((value, index) => {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    rates[current.toISOString().slice(0, 10)] = value;
  });

  return {
    baseCurrency: "USD",
    targetCurrency: "CNY",
    rates,
    lastUpdated: "2025-01-31T00:00:00.000Z",
  };
}

describe("exchangeRateManager unit tests", () => {
  it("returns the correct daily fluctuation percentage and null for insufficient data", () => {
    const twoDays = createExchangeRateData([7.0, 7.14]);
    const oneDay = createExchangeRateData([7.0]);

    expect(getDailyFluctuationPercentage(twoDays)).toBeCloseTo(2, 5);
    expect(getDailyFluctuationPercentage(oneDay)).toBeNull();
  });

  it("maps low and high current rates to the appropriate monthly rating bands", () => {
    const stableLow = createExchangeRateData([
      ...Array.from({ length: 20 }, () => 30),
      ...Array.from({ length: 10 }, () => 10),
    ]);
    const stableHigh = createExchangeRateData([
      ...Array.from({ length: 20 }, () => 10),
      ...Array.from({ length: 10 }, () => 30),
    ]);

    expect(getMonthlyRateLevel(stableLow)).toBe(1);
    expect(getMonthlyRateLevel(stableHigh)).toBe(4);
  });

  it("applies momentum correction to soften aggressive buy or sell recommendations", () => {
    const stableLow = createExchangeRateData([
      ...Array.from({ length: 20 }, () => 30),
      ...Array.from({ length: 10 }, () => 10),
    ]);
    const fallingLow = createExchangeRateData([
      ...Array.from({ length: 20 }, () => 30),
      ...Array.from({ length: 5 }, () => 20),
      ...Array.from({ length: 5 }, () => 10),
    ]);
    const stableHigh = createExchangeRateData([
      ...Array.from({ length: 321 }, () => 10),
      ...Array.from({ length: 43 }, () => 49),
      50,
    ]);
    const risingHigh = createExchangeRateData([
      ...Array.from({ length: 321 }, () => 10),
      ...Array.from({ length: 22 }, () => 20),
      ...Array.from({ length: 21 }, () => 40),
      50,
    ]);

    expect(getMonthlyRateLevel(fallingLow)).toBeGreaterThan(
      getMonthlyRateLevel(stableLow) as number,
    );
    expect(getYearlyRateLevel(risingHigh)).toBeLessThan(
      getYearlyRateLevel(stableHigh) as number,
    );
  });
});
