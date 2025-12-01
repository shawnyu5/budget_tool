import Foundation
import SwiftUI

/// Calculates `total` is the `percentage` of what number
func calculatePercentageOf(
    total: Double,
    percentage: Double
) -> Double {
    let result = total * (percentage / 100.0)
    return result
}

/// Convert a string to date
/// - Parameter string: A string presenting a date in the format `yyyy/mm/dd`
/// - Returns: a date object if date is in that format. Otherwise returns nil
func strToDate(string: String) -> Date? {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy/M/d" // matches "2025/4/1"
    formatter.locale = Locale(identifier: "en_US_POSIX") // recommended for fixed formats
    return formatter.date(from: string)
}

/// Converts a date object to `yyyy/mm/dd` format
func dateToStr(date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy/M/d" // matches "2025/4/1"
    formatter.locale = Locale(identifier: "en_US_POSIX") // recommended for fixed formats
    return formatter.string(from: date)
}

/// Rounds a double to 2 decimal places
/// - Parameter decimal: any double value
/// - Returns: a string, with 2 decimal points
func roundTwoDecimalPlaces(decimal: Double) -> String {
    var decimalValue = Decimal(decimal)
    var roundedValue = Decimal()
    NSDecimalRound(&roundedValue, &decimalValue, 2, .plain)
    return String(format: "%.2f", (roundedValue as NSDecimalNumber).doubleValue)
}
