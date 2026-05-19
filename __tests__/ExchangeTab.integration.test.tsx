import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockGetSettings = jest.fn();
const mockSubscribeSettings = jest.fn();
const mockEnsureExchangeRates = jest.fn();
const mockGetStoredExchangeRates = jest.fn();
const mockGetMonthlyRateLevel = jest.fn();
const mockGetYearlyRateLevel = jest.fn();
const mockGetDailyFluctuationPercentage = jest.fn();
const mockGetWeeklyFluctuationPercentage = jest.fn();
const mockGetMonthlyFluctuationPercentage = jest.fn();
const mockGetLast7WeeksAverageData = jest.fn();
const mockGetLast7MonthsAverageData = jest.fn();

jest.mock("@/utils/settingsManager", () => ({
  getSettings: (...args: unknown[]) => mockGetSettings(...args),
  subscribeSettings: (...args: unknown[]) => mockSubscribeSettings(...args),
}));

jest.mock("@/utils/exchangeRateManager", () => ({
  ensureExchangeRates: (...args: unknown[]) => mockEnsureExchangeRates(...args),
  getStoredExchangeRates: (...args: unknown[]) =>
    mockGetStoredExchangeRates(...args),
  getMonthlyRateLevel: (...args: unknown[]) => mockGetMonthlyRateLevel(...args),
  getYearlyRateLevel: (...args: unknown[]) => mockGetYearlyRateLevel(...args),
  getDailyFluctuationPercentage: (...args: unknown[]) =>
    mockGetDailyFluctuationPercentage(...args),
  getWeeklyFluctuationPercentage: (...args: unknown[]) =>
    mockGetWeeklyFluctuationPercentage(...args),
  getMonthlyFluctuationPercentage: (...args: unknown[]) =>
    mockGetMonthlyFluctuationPercentage(...args),
  getLast7WeeksAverageData: (...args: unknown[]) =>
    mockGetLast7WeeksAverageData(...args),
  getLast7MonthsAverageData: (...args: unknown[]) =>
    mockGetLast7MonthsAverageData(...args),
}));

jest.mock("@/components/OptionPicker", () => ({
  OptionPicker: ({
    label,
    options,
    formatOption,
    onChange,
  }: {
    label: string;
    options: readonly string[];
    formatOption: (value: string) => string;
    onChange: (value: "daily" | "weekly" | "monthly" | "yearly") => void;
  }) => {
    const React = require("react");
    const { Pressable, Text, View } = require("react-native");

    return (
      <View>
        <Text>{label}</Text>
        {options.map((option) => (
          <Pressable
            key={`${label}-${option}`}
            onPress={() =>
              onChange(option as "daily" | "weekly" | "monthly" | "yearly")
            }
          >
            <Text>{formatOption(option)}</Text>
          </Pressable>
        ))}
      </View>
    );
  },
}));

jest.mock("@/components/ExchangeRateCard", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockExchangeRateCard({
    baseCurrency,
    trend,
    level,
    fluctuationPercentage,
  }: {
    baseCurrency: string;
    trend: string;
    level: string | number;
    fluctuationPercentage?: number | null;
  }) {
    return (
      <Text>
        {`${baseCurrency}|${trend}|${String(level)}|${String(
          fluctuationPercentage,
        )}`}
      </Text>
    );
  };
});

import ExchangeTab from "@/app/(tabs)/exchange";

const sampleRateData = {
  baseCurrency: "EUR",
  targetCurrency: "USD",
  rates: {
    "2025-12-23": 1.1,
    "2025-12-24": 1.2,
    "2025-12-25": 1.3,
    "2025-12-26": 1.4,
    "2025-12-27": 1.5,
    "2025-12-28": 1.6,
    "2025-12-29": 1.7,
  },
  lastUpdated: "2025-12-29T00:00:00.000Z",
};

describe("ExchangeTab integration tests", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockGetSettings.mockResolvedValue({
      defaultCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["EUR"],
    });
    mockSubscribeSettings.mockReturnValue(jest.fn());
    mockEnsureExchangeRates.mockResolvedValue(sampleRateData);
    mockGetStoredExchangeRates.mockResolvedValue(sampleRateData);
    mockGetMonthlyRateLevel.mockReturnValue(2);
    mockGetYearlyRateLevel.mockReturnValue(4);
    mockGetDailyFluctuationPercentage.mockReturnValue(1.25);
    mockGetWeeklyFluctuationPercentage.mockReturnValue(-2.5);
    mockGetMonthlyFluctuationPercentage.mockReturnValue(0);
    mockGetLast7WeeksAverageData.mockReturnValue({
      rates: [1, 1, 1, 1, 1, 1, 1],
      labels: ["", "", "", "", "", "", ""],
    });
    mockGetLast7MonthsAverageData.mockReturnValue({
      rates: [2, 2, 2, 2, 2, 2, 2],
      labels: ["", "", "", "", "", "", ""],
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders cached exchange-rate cards after settings and cache are loaded", async () => {
    render(<ExchangeTab />);

    await waitFor(() => {
      expect(screen.getByText("EUR|up|2|1.25")).toBeTruthy();
    });
  });

  it("renders an error state when exchange-rate loading fails", async () => {
    mockGetStoredExchangeRates.mockResolvedValue(null);
    mockEnsureExchangeRates.mockRejectedValue(new Error("network failed"));

    render(<ExchangeTab />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load: network failed")).toBeTruthy();
    });
  });

  it("refreshes trend and rating output after range selections change", async () => {
    render(<ExchangeTab />);

    await waitFor(() => {
      expect(screen.getByText("EUR|up|2|1.25")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Week"));

    await waitFor(() => {
      expect(screen.getByText("EUR|down|2|-2.5")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Year"));

    await waitFor(() => {
      expect(screen.getByText("EUR|down|4|-2.5")).toBeTruthy();
    });
  });
});
