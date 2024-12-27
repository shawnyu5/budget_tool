/**
 * Converts a month in numbers to their word representation
 * @param monthNumber - a numerical month representation
 * @returns the month representation in words
 */
export function monthNumberToName(monthNumber: number) {
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
