import test, { expect } from "@playwright/test";
import { monthNumberToName } from "~/utils";

const date = new Date();

test("Login page has user name and password field", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  const loginForm = page.locator("#login-form");
  await expect(loginForm).toContainText("Username");
  await expect(loginForm).toContainText("Password");
  await expect(loginForm).toContainText("Login");
});

// // TODO: idk why this test is failing
// test("Can login using login page", async ({ page }) => {
//   await page.goto("http://localhost:3000/login");
//   const userNameField = page.locator("#username");
//   const passwordField = page.locator("#password");

//   await userNameField.fill("shawn");
//   await passwordField.fill("1234");

//   const loginButton = page.locator("button.submit");
//   await loginButton.click();
//   await page.waitForURL(
//     `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
//   ),
//     await expect(page).toHaveURL(
//       `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
//     );
//   // TODO: need to validate this API request does not fail
// });

test("Can login", async ({ page }) => {
  // setup("authenticate", async ({ page }) => {
  const date = new Date();
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("http://localhost:3000/login");
  const userNameField = page.locator("#username");
  const passwordField = page.locator("#password");

  await userNameField.fill("shawn");
  await passwordField.fill("1234");

  const loginButton = page.locator("button.submit");
  await loginButton.click();

  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL(
    `http://localhost:3000/?year=${date.getFullYear()}&month=${monthNumberToName(date.getMonth() + 1)}`,
  );
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  // await expect(
  //   page.getByRole("button", { name: "View profile and more" }),
  // ).toBeVisible();

  // End of authentication steps.
});
