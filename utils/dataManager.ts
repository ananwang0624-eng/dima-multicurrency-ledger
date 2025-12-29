import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

const DATA_FILE_NAME = "bookkeeping_data.json";
const dataFile = new File(Paths.document, DATA_FILE_NAME);

export type TransactionRecord = {
  uuid: string;
  amount: number;
  currency: string;
  category: number;
  date: string;
  description?: string;
  type: "income" | "expense";
};

/**
 * Data structure grouped by year-month (YYYY-MM).
 * Example: { "2025-12": [...], "2025-11": [...] }
 */
export type BookkeepingData = Record<string, TransactionRecord[]>;

const DEFAULT_DATA: BookkeepingData = {};

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
