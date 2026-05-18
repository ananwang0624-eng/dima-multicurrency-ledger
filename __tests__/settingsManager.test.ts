import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  __testables as settingsManagerTestables,
  removeBookkeepingCurrencyCode,
  updateSettings,
} from "@/utils/settingsManager";

const { normalizeSettings } = settingsManagerTestables;

describe("settingsManager unit tests", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns default settings for empty or invalid input", () => {
    expect(normalizeSettings(null)).toEqual({
      version: 2,
      defaultCurrencyCode: "USD",
      bookkeepingCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["USD"],
    });

    expect(
      normalizeSettings({
        defaultCurrencyCode: "INVALID",
        bookkeepingCurrencyCodes: "USD",
      }),
    ).toEqual({
      version: 2,
      defaultCurrencyCode: "USD",
      bookkeepingCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["USD"],
    });
  });

  it("removes duplicate or unsupported currency codes and keeps one valid bookkeeping currency", () => {
    expect(
      normalizeSettings({
        defaultCurrencyCode: "USD",
        bookkeepingCurrencyCode: "usd",
        bookkeepingCurrencyCodes: ["usd", "USD", "abc"],
      }),
    ).toEqual({
      version: 2,
      defaultCurrencyCode: "USD",
      bookkeepingCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["USD"],
    });
  });

  it("does not remove the final remaining bookkeeping currency", async () => {
    await updateSettings({
      bookkeepingCurrencyCode: "USD",
      bookkeepingCurrencyCodes: ["USD"],
    });

    const updated = await removeBookkeepingCurrencyCode("USD");

    expect(updated.bookkeepingCurrencyCodes).toEqual(["USD"]);
    expect(updated.bookkeepingCurrencyCode).toBe("USD");
  });
});
