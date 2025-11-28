import SwiftUI

struct LoginView: View {
    @Environment(AuthManager.self) private var auth: AuthManager
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var isSecure: Bool = true
    @State private var navigationPath = NavigationPath()

    var showAlert: Binding<Bool> {
        Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        )
    }

    @State private var alertMessage: String? = nil
    var viewModel = LoginviewModel()

    var body: some View {
        NavigationStack(path: $navigationPath) {
            VStack(spacing: 20) {
                // Title
                Text("Login")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                TextField("Username", text: $username)
                #if os(iOS)
                    .keyboardType(.emailAddress)
                #endif
                    .autocapitalization(.none)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(8)

                // Password field
                if isSecure {
                    SecureField("Password", text: $password)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(8)
                } else {
                    TextField("Password", text: $password)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(8)
                }

                // Toggle password visibility
                Button(action: { isSecure.toggle() }) {
                    Text(isSecure ? "Show Password" : "Hide Password")
                        .font(.caption)
                        .foregroundColor(.blue)
                }

                // Login button
                Button(action: {
                    // Handle login action
                    if username.isEmpty || password.isEmpty {
                        alertMessage = "Missing username / password"
                    } else {
                        print("Logging in with \(username) / \(password)")
                        Task {
                            switch await viewModel.login(username: username, password: password) {
                            case let .success(token):
                                print("success!")
                                auth.saveToken(token)

                            case let .failure(error):
                                print("Failed to login")
                                switch error {
                                case let .HttpError(err):
                                    self.alertMessage = "Something went wrong... \(err)"
                                case .Unauthorized:
                                    self.alertMessage = "Unauthorized"
                                case .InternalServerError:
                                    self.alertMessage = "Something went wrong... Please try again later"
                                case let .Unknown(statusCode, desc):
                                    self.alertMessage = "Failed with status code: \(statusCode), \(desc)"
                                }
                            }
                        }
                    }
                }) {
                    if viewModel.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(8)

                    } else {
                        Text("Login")
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(8)
                    }
                }
                .alert(isPresented: showAlert) {
                    Alert(title: Text("Error"), message: Text(alertMessage ?? ""), dismissButton: .default(Text("OK")))
                }

                Spacer()
            }
            .padding()
        }
    }
}

#Preview {
    LoginView().environment(AuthManager())
}
