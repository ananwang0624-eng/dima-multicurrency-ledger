import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
const mockClearAllTransactions = jest.fn();
const mockSeedDeterministicTestTransactions = jest.fn();
const mockGetSettings = jest.fn();
const mockSetDefaultCurrencyCode = jest.fn();
const mockSubscribeSettings = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/utils/dataManager", () => ({
  clearAllTransactions: (...args: unknown[]) => mockClearAllTransactions(...args),
  seedDeterministicTestTransactions: (...args: unknown[]) =>
    mockSeedDeterministicTestTransactions(...args),
}));

jest.mock("@/utils/settingsManager", () => ({
  getSettings: (...args: unknown[]) => mockGetSettings(...args),
  setDefaultCurrencyCode: (...args: unknown[]) =>
    mockSetDefaultCurrencyCode(...args),
  subscribeSettings: (...args: unknown[]) => mockSubscribeSettings(...args),
}));

import SettingsTab from "@/app/(tabs)/settings";
import SetDefaultCurrencyScreen from "@/app/set-default-currency";

describe("settings flow integration tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribeSettings.mockReturnValue(jest.fn());
    mockGetSettings.mockResolvedValue({
      defaultCurrencyCode: "USD",
      bookkeepingCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["USD"],
      themeMode: "light",
      version: 2,
    });
    mockSetDefaultCurrencyCode.mockResolvedValue({
      defaultCurrencyCode: "EUR",
      bookkeepingCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["USD"],
      themeMode: "light",
      version: 2,
    });
  });

  it("navigates from the settings page to the currency configuration screens", () => {
    render(<SettingsTab />);

    fireEvent.press(screen.getByText("Currency Units"));
    fireEvent.press(screen.getByText("Default Currency"));

    expect(mockPush).toHaveBeenCalledWith("/set-cur-type");
    expect(mockPush).toHaveBeenCalledWith("/set-default-currency");
  });

  it("triggers data-management actions from the settings page", () => {
    render(<SettingsTab />);

    fireEvent.press(screen.getByText("Clear All Records"));
    fireEvent.press(screen.getByText("Generate Fixed Test Data"));

    expect(mockClearAllTransactions).toHaveBeenCalled();
    expect(mockSeedDeterministicTestTransactions).toHaveBeenCalled();
  });

  it("updates the default currency through the default-currency configuration flow", async () => {
    render(<SetDefaultCurrencyScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Select the default currency for new transactions"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByText("EUR"));

    await waitFor(() => {
      expect(mockSetDefaultCurrencyCode).toHaveBeenCalledWith("EUR");
    });
  });
});
