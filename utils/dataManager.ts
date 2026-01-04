import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

import { CURRENCIES, getCurrencyByCode } from "@/data/currencies";
import type { IconTilePickerValue } from "@/data/iconTileItems";

const DATA_FILE_NAME = "bookkeeping_data.json";
const dataFile = new File(Paths.document, DATA_FILE_NAME);

type DataChangeListener = () => void;
const dataChangeListeners = new Set<DataChangeListener>();

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
 * Subscribe to bookkeeping data changes.
 * Triggered after the data file is successfully written.
 */
export function subscribeDataChanges(listener: DataChangeListener): () => void {
  dataChangeListeners.add(listener);
  return () => {
    dataChangeListeners.delete(listener);
  };
}

export type TransactionRecord = {
  uuid: string;
  amount: number;
  currency: string;
  category: IconTilePickerValue;
  date: string;
  description?: string;
  type: "income" | "expense";
};

export type BalancesByCurrency = Record<string, number>;

const ISO_8601_RFC_3339_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

function isIso8601Rfc3339DateTime(value: string): boolean {
  if (!ISO_8601_RFC_3339_DATE_TIME.test(value)) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}

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
      `Invalid transaction: unsupported currency code '${record.currency}'`
    );
  }

  if (
    !Number.isInteger(record.category) ||
    record.category < 0 ||
    record.category > 7
  ) {
    throw new Error(
      "Invalid transaction: category must be an integer between 0 and 7"
    );
  }

  if (!record.date || typeof record.date !== "string") {
    throw new Error("Invalid transaction: date is required");
  }
  if (!isIso8601Rfc3339DateTime(record.date)) {
    throw new Error(
      "Invalid transaction: date must be an ISO 8601 / RFC 3339 datetime string"
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
 * Data structure grouped by year-month (YYYY-MM).
 * Example: { "2025-12": [...], "2025-11": [...] }
 */
export type BookkeepingData = Record<string, TransactionRecord[]>;

type BookkeepingFile = {
  version: 2;
  transactionsByMonth: BookkeepingData;
  balances: BalancesByCurrency;
};

function createDefaultBalances(): BalancesByCurrency {
  return Object.fromEntries(CURRENCIES.map((c) => [c.code, 0] as const));
}

function normalizeBalancesForWrite(
  balances: BalancesByCurrency | undefined
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

function computeBalances(
  transactionsByMonth: BookkeepingData
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
    const balancesRaw = record.balances;

    const transactionsByMonth: BookkeepingData =
      transactionsByMonthRaw && typeof transactionsByMonthRaw === "object"
        ? (transactionsByMonthRaw as BookkeepingData)
        : {};

    const computed = computeBalances(transactionsByMonth);

    const balances: BalancesByCurrency =
      balancesRaw && typeof balancesRaw === "object"
        ? ({
            ...computed,
            ...(balancesRaw as BalancesByCurrency),
          } as BalancesByCurrency)
        : computed;

    // Sanitize numeric values.
    for (const [code, val] of Object.entries(balances)) {
      balances[code] = Number.isFinite(val) ? Number(val) : 0;
    }

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
  normalized: BookkeepingFile
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

const SEEDED_TEST_TRANSACTIONS: TransactionRecord[] = [
  // 3 transactions on 2026-01-01
  {
    uuid: "seed-20260101-001",
    amount: 28.5,
    currency: "CNY",
    category: 0,
    date: "2026-01-01T02:15:00.000+01:00",
    description: "Seed: Breakfast",
    type: "expense",
  },
  {
    uuid: "seed-20260101-002",
    amount: 199.0,
    currency: "CNY",
    category: 2,
    date: "2026-01-01T09:40:00.000+01:00",
    description: "Seed: Shopping",
    type: "expense",
  },
  {
    uuid: "seed-20260101-003",
    amount: 1200.0,
    currency: "CNY",
    category: 7,
    date: "2026-01-01T12:00:00.000+01:00",
    description: "Seed: Bonus",
    type: "income",
  },

  // 7 transactions in 2025-12
  {
    uuid: "seed-202512-001",
    amount: 15.9,
    currency: "CNY",
    category: 0,
    date: "2025-12-03T08:30:00.000+01:00",
    description: "Seed: Coffee",
    type: "expense",
  },
  {
    uuid: "seed-202512-002",
    amount: 68.0,
    currency: "CNY",
    category: 6,
    date: "2025-12-07T13:10:00.000+01:00",
    description: "Seed: Daily",
    type: "expense",
  },
  {
    uuid: "seed-202512-003",
    amount: 329.0,
    currency: "CNY",
    category: 3,
    date: "2025-12-11T19:45:00.000+01:00",
    description: "Seed: Gaming",
    type: "expense",
  },
  {
    uuid: "seed-202512-004",
    amount: 45.0,
    currency: "CNY",
    category: 5,
    date: "2025-12-15T10:05:00.000+01:00",
    description: "Seed: Education",
    type: "expense",
  },
  {
    uuid: "seed-202512-005",
    amount: 88.8,
    currency: "CNY",
    category: 4,
    date: "2025-12-19T04:20:00.000+01:00",
    description: "Seed: Health",
    type: "expense",
  },
  {
    uuid: "seed-202512-006",
    amount: 12.0,
    currency: "CNY",
    category: 1,
    date: "2025-12-24T16:00:00.000+01:00",
    description: "Seed: Transparent",
    type: "expense",
  },
  {
    uuid: "seed-202512-007",
    amount: 520.0,
    currency: "CNY",
    category: 7,
    date: "2025-12-31T23:50:00.000+01:00",
    description: "Seed: Others",
    type: "expense",
  },
];

/**
 * Clear all bookkeeping records.
 */
export async function clearAllTransactions(): Promise<void> {
  await initializeDataFile();
  await writeBookkeepingFile(DEFAULT_FILE);
}

/**
 * Seed deterministic test transactions for manual testing.
 * - 3 records on 2026-01-01
 * - 7 records in 2025-12
 * Idempotent: re-seeding won't create duplicates (same UUIDs are replaced).
 */
export async function seedDeterministicTestTransactions(): Promise<void> {
  await initializeDataFile();

  // Validate seed data so we fail fast if currencies/categories/dates change.
  for (const record of SEEDED_TEST_TRANSACTIONS) {
    validateTransactionRecord(record);
  }

  const file = await readBookkeepingFile();
  const data = file.transactionsByMonth;
  const seededUuids = new Set(SEEDED_TEST_TRANSACTIONS.map((t) => t.uuid));

  for (const key of Object.keys(data)) {
    data[key] = (data[key] || []).filter((t) => !seededUuids.has(t.uuid));
  }

  for (const record of SEEDED_TEST_TRANSACTIONS) {
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
 * Generate a UUID for new transaction records.
 */
export function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * Extract year-month key from ISO date string.
 * @param date ISO date string (e.g., "2025-12-29T10:30:00.000+01:00")
 * @returns Year-month key (e.g., "2025-12")
 */
export function getYearMonthKey(date: string): string {
  return date.substring(0, 7); // "YYYY-MM"
}

/**
 * Add a transaction record to the data.
 * Automatically groups by year-month and sorts by date (descending).
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
 * Get transactions for a specific year-month.
 * @param yearMonth Year-month key (e.g., "2025-12")
 * @returns Array of transactions for that month
 */
export async function getTransactionsByMonth(
  yearMonth: string
): Promise<TransactionRecord[]> {
  const file = await readBookkeepingFile();
  return file.transactionsByMonth[yearMonth] || [];
}

/**
 * Get all available year-month keys.
 * @returns Array of year-month keys sorted in descending order
 */
export async function getAvailableMonths(): Promise<string[]> {
  const file = await readBookkeepingFile();
  return Object.keys(file.transactionsByMonth).sort().reverse();
}

/**
 * Initialize the data file on app startup.
 * Creates the file with default data if it doesn't exist.
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
 * Read bookkeeping data from the file.
 */
export async function readData(): Promise<BookkeepingData> {
  const file = await readBookkeepingFile();
  return file.transactionsByMonth;
}

/**
 * Write bookkeeping data to the file.
 */
export async function writeData(data: BookkeepingData): Promise<void> {
  await writeBookkeepingFile({
    version: 2,
    transactionsByMonth: data,
    balances: computeBalances(data),
  });
}

export async function getBalances(): Promise<BalancesByCurrency> {
  const file = await readBookkeepingFile();
  return file.balances;
}

export async function getBalance(currencyCode: string): Promise<number> {
  const file = await readBookkeepingFile();
  const code = currencyCode.toUpperCase();
  return file.balances[code] ?? 0;
}

export async function setBalance(
  currencyCode: string,
  nextBalance: number
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

/**
 * Get the full path to the data file (useful for debugging).
 */
export function getDataFilePath(): string {
  return dataFile.uri;
}
