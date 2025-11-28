import SwiftUI

/// Calculates `total` is the `percentage` of what number
func calculatePercentageOf(
    total: Double,
    percentage: Double
) -> Double {
    let result = total * (percentage / 100.0)
    return round(result)
}
