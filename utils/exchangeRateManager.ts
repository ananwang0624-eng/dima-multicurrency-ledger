/**
 * 汇率管理器
 * 负责从 Frankfurter API 获取、存储和管理汇率数据
 * 支持汇率趋势分析和水平位置计算
 *
 * Frankfurter API: https://www.frankfurter.app/docs/
 * - 免费、无需 API key
 * - 支持历史数据
 */

/**
 * 判断当前汇率在过去30天历史区间的五档位置（1最低-5最高）
 * @returns 1~5 或 'insufficient-data'
 */
export function getMonthlyRateLevel(
  data: ExchangeRateData,
): number | "insufficient-data" {
  const dates = Object.keys(data.rates).sort();
  if (dates.length < 2) return "insufficient-data";
  const latest = dates[dates.length - 1];
  const latestDate = new Date(latest);
  // 取过去30天的开始日期
  const monthAgo = new Date(latestDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);
  // 过滤过去30天的数据
  const monthRates = dates
    .filter((d) => d >= monthAgoStr && d <= latest)
    .map((d) => data.rates[d]);
  if (monthRates.length < 2) return "insufficient-data";
  const sorted = [...monthRates].sort((a, b) => a - b);
  const latestRate = data.rates[latest];
  const idx = sorted.findIndex((r) => r >= latestRate);
  const pos = idx === -1 ? sorted.length : idx + 1;
  const level = Math.ceil((pos / sorted.length) * 5);
  return Math.min(Math.max(level, 1), 5);
}

/**
 * 判断当前汇率在过去365天历史区间的五档位置（1最低-5最高）
 * 返回 1~5 或 'insufficient-data'
 */
export function getYearlyRateLevel(
  data: ExchangeRateData,
): number | "insufficient-data" {
  const dates = Object.keys(data.rates).sort();
  if (dates.length < 2) return "insufficient-data";
  const latest = dates[dates.length - 1];
  const latestDate = new Date(latest);
  // 取过去365天的开始日期
  const yearAgo = new Date(latestDate.getTime() - 365 * 24 * 60 * 60 * 1000);
  const yearAgoStr = yearAgo.toISOString().slice(0, 10);
  // 过滤过去365天的数据
  const yearRates = dates
    .filter((d) => d >= yearAgoStr && d <= latest)
    .map((d) => data.rates[d]);
  if (yearRates.length < 2) return "insufficient-data";
  const sorted = [...yearRates].sort((a, b) => a - b);
  const latestRate = data.rates[latest];
  const idx = sorted.findIndex((r) => r >= latestRate);
  const pos = idx === -1 ? sorted.length : idx + 1;
  const level = Math.ceil((pos / sorted.length) * 5);
  return Math.min(Math.max(level, 1), 5);
}
/**
 * 判断以天为单位，最新汇率是升高还是降低
 * 返回 'up' | 'down' | 'flat' | 'insufficient-data'
 */
export function getDailyTrend(
  data: ExchangeRateData,
): "up" | "down" | "flat" | "insufficient-data" {
  const dates = Object.keys(data.rates).sort();
  if (dates.length < 2) return "insufficient-data";
  const latest = dates[dates.length - 1];
  const prev = dates[dates.length - 2];
  const latestRate = data.rates[latest];
  const prevRate = data.rates[prev];
  if (latestRate > prevRate) return "up";
  if (latestRate < prevRate) return "down";
  return "flat";
}

/**
 * 判断以周为单位，最新汇率是升高还是降低
 * 返回 'up' | 'down' | 'flat' | 'insufficient-data'
 */
export function getWeeklyTrend(
  data: ExchangeRateData,
): "up" | "down" | "flat" | "insufficient-data" {
  const dates = Object.keys(data.rates).sort();
  if (dates.length < 8) return "insufficient-data";
  const latest = dates[dates.length - 1];
  // 找到一周前的日期
  const latestDate = new Date(latest);
  let weekAgoDateStr = "";
  for (let i = dates.length - 2; i >= 0; i--) {
    const d = new Date(dates[i]);
    if (latestDate.getTime() - d.getTime() >= 6 * 24 * 60 * 60 * 1000) {
      weekAgoDateStr = dates[i];
      break;
    }
  }
  if (!weekAgoDateStr) return "insufficient-data";
  const latestRate = data.rates[latest];
  const weekAgoRate = data.rates[weekAgoDateStr];
  if (latestRate > weekAgoRate) return "up";
  if (latestRate < weekAgoRate) return "down";
  return "flat";
}

/**
 * 判断以月为单位，最新汇率是升高还是降低
 * 返回 'up' | 'down' | 'flat' | 'insufficient-data'
 */
export function getMonthlyTrend(
  data: ExchangeRateData,
): "up" | "down" | "flat" | "insufficient-data" {
  const dates = Object.keys(data.rates).sort();
  if (dates.length < 2) return "insufficient-data";
  const latest = dates[dates.length - 1];
  const latestDate = new Date(latest);
  let monthAgoDateStr = "";
  for (let i = 0; i < dates.length - 1; i++) {
    const d = new Date(dates[i]);
    if (latestDate.getTime() - d.getTime() >= 30 * 24 * 60 * 60 * 1000) {
      monthAgoDateStr = dates[i];
      break;
    }
  }
  if (!monthAgoDateStr) return "insufficient-data";
  const latestRate = data.rates[latest];
  const monthAgoRate = data.rates[monthAgoDateStr];
  if (latestRate > monthAgoRate) return "up";
  if (latestRate < monthAgoRate) return "down";
  return "flat";
}
import AsyncStorage from "@react-native-async-storage/async-storage";

// 使用 Frankfurter API（免费、无需 API key、支持历史数据）
const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.app";
const EXCHANGE_RATE_STORAGE_KEY = "dima:exchange_rates:v1";

/**
 * 汇率数据类型
 */
export type ExchangeRateData = {
  baseCurrency: string; // 基准货币（记账货币）
  targetCurrency: string; // 目标货币（默认货币）
  rates: Record<string, number>; // 日期 (YYYY-MM-DD) -> 汇率（1 baseCurrency = X targetCurrency）
  lastUpdated: string; // ISO 8601 格式的最后更新时间
};

/**
 * Frankfurter API 时间序列响应类型
 */
type FixerTimeseriesResponse = {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 从 AsyncStorage 获取存储的汇率数据
 */
export async function getStoredExchangeRates(
  baseCurrency: string,
  targetCurrency: string,
): Promise<ExchangeRateData | null> {
  try {
    const key = `${EXCHANGE_RATE_STORAGE_KEY}:${baseCurrency}:${targetCurrency}`;
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;

    const data = JSON.parse(json) as ExchangeRateData;
    return data;
  } catch (e) {
    console.error("Failed to get stored exchange rates:", e);
    return null;
  }
}

/**
 * 保存汇率数据到 AsyncStorage
 */
async function saveExchangeRates(data: ExchangeRateData): Promise<void> {
  try {
    const key = `${EXCHANGE_RATE_STORAGE_KEY}:${data.baseCurrency}:${data.targetCurrency}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save exchange rates:", e);
    throw e;
  }
}

/**
 * 从 Frankfurter API 获取历史汇率
 * @param baseCurrency 基准货币代码
 * @param targetCurrency 目标货币代码
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 * @returns 日期到汇率的映射
 */
async function fetchExchangeRatesFromAPI(
  baseCurrency: string,
  targetCurrency: string,
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  // Frankfurter API 端点: /{start_date}..{end_date}?from={base}&to={target}
  const url = `${FRANKFURTER_API_BASE_URL}/${startDate}..${endDate}?from=${baseCurrency}&to=${targetCurrency}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Frankfurter API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as FixerTimeseriesResponse;

  // 提取汇率数据
  const rates: Record<string, number> = {};
  for (const [date, currencyRates] of Object.entries(data.rates)) {
    if (currencyRates[targetCurrency] !== undefined) {
      rates[date] = currencyRates[targetCurrency];
    }
  }

  return rates;
}

/**
 * 获取或更新汇率数据
 * 如果本地数据不存在或过期，则从 API 获取缺失的数据
 * 自动保留过去一年的数据
 * @param baseCurrency 基准货币代码
 * @param targetCurrency 目标货币代码
 * @returns 汇率数据对象
 */
export async function ensureExchangeRates(
  baseCurrency: string,
  targetCurrency: string,
): Promise<ExchangeRateData> {
  // 如果是相同货币，返回空数据
  if (baseCurrency === targetCurrency) {
    return {
      baseCurrency,
      targetCurrency,
      rates: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  // 获取存储的数据
  let storedData = await getStoredExchangeRates(baseCurrency, targetCurrency);

  const today = formatDate(new Date());
  const oneYearAgo = formatDate(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
  );

  // 如果没有存储数据，获取过去一年的数据
  if (!storedData) {
    console.log(
      `No stored rates for ${baseCurrency}/${targetCurrency}, fetching full year...`,
    );
    const rates = await fetchExchangeRatesFromAPI(
      baseCurrency,
      targetCurrency,
      oneYearAgo,
      today,
    );

    storedData = {
      baseCurrency,
      targetCurrency,
      rates,
      lastUpdated: new Date().toISOString(),
    };

    await saveExchangeRates(storedData);
    return storedData;
  }

  // 检查最新的汇率日期
  const storedDates = Object.keys(storedData.rates).sort();
  const latestStoredDate =
    storedDates.length > 0 ? storedDates[storedDates.length - 1] : null;

  // 如果最新日期是今天，不需要更新
  if (latestStoredDate === today) {
    console.log(
      `Exchange rates for ${baseCurrency}/${targetCurrency} are up to date`,
    );
    return storedData;
  }

  // 需要获取缺失的日期
  const startDate = latestStoredDate
    ? formatDate(
        new Date(new Date(latestStoredDate).getTime() + 24 * 60 * 60 * 1000),
      )
    : oneYearAgo;

  console.log(
    `Fetching missing rates for ${baseCurrency}/${targetCurrency} from ${startDate} to ${today}...`,
  );
  const newRates = await fetchExchangeRatesFromAPI(
    baseCurrency,
    targetCurrency,
    startDate,
    today,
  );

  // 合并新旧数据
  const mergedRates = { ...storedData.rates, ...newRates };

  // 只保留过去一年的数据
  const filteredRates: Record<string, number> = {};
  for (const [date, rate] of Object.entries(mergedRates)) {
    if (date >= oneYearAgo) {
      filteredRates[date] = rate;
    }
  }

  const updatedData: ExchangeRateData = {
    baseCurrency,
    targetCurrency,
    rates: filteredRates,
    lastUpdated: new Date().toISOString(),
  };

  await saveExchangeRates(updatedData);
  return updatedData;
}

/**
 * 获取汇率数据的摘要信息
 * @param data 汇率数据对象
 * @returns 汇率数据摘要或 null
 */
export function getExchangeRateSummary(data: ExchangeRateData | null): {
  baseCurrency: string;
  targetCurrency: string;
  startDate: string | null;
  endDate: string | null;
  count: number;
} | null {
  if (!data) return null;

  const dates = Object.keys(data.rates).sort();
  return {
    baseCurrency: data.baseCurrency,
    targetCurrency: data.targetCurrency,
    startDate: dates.length > 0 ? dates[0] : null,
    endDate: dates.length > 0 ? dates[dates.length - 1] : null,
    count: dates.length,
  };
}

/**
 * 根据日期获取汇率
 * 如果指定日期没有汇率，返回最近的可用汇率
 * @param data 汇率数据对象
 * @param date 日期字符串 (YYYY-MM-DD)
 * @returns 汇率值或 null
 */
export function getExchangeRateForDate(
  data: ExchangeRateData,
  date: string,
): number | null {
  // 直接查找
  if (data.rates[date]) {
    return data.rates[date];
  }

  // 查找最近的过去日期
  const dates = Object.keys(data.rates).sort();
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] <= date) {
      return data.rates[dates[i]];
    }
  }

  // 如果没有过去的日期，返回最早的日期
  if (dates.length > 0) {
    return data.rates[dates[0]];
  }

  return null;
}
