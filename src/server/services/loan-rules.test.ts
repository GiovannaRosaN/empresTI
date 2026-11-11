import { describe, expect, it } from "vitest";
import {
  calculateDueAt,
  evaluateLoanEligibility,
  isEquipmentEligibleForLoan,
  isLoanOverdue,
  LOAN_LIMIT_MESSAGE,
  LOAN_OVERDUE_MESSAGE,
  MAX_ACTIVE_LOANS,
} from "./loan-rules";

describe("EMP-CA-01/03/04 loan eligibility", () => {
  const now = new Date("2026-03-26T12:00:00.000Z");
  const futureDueDate = new Date("2099-01-01T03:00:00.000Z");
  const pastDueDate = new Date("2020-01-01T03:00:00.000Z");

  it("[EMP-CA-01] allows a request below the three-loan limit when nothing is overdue", () => {
    expect(evaluateLoanEligibility([futureDueDate, futureDueDate], now)).toEqual({
      activeCount: 2,
      maxActiveLoans: 3,
      hasOverdueLoans: false,
      canRequest: true,
      messages: [],
    });
  });

  it("[EMP-CA-03] blocks at three active loans and returns the specific limit message", () => {
    const eligibility = evaluateLoanEligibility(
      [futureDueDate, futureDueDate, futureDueDate],
      now,
    );

    expect(eligibility.maxActiveLoans).toBe(MAX_ACTIVE_LOANS);
    expect(eligibility.canRequest).toBe(false);
    expect(eligibility.messages).toEqual([LOAN_LIMIT_MESSAGE]);
  });

  it("[EMP-CA-03] continues to block above the three-loan limit", () => {
    const eligibility = evaluateLoanEligibility(
      [futureDueDate, futureDueDate, futureDueDate, futureDueDate],
      now,
    );

    expect(eligibility.canRequest).toBe(false);
    expect(eligibility.messages).toEqual([LOAN_LIMIT_MESSAGE]);
  });

  it("[EMP-CA-04] blocks an overdue loan and returns the specific overdue message", () => {
    const eligibility = evaluateLoanEligibility([pastDueDate], now);

    expect(eligibility.canRequest).toBe(false);
    expect(eligibility.messages).toEqual([LOAN_OVERDUE_MESSAGE]);
  });

  it("[EMP-CA-04] returns both messages when the limit and overdue conditions apply", () => {
    const eligibility = evaluateLoanEligibility(
      [pastDueDate, futureDueDate, futureDueDate],
      now,
    );

    expect(eligibility.canRequest).toBe(false);
    expect(eligibility.messages).toEqual([LOAN_LIMIT_MESSAGE, LOAN_OVERDUE_MESSAGE]);
  });
});

describe("calculateDueAt", () => {
  it("[EMP-CA-05] counts fourteen weekdays from the next business day after confirmation", () => {
    const confirmedAt = new Date("2026-03-06T15:00:00.000Z");
    const dueAt = calculateDueAt(confirmedAt);

    expect(dueAt.toISOString()).toBe("2026-03-27T02:59:59.999Z");
  });

  it("[EMP-CA-05] starts on Monday when confirmation happens on Friday and does not skip holidays", () => {
    const confirmedAt = new Date("2026-04-17T15:00:00.000Z");
    const dueAt = calculateDueAt(confirmedAt);

    expect(dueAt.toISOString()).toBe("2026-05-08T02:59:59.999Z");
  });

  it("[EMP-CA-05] calculates the due date across a year boundary", () => {
    const confirmedAt = new Date("2026-12-24T15:00:00.000Z");
    const dueAt = calculateDueAt(confirmedAt);

    expect(dueAt.toISOString()).toBe("2027-01-14T02:59:59.999Z");
  });

  it("[EMP-CA-05] uses the confirmation's Sao Paulo calendar date", () => {
    const confirmedAt = new Date("2026-03-07T02:30:00.000Z");
    const dueAt = calculateDueAt(confirmedAt);

    expect(dueAt.toISOString()).toBe("2026-03-27T02:59:59.999Z");
  });
});

describe("isLoanOverdue", () => {
  const dueAt = new Date("2026-03-27T02:59:59.999Z");

  it("[EMP-CA-05] keeps the loan on time through the last millisecond of the due date", () => {
    expect(isLoanOverdue(dueAt, dueAt)).toBe(false);
  });

  describe("EMP-CA-02 equipment request availability", () => {
    it("[EMP-CA-02] refuses equipment that is already loaned", () => {
      expect(isEquipmentEligibleForLoan("AVAILABLE", true)).toBe(false);
    });

    it("[EMP-CA-02] refuses equipment in maintenance or out of service", () => {
      expect(isEquipmentEligibleForLoan("MAINTENANCE", false)).toBe(false);
      expect(isEquipmentEligibleForLoan("OUT_OF_SERVICE", false)).toBe(false);
    });

    it("[EMP-CA-01] allows an available item without an open loan", () => {
      expect(isEquipmentEligibleForLoan("AVAILABLE", false)).toBe(true);
    });
  });

  it("[EMP-CA-05] marks the loan overdue at midnight in Sao Paulo on the following day", () => {
    expect(isLoanOverdue(dueAt, new Date("2026-03-27T03:00:00.000Z"))).toBe(true);
  });
});
