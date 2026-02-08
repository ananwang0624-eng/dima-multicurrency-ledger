/**
 * 应用设置管理器
 * 负责管理应用的全局设置，包括默认币种和记账币种列表
 * 使用 AsyncStorage 持久化存储设置
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";

/**
 * 应用设置类型
 */
export type AppSettings = {
  version: 2; // 设置数据结构版本
  defaultCurrencyCode: string; // 默认币种代码（用于汇率转换的目标币种）
  bookkeepingCurrencyCode: string; // 当前选中的记账币种
  bookkeepingCurrencyCodes: string[]; // 启用的记账币种列表
};

const SETTINGS_STORAGE_KEY = "dima:settings:v1";

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  version: 2,
  defaultCurrencyCode: "USD",
  bookkeepingCurrencyCode: "USD",
  bookkeepingCurrencyCodes: ["USD"],
};

// 设置变更监听器集合
const listeners = new Set<(next: AppSettings) => void>();

/**
 * 标准化设置对象，确保所有字段有效
 */
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
    bookkeepingCurrencyCodes,
  )
    ? bookkeepingCurrencyCodes
    : null;

  const resolvedBookkeepingCurrencyCodes = Array.from(
    new Set(
      (resolvedBookkeepingCurrencyCodesRaw ?? [resolvedDefaultCurrencyCode])
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.toUpperCase())
        .filter((c) => Boolean(getCurrencyByCode(c))),
    ),
  );

  if (resolvedBookkeepingCurrencyCodes.length === 0) {
    resolvedBookkeepingCurrencyCodes.push(resolvedDefaultCurrencyCode);
  }

  const resolvedBookkeepingCurrencyCode =
    typeof bookkeepingCurrencyCode === "string" &&
    getCurrencyByCode(bookkeepingCurrencyCode)
      ? bookkeepingCurrencyCode.toUpperCase()
      : (resolvedBookkeepingCurrencyCodes[0] ?? resolvedDefaultCurrencyCode);

  const normalized: AppSettings = {
    version: 2,
    defaultCurrencyCode: resolvedDefaultCurrencyCode,
    bookkeepingCurrencyCode: resolvedBookkeepingCurrencyCode,
    bookkeepingCurrencyCodes: resolvedBookkeepingCurrencyCodes,
  };

  return normalized;
}

/**
 * 触发设置变更事件，通知所有监听器
 */
function emit(next: AppSettings) {
  for (const listener of listeners) {
    try {
      listener(next);
    } catch (e) {
      console.error("Settings listener failed:", e);
    }
  }
}

/**
 * 订阅设置变更事件
 * @param listener 监听器函数
 * @returns 取消订阅的函数
 */
export function subscribeSettings(
  listener: (next: AppSettings) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 获取当前设置
 * @returns 当前的应用设置
 */
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

/**
 * 更新部分设置（合并更新）
 * @param patch 要更新的设置字段
 * @returns 更新后的设置
 */
export async function updateSettings(
  patch: Partial<Omit<AppSettings, "version">>,
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

/**
 * 设置默认币种
 * @param code 币种代码
 * @returns 更新后的设置
 */
export async function setDefaultCurrencyCode(
  code: string,
): Promise<AppSettings> {
  const resolved = getCurrencyByCode(code)
    ? code
    : (CURRENCIES[0]?.code ?? "USD");
  return updateSettings({ defaultCurrencyCode: resolved });
}

/**
 * 添加记账币种到启用列表
 * @param code 币种代码
 * @returns 更新后的设置
 */
export async function addBookkeepingCurrencyCode(
  code: string,
): Promise<AppSettings> {
  const resolved = getCurrencyByCode(code) ? code.toUpperCase() : null;
  if (!resolved) return getSettings();

  const current = await getSettings();
  const nextCodes = Array.from(
    new Set([...(current.bookkeepingCurrencyCodes ?? []), resolved]),
  );

  return updateSettings({ bookkeepingCurrencyCodes: nextCodes });
}

/**
 * 从启用列表中移除记账币种
 * @param code 币种代码
 * @returns 更新后的设置
 */
export async function removeBookkeepingCurrencyCode(
  code: string,
): Promise<AppSettings> {
  const resolved = code.toUpperCase();
  const current = await getSettings();

  const nextCodes = (current.bookkeepingCurrencyCodes ?? []).filter(
    (c) => c.toUpperCase() !== resolved,
  );

  // 至少保留一个币种
  const ensuredCodes =
    nextCodes.length > 0
      ? nextCodes
      : [current.bookkeepingCurrencyCode ?? current.defaultCurrencyCode];

  const nextSelected =
    current.bookkeepingCurrencyCode?.toUpperCase() === resolved
      ? (ensuredCodes[0] ?? CURRENCIES[0]?.code ?? "USD")
      : current.bookkeepingCurrencyCode;

  return updateSettings({
    bookkeepingCurrencyCodes: ensuredCodes,
    bookkeepingCurrencyCode: nextSelected,
  });
}
