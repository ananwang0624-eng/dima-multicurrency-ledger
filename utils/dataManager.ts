/**
 * 记账数据管理器
 * 负责管理本地存储的记账数据，包括交易记录和余额信息
 * 数据存储格式：JSON 文件，按月份分组组织交易记录
 */
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";
import type { IconTilePickerValue } from "@/data/iconTileItems";

const DATA_FILE_NAME = "bookkeeping_data.json";
const dataFile = new File(Paths.document, DATA_FILE_NAME);

// 数据变更监听器类型
type DataChangeListener = () => void;
const dataChangeListeners = new Set<DataChangeListener>();

/**
 * 通知所有监听器数据已变更
 */
function notifyDataChange(): void {
  for (const listener of dataChangeListeners) {
    try {
      listener();
    } catch (e) {
      console.warn("⚠️ Data change listener failed:", e);
    }
  }
}

/**
 * 订阅记账数据变更事件
 * 在数据文件成功写入后触发
 * @param listener 监听器函数
 * @returns 取消订阅的函数
 */
export function subscribeDataChanges(listener: DataChangeListener): () => void {
  dataChangeListeners.add(listener);
  return () => {
    dataChangeListeners.delete(listener);
  };
}

/**
 * 交易记录类型
 */
export type TransactionRecord = {
  uuid: string; // 唯一标识符
  amount: number; // 金额（必须为正数）
  currency: string; // 币种代码
  category: IconTilePickerValue; // 分类索引 (0-8)
  date: string; // ISO 8601 / RFC 3339 日期时间字符串
  description?: string; // 可选描述
  type: "income" | "expense"; // 类型：收入或支出
};

/**
 * 按币种统计的余额
 * 键：币种代码，值：余额数值
 */
export type BalancesByCurrency = Record<string, number>;

// ISO 8601 / RFC 3339 日期时间格式正则表达式
const ISO_8601_RFC_3339_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * 验证字符串是否为有效的 ISO 8601 / RFC 3339 日期时间格式
 */
function isIso8601Rfc3339DateTime(value: string): boolean {
  if (!ISO_8601_RFC_3339_DATE_TIME.test(value)) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}

/**
 * 验证交易记录的完整性和有效性
 * @throws {Error} 如果记录不符合规范则抛出错误
 */
function validateTransactionRecord(record: TransactionRecord): void {
  if (!record.uuid || typeof record.uuid !== "string") {
    throw new Error("Invalid transaction: uuid is required");
  }

  if (!Number.isFinite(record.amount) || record.amount <= 0) {
    throw new Error("Invalid transaction: amount must be a positive number");
  }

  if (!record.currency || typeof record.currency !== "string") {
    throw new Error("Invalid transaction: currency is required");
  }
  if (!getCurrencyByCode(record.currency)) {
    throw new Error(
      `Invalid transaction: unsupported currency code '${record.currency}'`,
    );
  }

  if (
    !Number.isInteger(record.category) ||
    record.category < 0 ||
    record.category > 8
  ) {
    throw new Error(
      "Invalid transaction: category must be an integer between 0 and 8",
    );
  }

  if (!record.date || typeof record.date !== "string") {
    throw new Error("Invalid transaction: date is required");
  }
  if (!isIso8601Rfc3339DateTime(record.date)) {
    throw new Error(
      "Invalid transaction: date must be an ISO 8601 / RFC 3339 datetime string",
    );
  }

  if (record.type !== "income" && record.type !== "expense") {
    throw new Error("Invalid transaction: type must be 'income' or 'expense'");
  }

  if (
    record.description !== undefined &&
    typeof record.description !== "string"
  ) {
    throw new Error("Invalid transaction: description must be a string");
  }
}

/**
 * 记账数据结构，按年-月分组 (YYYY-MM)
 * 示例：{ "2025-12": [...], "2025-11": [...] }
 */
export type BookkeepingData = Record<string, TransactionRecord[]>;

/**
 * 记账文件结构（版本 2）
 */
type BookkeepingFile = {
  version: 2;
  transactionsByMonth: BookkeepingData; // 按月分组的交易记录
  balances: BalancesByCurrency; // 各币种余额
};

/**
 * 创建默认的余额对象（所有支持的币种余额均为 0）
 */
function createDefaultBalances(): BalancesByCurrency {
  return Object.fromEntries(CURRENCIES.map((c) => [c.code, 0] as const));
}

function normalizeBalancesForWrite(
  balances: BalancesByCurrency | undefined,
): BalancesByCurrency {
  const normalized = createDefaultBalances();

  if (!balances || typeof balances !== "object") return normalized;

  for (const [codeRaw, value] of Object.entries(balances)) {
    if (!codeRaw) continue;
    const code = codeRaw.toUpperCase();
    if (!getCurrencyByCode(code)) continue;
    normalized[code] = Number.isFinite(value) ? Number(value) : 0;
  }

  return normalized;
}

/**
 * 根据交易记录计算所有币种的余额
 * @param transactionsByMonth 按月分组的交易记录
 * @returns 每种币种的余额
 */
function computeBalances(
  transactionsByMonth: BookkeepingData,
): BalancesByCurrency {
  const balances: BalancesByCurrency = createDefaultBalances();

  for (const records of Object.values(transactionsByMonth)) {
    if (!Array.isArray(records)) continue;
    for (const record of records) {
      if (!record || typeof record !== "object") continue;
      const currency =
        typeof record.currency === "string"
          ? record.currency.toUpperCase()
          : null;

      if (!currency || !getCurrencyByCode(currency)) continue;
      if (!Number.isFinite(record.amount) || record.amount <= 0) continue;
      if (record.type !== "income" && record.type !== "expense") continue;

      const signed = record.type === "income" ? record.amount : -record.amount;
      balances[currency] = (balances[currency] ?? 0) + signed;
    }
  }

  // Ensure new currencies added in future are present.
  for (const c of CURRENCIES) {
    if (!Object.prototype.hasOwnProperty.call(balances, c.code)) {
      balances[c.code] = 0;
    }
  }

  return balances;
}

function normalizeBookkeepingFile(raw: unknown): BookkeepingFile {
  const defaults: BookkeepingFile = {
    version: 2,
    transactionsByMonth: {},
    balances: createDefaultBalances(),
  };

  if (!raw || typeof raw !== "object") return defaults;

  const record = raw as Record<string, unknown>;

  // v2 (current)
  if (record.version === 2) {
    const transactionsByMonthRaw = record.transactionsByMonth;

    const transactionsByMonth: BookkeepingData =
      transactionsByMonthRaw && typeof transactionsByMonthRaw === "object"
        ? (transactionsByMonthRaw as BookkeepingData)
        : {};

    const balances = computeBalances(transactionsByMonth);

    return {
      version: 2,
      transactionsByMonth,
      balances,
    };
  }

  // v1 (legacy): the whole file is BookkeepingData
  const transactionsByMonth = record as unknown as BookkeepingData;
  return {
    version: 2,
    transactionsByMonth,
    balances: computeBalances(transactionsByMonth),
  };
}

function shouldPersistNormalized(
  raw: unknown,
  normalized: BookkeepingFile,
): boolean {
  if (!raw || typeof raw !== "object") return true;
  const record = raw as Record<string, unknown>;
  if (record.version !== 2) return true;
  if (!record.balances || typeof record.balances !== "object") return true;

  // Ensure all currencies exist.
  const balances = record.balances as Record<string, unknown>;
  for (const c of CURRENCIES) {
    if (!(c.code in balances)) return true;
  }

  return false;
}

const DEFAULT_DATA: BookkeepingData = {};

const DEFAULT_FILE: BookkeepingFile = {
  version: 2,
  transactionsByMonth: DEFAULT_DATA,
  balances: createDefaultBalances(),
};

const SEEDED_CURRENCIES = ["CNY", "EUR"] as const;
const SEEDED_DAYS = 60;
const SEEDED_RECORDS_PER_DAY = 5;

function randomIntInclusive(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randomPick<T>(items: readonly T[]): T {
  return items[randomIntInclusive(0, items.length - 1)]!;
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatSeedDayIdLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function generateSeededTestTransactions(
  now: Date = new Date(),
): TransactionRecord[] {
  const records: TransactionRecord[] = [];

  // Use local-noon as the anchor to avoid UTC conversion shifting the day.
  const anchor = new Date(now);
  anchor.setHours(12, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < SEEDED_DAYS; dayOffset++) {
    const day = new Date(anchor);
    day.setDate(anchor.getDate() - dayOffset);

    const dayId = formatSeedDayIdLocal(day);

    for (let i = 1; i <= SEEDED_RECORDS_PER_DAY; i++) {
      const type: TransactionRecord["type"] =
        Math.random() < 0.2 ? "income" : "expense";
      const currency = randomPick(SEEDED_CURRENCIES);
      const category = randomIntInclusive(0, 7) as IconTilePickerValue;

      const hour = randomIntInclusive(7, 22);
      const minute = randomIntInclusive(0, 59);
      const second = randomIntInclusive(0, 59);
      const dateLocal = new Date(day);
      dateLocal.setHours(hour, minute, second, 0);

      const amount =
        type === "income"
          ? roundTo2(randomIntInclusive(50, 3000) + Math.random())
          : roundTo2(randomIntInclusive(5, 800) + Math.random());

      records.push({
        uuid: `seed-${dayId}-${String(i).padStart(3, "0")}`,
        amount,
        currency,
        category,
        date: dateLocal.toISOString(),
        description: `${currency} ${type}`,
        type,
      });
    }
  }

  return records;
}

/**
 * 清空所有记账记录
 */
export async function clearAllTransactions(): Promise<void> {
  await initializeDataFile();
  await writeBookkeepingFile(DEFAULT_FILE);
}

/**
 * 生成确定性的测试交易记录用于手动测试
 * 幂等性：插入前会移除现有的种子 UUID
 */
export async function seedDeterministicTestTransactions(): Promise<void> {
  await initializeDataFile();

  const seededTransactions = generateSeededTestTransactions();

  for (const record of seededTransactions) {
    validateTransactionRecord(record);
  }

  const file = await readBookkeepingFile();
  const data = file.transactionsByMonth;

  for (const key of Object.keys(data)) {
    data[key] = (data[key] || []).filter((t) => !t.uuid.startsWith("seed-"));
  }

  for (const record of seededTransactions) {
    const key = getYearMonthKey(record.date);
    if (!data[key]) data[key] = [];
    data[key].push(record);
    data[key].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  await writeBookkeepingFile({
    version: 2,
    transactionsByMonth: data,
    balances: computeBalances(data),
  });
}

/**
 * 为新交易记录生成 UUID
 * @returns 随机 UUID 字符串
 */
export function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * 从 ISO 日期字符串提取年-月键
 * @param date ISO 日期字符串（例如："2025-12-29T10:30:00.000+01:00"）
 * @returns 年-月键（例如："2025-12"）
 */
export function getYearMonthKey(date: string): string {
  return date.substring(0, 7); // "YYYY-MM"
}

/**
 * 添加交易记录到数据中
 * 自动按年-月分组并按日期排序（降序）
 * @param record 要添加的交易记录
 */
export async function addTransaction(record: TransactionRecord): Promise<void> {
  const normalizedRecord: TransactionRecord = {
    ...record,
    currency: record.currency.toUpperCase(),
  };
  validateTransactionRecord(normalizedRecord);

  const file = await readBookkeepingFile();
  const data = file.transactionsByMonth;
  const key = getYearMonthKey(normalizedRecord.date);

  if (!data[key]) {
    data[key] = [];
  }

  data[key].push(normalizedRecord);

  // Sort by date in descending order (newest first)
  data[key].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const code = normalizedRecord.currency.toUpperCase();
  const signed =
    normalizedRecord.type === "income"
      ? normalizedRecord.amount
      : -normalizedRecord.amount;
  file.balances[code] = (file.balances[code] ?? 0) + signed;

  await writeBookkeepingFile(file);
}

/**
 * 获取指定年-月的交易记录
 * @param yearMonth 年-月键（例如："2025-12"）
 * @returns 该月的交易记录数组
 */
export async function getTransactionsByMonth(
  yearMonth: string,
): Promise<TransactionRecord[]> {
  const file = await readBookkeepingFile();
  return file.transactionsByMonth[yearMonth] || [];
}

/**
 * 在应用启动时初始化数据文件
 * 如果文件不存在，则使用默认数据创建文件
 */
export async function initializeDataFile(): Promise<void> {
  try {
    if (!dataFile.exists) {
      await dataFile.write(JSON.stringify(DEFAULT_FILE, null, 2));
      console.log("✅ Data file created:", dataFile.uri);
    } else {
      // Best-effort migration: ensure schema includes balances.
      try {
        const content = await dataFile.text();
        const parsed = JSON.parse(content) as unknown;
        const normalized = normalizeBookkeepingFile(parsed);
        if (shouldPersistNormalized(parsed, normalized)) {
          await dataFile.write(JSON.stringify(normalized, null, 2));
          console.log("✅ Data file migrated:", dataFile.uri);
        } else {
          console.log("✅ Data file already exists:", dataFile.uri);
        }
      } catch (e) {
        console.warn("⚠️ Failed to migrate data file, keeping as-is:", e);
      }
    }
  } catch (error) {
    console.error("❌ Error initializing data file:", error);
    throw error;
  }
}

/**
 * 从文件读取记账数据
 */
async function readBookkeepingFile(): Promise<BookkeepingFile> {
  try {
    const content = await dataFile.text();
    const parsed = JSON.parse(content) as unknown;
    return normalizeBookkeepingFile(parsed);
  } catch (error) {
    console.error("❌ Error reading data:", error);
    return DEFAULT_FILE;
  }
}

/**
 * 将记账数据写入文件
 */
async function writeBookkeepingFile(file: BookkeepingFile): Promise<void> {
  try {
    const transactionsByMonth = file.transactionsByMonth ?? {};
    const normalized: BookkeepingFile = {
      version: 2,
      transactionsByMonth,
      balances:
        file.balances !== undefined
          ? normalizeBalancesForWrite(file.balances)
          : computeBalances(transactionsByMonth),
    };
    await dataFile.write(JSON.stringify(normalized, null, 2));
    notifyDataChange();
  } catch (error) {
    console.error("❌ Error writing data:", error);
    throw error;
  }
}

/**
 * 获取所有币种的余额
 * @returns 各币种的余额对象
 */
export async function getBalances(): Promise<BalancesByCurrency> {
  const file = await readBookkeepingFile();
  return file.balances;
}

/**
 * 获取指定币种的余额
 * @param currencyCode 币种代码
 * @returns 该币种的余额
 */
export async function getBalance(currencyCode: string): Promise<number> {
  const file = await readBookkeepingFile();
  const code = currencyCode.toUpperCase();
  return file.balances[code] ?? 0;
}

/**
 * 设置指定币种的余额
 * @param currencyCode 币种代码
 * @param nextBalance 新的余额值
 */
export async function setBalance(
  currencyCode: string,
  nextBalance: number,
): Promise<void> {
  const code = currencyCode.toUpperCase();
  if (!getCurrencyByCode(code)) {
    throw new Error(`Unsupported currency code '${currencyCode}'`);
  }
  if (!Number.isFinite(nextBalance)) {
    throw new Error("Balance must be a finite number");
  }

  const file = await readBookkeepingFile();
  file.balances[code] = nextBalance;
  await writeBookkeepingFile(file);
}

