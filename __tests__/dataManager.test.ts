import {
  __testables as dataManagerTestables,
  getYearMonthKey,
  type TransactionRecord,
} from "@/utils/dataManager";

const {
  computeBalances,
  normalizeBookkeepingFile,
  roundTo2,
  validateTransactionRecord,
} = dataManagerTestables;

describe("dataManager unit tests", () => {
  it("validates a correct record and rejects invalid amount or currency", () => {
    const validRecord: TransactionRecord = {
      uuid: "tx-1",
      amount: 25.5,
      currency: "USD",
      category: 0,
      date: "2025-12-29T10:30:00.000+01:00",
      type: "income",
    };

    expect(() => validateTransactionRecord(validRecord)).not.toThrow();

    expect(() =>
      validateTransactionRecord({ ...validRecord, amount: 0 }),
    ).toThrow("amount must be a positive number");

    expect(() =>
      validateTransactionRecord({ ...validRecord, currency: "ABC" }),
    ).toThrow("unsupported currency code");
  });

  it("computes signed balances correctly for mixed income and expense records", () => {
    const balances = computeBalances({
      "2025-12": [
        {
          uuid: "tx-1",
          amount: 200,
          currency: "USD",
          category: 0,
          date: "2025-12-29T10:30:00.000+01:00",
          type: "income",
        },
        {
          uuid: "tx-2",
          amount: 45.25,
          currency: "USD",
          category: 1,
          date: "2025-12-29T12:30:00.000+01:00",
          type: "expense",
        },
        {
          uuid: "tx-3",
          amount: 80,
          currency: "EUR",
          category: 2,
          date: "2025-12-29T14:30:00.000+01:00",
          type: "income",
        },
      ],
    });

    expect(balances.USD).toBeCloseTo(154.75);
    expect(balances.EUR).toBe(80);
  });

  it("normalizes legacy v1 bookkeeping data into v2 with recomputed balances", () => {
    const legacyData = {
      "2025-12": [
        {
          uuid: "tx-1",
          amount: 100,
          currency: "USD",
          category: 0,
          date: "2025-12-29T10:30:00.000+01:00",
          type: "income",
        },
        {
          uuid: "tx-2",
          amount: 30,
          currency: "USD",
          category: 0,
          date: "2025-12-30T10:30:00.000+01:00",
          type: "expense",
        },
      ],
    };

    const normalized = normalizeBookkeepingFile(legacyData);

    expect(normalized.version).toBe(2);
    expect(normalized.transactionsByMonth["2025-12"]).toHaveLength(2);
    expect(normalized.balances.USD).toBe(70);
  });
});

describe("helper unit tests", () => {
  it("extracts the correct year-month key from an RFC3339 date string", () => {
    expect(getYearMonthKey("2025-12-29T10:30:00.000+01:00")).toBe("2025-12");
  });

  it("rounds numeric helper values to two decimal places", () => {
    expect(roundTo2(12.3456)).toBe(12.35);
    expect(roundTo2(9.994)).toBe(9.99);
  });
});
