import SwiftUI

/// Adds a modifier in the toolbar to dismiss the keyboard
struct KeyboardDismissModifier: ViewModifier {
    @FocusState private var isFocused: Bool

    func body(content: Content) -> some View {
        content
            .focused($isFocused)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") {
                        isFocused = false
                    }
                }
            }
            .onTapGesture {
                isFocused = false
            }
    }
}

extension View {
    /// Apply this to any field to add:
    /// - Tap outside to dismiss
    /// - “Done” button for numberPad/decimalPad
    func dismissibleKeyboard() -> some View {
        modifier(KeyboardDismissModifier())
    }
}
