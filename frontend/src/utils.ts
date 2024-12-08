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
