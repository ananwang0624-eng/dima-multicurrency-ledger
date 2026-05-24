import { render, screen, waitFor } from "@testing-library/react-native";

const mockGetBalances = jest.fn();
const mockGetSettings = jest.fn();
const mockGetStoredExchangeRates = jest.fn();
const mockEnsureExchangeRates = jest.fn();
const mockGetExchangeRateForDate = jest.fn();
let mockDataChangeListener: (() => void) | null = null;

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("@/providers/AppThemeProvider", () => ({
  useAppTheme: () => ({
    theme: {
      cardBorder: "#000",
      cardBg: "#fff",
      textPrimary: "#111",
      accent: "#222",
      divider: "#ccc",
    },
  }),
}));

jest.mock("@/utils/dataManager", () => ({
  getBalances: (...args: unknown[]) => mockGetBalances(...args),
  subscribeDataChanges: (listener: () => void) => {
    mockDataChangeListener = listener;
    return jest.fn();
  },
}));

jest.mock("@/utils/settingsManager", () => ({
  getSettings: (...args: unknown[]) => mockGetSettings(...args),
  subscribeSettings: () => jest.fn(),
}));

jest.mock("@/utils/exchangeRateManager", () => ({
  getStoredExchangeRates: (...args: unknown[]) =>
    mockGetStoredExchangeRates(...args),
  ensureExchangeRates: (...args: unknown[]) => mockEnsureExchangeRates(...args),
  getExchangeRateForDate: (...args: unknown[]) =>
    mockGetExchangeRateForDate(...args),
}));

import BalanceSummaryCard from "@/components/BalanceSummaryCard";

describe("BalanceSummaryCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataChangeListener = null;

    mockGetSettings.mockResolvedValue({
      version: 2,
      defaultCurrencyCode: "USD",
      bookkeepingCurrencyCode: "EUR",
      bookkeepingCurrencyCodes: ["EUR", "USD"],
      themeMode: "light",
    });

    mockGetBalances.mockResolvedValue({
      EUR: 100,
      USD: 50,
    });

    mockGetStoredExchangeRates.mockResolvedValue({
      baseCurrency: "EUR",
      targetCurrency: "USD",
      rates: {
        "2026-05-24": 1.2,
      },
      lastUpdated: "2026-05-24T08:00:00.000Z",
    });

    mockEnsureExchangeRates.mockResolvedValue(undefined);
    mockGetExchangeRateForDate.mockReturnValue(1.2);
  });

  it("renders a TOTAL row in the default currency", async () => {
    render(<BalanceSummaryCard />);

    await waitFor(() => {
      expect(screen.getByText("TOTAL:")).toBeTruthy();
      expect(screen.getByText(" $170.00")).toBeTruthy();
    });

    expect(mockGetStoredExchangeRates).toHaveBeenCalledWith("EUR", "USD");
  });

  it("refreshes balances immediately after a data-change event", async () => {
    mockGetBalances
      .mockResolvedValueOnce({
        EUR: 100,
        USD: 50,
      })
      .mockResolvedValueOnce({
        EUR: 80,
        USD: 50,
      });

    render(<BalanceSummaryCard />);

    await waitFor(() => {
      expect(screen.getByText(" $170.00")).toBeTruthy();
    });

    expect(mockDataChangeListener).toBeTruthy();
    mockDataChangeListener?.();

    await waitFor(() => {
      expect(screen.getByText(" $146.00")).toBeTruthy();
    });
  });
});
