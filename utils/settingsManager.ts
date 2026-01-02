import AsyncStorage from "@react-native-async-storage/async-storage";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";

export type AppSettings = {
  version: 1;
  defaultCurrencyCode: string;
};

const SETTINGS_STORAGE_KEY = "dima:settings:v1";

const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  defaultCurrencyCode: "USD",
};

const listeners = new Set<(next: AppSettings) => void>();

function normalizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;

  const record = raw as Record<string, unknown>;
  const version = record.version;
  const defaultCurrencyCode = record.defaultCurrencyCode;

  const normalized: AppSettings = {
    version: 1,
    defaultCurrencyCode:
      typeof defaultCurrencyCode === "string" &&
      getCurrencyByCode(defaultCurrencyCode)
        ? defaultCurrencyCode
        : DEFAULT_SETTINGS.defaultCurrencyCode,
  };

  // Future-proofing: ignore unknown versions (fall back to defaults).
  if (version !== 1) return normalized;

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
    version: 1,
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
