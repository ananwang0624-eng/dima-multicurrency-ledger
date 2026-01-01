import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

import { getCurrencyByCode } from "@/data/currencies";
import type { IconTilePickerValue } from "@/data/iconTileItems";

const DATA_FILE_NAME = "bookkeeping_data.json";
const dataFile = new File(Paths.document, DATA_FILE_NAME);

export type TransactionRecord = {
  uuid: string;
  amount: number;
  currency: string;
  category: IconTilePickerValue;
  date: string;
  description?: string;
  type: "income" | "expense";
};

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

const DEFAULT_DATA: BookkeepingData = {};

const SEEDED_TEST_TRANSACTIONS: TransactionRecord[] = [
  // 3 transactions on 2026-01-01
  {
    uuid: "seed-20260101-001",
    amount: 28.5,
    currency: "CNY",
    category: 0,
    date: "2026-01-01T02:15:00.000Z",
    description: "Seed: Breakfast",
    type: "expense",
  },
  {
    uuid: "seed-20260101-002",
    amount: 199.0,
    currency: "CNY",
    category: 2,
    date: "2026-01-01T09:40:00.000Z",
    description: "Seed: Shopping",
    type: "expense",
  },
  {
    uuid: "seed-20260101-003",
    amount: 1200.0,
    currency: "CNY",
    category: 7,
    date: "2026-01-01T12:00:00.000Z",
    description: "Seed: Bonus",
    type: "income",
  },

  // 7 transactions in 2025-12
  {
    uuid: "seed-202512-001",
    amount: 15.9,
    currency: "CNY",
    category: 0,
    date: "2025-12-03T08:30:00.000Z",
    description: "Seed: Coffee",
    type: "expense",
  },
  {
    uuid: "seed-202512-002",
    amount: 68.0,
    currency: "CNY",
    category: 6,
    date: "2025-12-07T13:10:00.000Z",
    description: "Seed: Daily",
    type: "expense",
  },
  {
    uuid: "seed-202512-003",
    amount: 329.0,
    currency: "CNY",
    category: 3,
    date: "2025-12-11T19:45:00.000Z",
    description: "Seed: Gaming",
    type: "expense",
  },
  {
    uuid: "seed-202512-004",
    amount: 45.0,
    currency: "CNY",
    category: 5,
    date: "2025-12-15T10:05:00.000Z",
    description: "Seed: Education",
    type: "expense",
  },
  {
    uuid: "seed-202512-005",
    amount: 88.8,
    currency: "CNY",
    category: 4,
    date: "2025-12-19T04:20:00.000Z",
    description: "Seed: Health",
    type: "expense",
  },
  {
    uuid: "seed-202512-006",
    amount: 12.0,
    currency: "CNY",
    category: 1,
    date: "2025-12-24T16:00:00.000Z",
    description: "Seed: Transparent",
    type: "expense",
  },
  {
    uuid: "seed-202512-007",
    amount: 520.0,
    currency: "CNY",
    category: 7,
    date: "2025-12-31T23:50:00.000Z",
    description: "Seed: Others",
    type: "expense",
  },
];

/**
 * Clear all bookkeeping records.
 */
export async function clearAllTransactions(): Promise<void> {
  await initializeDataFile();
  await writeData(DEFAULT_DATA);
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

  const data = await readData();
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

  await writeData(data);
}

/**
 * Generate a UUID for new transaction records.
 */
export function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * Extract year-month key from ISO date string.
 * @param date ISO date string (e.g., "2025-12-29T10:30:00.000Z")
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
  validateTransactionRecord(record);

  const data = await readData();
  const key = getYearMonthKey(record.date);

  if (!data[key]) {
    data[key] = [];
  }

  data[key].push(record);

  // Sort by date in descending order (newest first)
  data[key].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  await writeData(data);
}

/**
 * Get transactions for a specific year-month.
 * @param yearMonth Year-month key (e.g., "2025-12")
 * @returns Array of transactions for that month
 */
export async function getTransactionsByMonth(
  yearMonth: string
): Promise<TransactionRecord[]> {
  const data = await readData();
  return data[yearMonth] || [];
}

/**
 * Get all available year-month keys.
 * @returns Array of year-month keys sorted in descending order
 */
export async function getAvailableMonths(): Promise<string[]> {
  const data = await readData();
  return Object.keys(data).sort().reverse();
}

/**
 * Initialize the data file on app startup.
 * Creates the file with default data if it doesn't exist.
 */
export async function initializeDataFile(): Promise<void> {
  try {
    if (!dataFile.exists) {
      await dataFile.write(JSON.stringify(DEFAULT_DATA, null, 2));
      console.log("✅ Data file created:", dataFile.uri);
    } else {
      console.log("✅ Data file already exists:", dataFile.uri);
    }
  } catch (error) {
    console.error("❌ Error initializing data file:", error);
    throw error;
  }
}

/**
 * Read bookkeeping data from the file.
 */
export async function readData(): Promise<BookkeepingData> {
  try {
    const content = await dataFile.text();
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Error reading data:", error);
    return DEFAULT_DATA;
  }
}

/**
 * Write bookkeeping data to the file.
 */
export async function writeData(data: BookkeepingData): Promise<void> {
  try {
    await dataFile.write(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error writing data:", error);
    throw error;
  }
}

/**
 * Get the full path to the data file (useful for debugging).
 */
export function getDataFilePath(): string {
  return dataFile.uri;
}
