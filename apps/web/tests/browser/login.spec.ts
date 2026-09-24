import { expect, test } from "@playwright/test";

test("validates credentials and submits the sign-in journey", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Enter your password")).toBeVisible();

  const loginRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/v1/auth/login"),
  );
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "browser-user",
          email: "engineer@example.test",
          fullName: "Browser Engineer",
          permissions: [],
          roles: [],
        },
      }),
    });
  });

  await page.getByLabel("Work email").fill("engineer@example.test");
  await page.getByLabel("Password").fill("valid-password");
  await page.getByRole("button", { name: "Enter workspace" }).click();

  const request = await loginRequest;
  expect(request.postDataJSON()).toEqual({
    email: "engineer@example.test",
    password: "valid-password",
  });
});
