import SwiftUI

/// Date picker that is supposed to be in the tool bar
struct DatePickerToolBarModifier: ViewModifier {
    @Binding var year: Int32
    @Binding var month: Month

    func body(content: Content) -> some View {
        content.toolbar {
            Picker("Year", selection: $year) {
                ForEach([year - 1, year, year + 1], id: \.self) { option in
                    Text(String(option))
                }
            }

            Picker("Month", selection: $month) {
                ForEach(Month.allCases, id: \.self) { month in
                    Text(month.rawValue).tag(month)
                }
            }
        }
    }
}
