import test, { expect } from "@playwright/test";
import { monthNumberToName } from "~/utils";

// test.beforeAll(() => {
//   // worker.start();
//   // server.listen();
// });

// test.afterAll(() => {
//   // worker.stop();
//   // server.close();
// });

test("Login page has user name and password field", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  const loginForm = page.locator("#login-form");
  await expect(loginForm).toContainText("Username");
  await expect(loginForm).toContainText("Password");
  await expect(loginForm).toContainText("Login");
});

test("Can login using login page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  const userNameField = page.locator("#username");
  const passwordField = page.locator("#password");

  await userNameField.fill("test");
  await passwordField.fill("test");

  const loginButton = page.locator("button.submit");
  await loginButton.click();
  const date = new Date();

  await expect(page).toHaveURL(
    `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
  );
});
