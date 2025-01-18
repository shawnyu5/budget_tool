/// Calculated the percentage of a total number
///
/// * `total`: the total number
/// * `percentage`: the percentage of the `total` to calculate
pub fn calculate_percentage(total: f64, percentage: f64) -> f64 {
    return total * (percentage / 100.0);
}

/// Calculates `number` is what `percentage` of. Returns the total number `number` is a percentage of
pub fn calculate_percentage_of(number: f64, percentage: f64) -> f64 {
    let result = number / (percentage / 100.0);
    return (result * 100.0).round() / 100.0;
}
