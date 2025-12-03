import SwiftUI

/// Date picker that is supposed to be in the tool bar
struct DatePickerToolBarModifier: ViewModifier {
    @Binding var year: Int32
    @Binding var month: Month
    private var currentYear: Int32 {
        return Int32(Calendar.current.component(.year, from: Date()))
    }

    func body(content: Content) -> some View {
        content.toolbar {
            Picker("Year", selection: $year) {
                ForEach([self.currentYear - 1, self.currentYear, self.currentYear + 1], id: \.self) { option in
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
