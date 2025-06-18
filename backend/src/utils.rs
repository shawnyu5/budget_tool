/// Calculated the percentage of a total number
///
/// * `total`: the total number
/// * `percentage`: the percentage of the `total` to calculate
pub fn calculate_percentage(total: f64, percentage: f64) -> f64 {
    return total * (percentage / 100.0);
}
