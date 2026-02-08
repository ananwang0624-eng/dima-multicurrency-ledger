/**
 * 币种数据定义
 * 包含 Frankfurter API 支持的所有币种（基于欧洲央行数据）
 */

/**
 * 币种类型
 */
export type Currency = {
  code: string; // ISO 4217 币种代码，例如 "USD"
  name: string; // 英文名称，例如 "US Dollar"
  symbol: string; // 常用币种符号，例如 "$"
};

/**
 * Frankfurter API 支持的币种列表（基于欧洲央行数据）
 * 仅包含有汇率数据的币种
 */
export const CURRENCIES: Currency[] = [
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Pound Sterling", symbol: "£" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "ISK", name: "Icelandic Króna", symbol: "kr" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
];

/**
 * 币种代码到币种对象的映射（用于快速查找）
 */
const CURRENCIES_BY_CODE: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map((currency) => [currency.code, currency]),
);

/**
 * 根据币种代码获取币种对象
 * @param code 币种代码（不区分大小写）
 * @returns 币种对象或 undefined
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES_BY_CODE[code.toUpperCase()];
}
