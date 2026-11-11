const BUSINESS_TIME_ZONE = "America/Sao_Paulo";
const BUSINESS_DAYS_FOR_LOAN = 14;
export const MAX_ACTIVE_LOANS = 3;
export const LOAN_LIMIT_MESSAGE = "Você atingiu o limite de 3 empréstimos ativos. Devolva um item antes de solicitar outro.";
export const LOAN_OVERDUE_MESSAGE = "Você possui empréstimos em atraso. Regularize as devoluções antes de solicitar outro equipamento.";

export type LoanEligibility = {
  activeCount: number;
  maxActiveLoans: number;
  hasOverdueLoans: boolean;
  canRequest: boolean;
  messages: string[];
};

const zonedDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date): DateParts {
  const parts = zonedDateFormatter.formatToParts(date);
  const values = new Map(parts.map(({ type, value }) => [type, Number(value)]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");
  const hour = values.get("hour");
  const minute = values.get("minute");
  const second = values.get("second");

  if ([year, month, day, hour, minute, second].some((value) => value === undefined)) {
    throw new Error("Unable to calculate the loan date in America/Sao_Paulo.");
  }

  return {
    year: year!,
    month: month!,
    day: day!,
    hour: hour!,
    minute: minute!,
    second: second!,
  };
}

function getOffsetMilliseconds(date: Date) {
  const parts = getZonedParts(date);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds(),
  );
  return localAsUtc - date.getTime();
}

function getEndOfBusinessDate(year: number, month: number, day: number) {
  const targetLocalAsUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  let timestamp = targetLocalAsUtc;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    timestamp = targetLocalAsUtc - getOffsetMilliseconds(new Date(timestamp));
  }

  return new Date(timestamp);
}

export function calculateDueAt(confirmedAt: Date): Date {
  if (Number.isNaN(confirmedAt.getTime())) {
    throw new Error("The loan confirmation date is invalid.");
  }

  const confirmation = getZonedParts(confirmedAt);
  const dueCalendarDate = new Date(Date.UTC(confirmation.year, confirmation.month - 1, confirmation.day));
  let countedBusinessDays = 0;

  while (countedBusinessDays < BUSINESS_DAYS_FOR_LOAN) {
    dueCalendarDate.setUTCDate(dueCalendarDate.getUTCDate() + 1);
    const weekday = dueCalendarDate.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      countedBusinessDays += 1;
    }
  }

  return getEndOfBusinessDate(
    dueCalendarDate.getUTCFullYear(),
    dueCalendarDate.getUTCMonth() + 1,
    dueCalendarDate.getUTCDate(),
  );
}

export function isLoanOverdue(dueAt: Date, now: Date): boolean {
  if (Number.isNaN(dueAt.getTime()) || Number.isNaN(now.getTime())) {
    throw new Error("Loan dates must be valid.");
  }

  return now.getTime() > dueAt.getTime();
}

export function evaluateLoanEligibility(dueDates: readonly Date[], now: Date): LoanEligibility {
  if (Number.isNaN(now.getTime())) {
    throw new Error("Loan dates must be valid.");
  }

  const hasOverdueLoans = dueDates.some((dueDate) => isLoanOverdue(dueDate, now));
  const messages = [
    ...(dueDates.length >= MAX_ACTIVE_LOANS ? [LOAN_LIMIT_MESSAGE] : []),
    ...(hasOverdueLoans ? [LOAN_OVERDUE_MESSAGE] : []),
  ];

  return {
    activeCount: dueDates.length,
    maxActiveLoans: MAX_ACTIVE_LOANS,
    hasOverdueLoans,
    canRequest: messages.length === 0,
    messages,
  };
}

export function isEquipmentEligibleForLoan(conditionStatus: string, hasOpenLoan: boolean): boolean {
  const isOperationallyAvailable = ["AVAILABLE", "GOOD", "EXCELLENT"].includes(conditionStatus);
  return isOperationallyAvailable && !hasOpenLoan;
}

export function countElapsedBusinessDays(start: Date, now: Date): number {
  if (Number.isNaN(start.getTime()) || Number.isNaN(now.getTime())) {
    throw new Error("Loan dates must be valid.");
  }

  const startParts = getZonedParts(start);
  const nowParts = getZonedParts(now);
  const date = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day));
  const end = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  let elapsedBusinessDays = 0;

  while (date.getTime() < end) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      elapsedBusinessDays += 1;
    }
  }

  return Math.min(elapsedBusinessDays, BUSINESS_DAYS_FOR_LOAN);
}

export function formatBusinessDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BUSINESS_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
