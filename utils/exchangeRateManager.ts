import AsyncStorage from "@react-native-async-storage/async-storage";

// 使用 Frankfurter API（免费、无需 API key、支持历史数据）
// 文档: https://www.frankfurter.app/docs/
const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.app";
const EXCHANGE_RATE_STORAGE_KEY = "dima:exchange_rates:v1";

export type ExchangeRateData = {
  baseCurrency: string; // 基准货币（记账货币）- API 的 base 参数
  targetCurrency: string; // 目标货币（默认货币）- API 的 symbols 参数
  rates: Record<string, number>; // 日期 (YYYY-MM-DD) -> 汇率（1 baseCurrency = X targetCurrency）
  lastUpdated: string; // ISO 8601 格式的最后更新时间
};

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
 * Frankfurter 是免费的、无需 API key、支持历史数据
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
