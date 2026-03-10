import Decimal from "decimal.js";

/**
 * Converts a month in numbers to their word representation
 * @param monthNumber - a numerical month representation
 * @returns the month representation in words
 */
export function monthNumberToName(monthNumber: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return months[monthNumber - 1] || "Invalid month";
}

/**
 * Get the JWT token stored locally
 */
export function getLocalAuthToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Store the JWT token locally
 * @param token - the JWT token to store
 */
export function setLocalAuthToken(token: string) {
  localStorage.setItem("token", token);
}

/**
 * Generate an ID for a spending item
 * @returns a unique ID for a spending item
 * @deprecated use crypto.randomUUID()
 */
export function generateSpendingItemID(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${year}${month}${day}${hour}${minute}${second}`;
}

/**
 * Calculate the percentage of a number
 * @param total - the total amount
 * @param percentage - percentage of the total
 * @returns the `percentage` of the `total`
 */
export function calculatePercentage(
  total: Decimal,
  percentage: Decimal,
): Decimal {
  // const result = total * (percentage / 100);
  const result = total.mul(percentage).div(100);
  return result;
}

/**
 * Calculates `number` is the `percentage` of what number
 * @returns the total value `number` is a `percentage` of
 */
export function calculatePercentageOf(
  number: Decimal,
  percentage: Decimal,
): Decimal {
  // let result = number / (percentage / 100.0);
  const result = number.times(100).dividedBy(percentage);
  return result;
}

/**
 * Calculate the other person's contribution $
 * @param myContribution - amount $ I am contributing
 * @param myPercentage - % I am contributing
 * @param theirPercentage - % they are contributing
 * @returns contribution $ amount of the other person
 */
export function calculateOtherContribution(
  myContribution: Decimal,
  myPercentage: Decimal,
  theirPercentage: Decimal,
): Decimal {
  // Logic: (450 * 60) / 40 = 675
  return myContribution.times(theirPercentage).dividedBy(myPercentage);
}

/**
 * Rounds `n` to 2 decimal places
 */
export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Convert array buffer to base64
 * @param buffer - an ArrayBuffer
 * @returns base64 encoded `buffer`
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Format a RFC 3339 date string
 * @param date: RFC3339 date format
 */
export function formatRfc3339Date(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth()}/${d.getDay()}`;
}

export function formatRfc3339DateObj(date: Date): string {
  // Cuz JS month is 0 indexed need to +1 to get human readable month
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
