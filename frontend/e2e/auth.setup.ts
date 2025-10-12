import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "/.auth");

setup("authenticate", async ({ page }) => {
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
  await page.waitForURL("http://localhost:3000");
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  // await expect(
  //   page.getByRole("button", { name: "View profile and more" }),
  // ).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
