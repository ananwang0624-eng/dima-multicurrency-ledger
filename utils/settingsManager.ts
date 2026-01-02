import AsyncStorage from "@react-native-async-storage/async-storage";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";

export type AppSettings = {
  version: 2;
  defaultCurrencyCode: string;
  bookkeepingCurrencyCode: string;
  bookkeepingCurrencyCodes: string[];
};

const SETTINGS_STORAGE_KEY = "dima:settings:v1";

const DEFAULT_SETTINGS: AppSettings = {
  version: 2,
  defaultCurrencyCode: "USD",
  bookkeepingCurrencyCode: "USD",
  bookkeepingCurrencyCodes: ["USD"],
};

const listeners = new Set<(next: AppSettings) => void>();

function normalizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;

  const record = raw as Record<string, unknown>;
  const version = record.version;
  const defaultCurrencyCode = record.defaultCurrencyCode;
  const bookkeepingCurrencyCode = record.bookkeepingCurrencyCode;
  const bookkeepingCurrencyCodes = record.bookkeepingCurrencyCodes;

  const resolvedDefaultCurrencyCode =
    typeof defaultCurrencyCode === "string" &&
    getCurrencyByCode(defaultCurrencyCode)
      ? defaultCurrencyCode
      : DEFAULT_SETTINGS.defaultCurrencyCode;

  const resolvedBookkeepingCurrencyCodesRaw = Array.isArray(
    bookkeepingCurrencyCodes
  )
    ? bookkeepingCurrencyCodes
    : null;

  const resolvedBookkeepingCurrencyCodes = Array.from(
    new Set(
      (resolvedBookkeepingCurrencyCodesRaw ?? [resolvedDefaultCurrencyCode])
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.toUpperCase())
        .filter((c) => Boolean(getCurrencyByCode(c)))
    )
  );

  if (resolvedBookkeepingCurrencyCodes.length === 0) {
    resolvedBookkeepingCurrencyCodes.push(resolvedDefaultCurrencyCode);
  }

  const resolvedBookkeepingCurrencyCode =
    typeof bookkeepingCurrencyCode === "string" &&
    getCurrencyByCode(bookkeepingCurrencyCode)
      ? bookkeepingCurrencyCode.toUpperCase()
      : resolvedBookkeepingCurrencyCodes[0] ?? resolvedDefaultCurrencyCode;

  const normalized: AppSettings = {
    version: 2,
    defaultCurrencyCode: resolvedDefaultCurrencyCode,
    bookkeepingCurrencyCode: resolvedBookkeepingCurrencyCode,
    bookkeepingCurrencyCodes: resolvedBookkeepingCurrencyCodes,
  };

  // Backward compatibility: version 1 settings did not have bookkeeping fields.
  // Unknown versions are normalized best-effort.
  if (version === 1 || version === 2) return normalized;
  return normalized;
}

function emit(next: AppSettings) {
  for (const listener of listeners) {
    try {
      listener(next);
    } catch (e) {
      console.error("Settings listener failed:", e);
    }
  }
}

export function subscribeSettings(
  listener: (next: AppSettings) => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!json) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(json) as unknown;
    return normalizeSettings(parsed);
  } catch (e) {
    console.error("Failed to read settings:", e);
    return DEFAULT_SETTINGS;
  }
}

export async function setSettings(next: AppSettings): Promise<void> {
  const normalized = normalizeSettings(next);
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  emit(normalized);
}

export async function updateSettings(
  patch: Partial<Omit<AppSettings, "version">>
): Promise<AppSettings> {
  const current = await getSettings();

  const merged: AppSettings = {
    ...current,
    ...patch,
    version: 2,
  };

  const normalized = normalizeSettings(merged);
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  emit(normalized);
  return normalized;
}

export async function setDefaultCurrencyCode(
  code: string
): Promise<AppSettings> {
  const resolved = getCurrencyByCode(code)
    ? code
    : CURRENCIES[0]?.code ?? "USD";
  return updateSettings({ defaultCurrencyCode: resolved });
}

export async function setBookkeepingCurrencyCode(
  code: string
): Promise<AppSettings> {
  const resolved = getCurrencyByCode(code)
    ? code.toUpperCase()
    : CURRENCIES[0]?.code ?? "USD";

  const current = await getSettings();
  const nextCodes = Array.from(
    new Set([...(current.bookkeepingCurrencyCodes ?? []), resolved])
  );

  return updateSettings({
    bookkeepingCurrencyCodes: nextCodes,
    bookkeepingCurrencyCode: resolved,
  });
}

export async function addBookkeepingCurrencyCode(
  code: string
): Promise<AppSettings> {
  const resolved = getCurrencyByCode(code) ? code.toUpperCase() : null;
  if (!resolved) return getSettings();

  const current = await getSettings();
  const nextCodes = Array.from(
    new Set([...(current.bookkeepingCurrencyCodes ?? []), resolved])
  );

  return updateSettings({ bookkeepingCurrencyCodes: nextCodes });
}

export async function removeBookkeepingCurrencyCode(
  code: string
): Promise<AppSettings> {
  const resolved = code.toUpperCase();
  const current = await getSettings();

  const nextCodes = (current.bookkeepingCurrencyCodes ?? []).filter(
    (c) => c.toUpperCase() !== resolved
  );

  // Keep at least one currency.
  const ensuredCodes =
    nextCodes.length > 0
      ? nextCodes
      : [current.bookkeepingCurrencyCode ?? current.defaultCurrencyCode];

  const nextSelected =
    current.bookkeepingCurrencyCode?.toUpperCase() === resolved
      ? ensuredCodes[0] ?? CURRENCIES[0]?.code ?? "USD"
      : current.bookkeepingCurrencyCode;

  return updateSettings({
    bookkeepingCurrencyCodes: ensuredCodes,
    bookkeepingCurrencyCode: nextSelected,
  });
}
