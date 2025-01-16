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
export function calculatePercentage(total: number, percentage: number) {
  const result = total * (percentage / 100);
  return Math.round(result * 100) / 100;
}
