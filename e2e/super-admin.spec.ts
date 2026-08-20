import { expect, test } from "@playwright/test";
import { unique } from "./helpers";

test.describe.configure({ mode: "serial" });
test.use({ storageState: "e2e/.auth/admin.json" });

test("super-admin: user CRUD + status toggle", async ({ page }) => {
  await page.goto("/super-admin/users");

  const name = unique("QA User");
  const email = `${unique("qa")}@example.com`;

  await page.getByRole("button", { name: "New user" }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Password/).fill("Admin@123");
  await page.getByLabel("Role").selectOption("patient");
  await page.getByRole("button", { name: "Create user" }).click();

  const row = page.locator("tr", { hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText(email);

  await page.getByRole("button", { name: `Deactivate ${name}` }).click();
  await expect(row.getByText("inactive", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Activate ${name}` }).click();
  await expect(row.getByText("active", { exact: true })).toBeVisible();

  const renamed = name + " renamed";
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByLabel("Full name").fill(renamed);
  await page.getByRole("button", { name: "Save user" }).click();
  await expect(page.locator("tr", { hasText: renamed })).toBeVisible();
});

test("super-admin: master data CRUD (medicines)", async ({ page }) => {
  await page.goto("/super-admin/masters");

  const name = unique("Med");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Strength").fill("500");
  await page.getByRole("button", { name: "Add record" }).click();

  const row = page.locator("tr", { hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText("500");

  const renamed = name + "x";
  await page.getByRole("button", { name: `Edit ${name}` }).click();
  await page.getByLabel("Name").fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("tr", { hasText: renamed })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${renamed}` }).click();
  await page.getByRole("button", { name: `Confirm delete ${renamed}` }).click();
  await expect(page.locator("tr", { hasText: renamed })).toHaveCount(0);
});

test("super-admin: clinic CRUD", async ({ page }) => {
  await page.goto("/super-admin/clinics");

  const clinicName = unique("QA Clinic");
  await page.getByRole("button", { name: "New clinic" }).click();
  const doctorSelect = page.getByLabel("Owning doctor");
  const doctorValue = await doctorSelect
    .locator("option:not([value=''])")
    .first()
    .getAttribute("value");
  expect(doctorValue).toBeTruthy();
  await doctorSelect.selectOption(doctorValue!);
  await page.getByLabel("Clinic name").fill(clinicName);
  await page.getByLabel("Phone").fill("9876500001");
  await page.getByLabel("Consultation fee (₹)").fill("500");
  await page.getByLabel("Address").fill("1 QA Street, Test City");
  await page.getByRole("button", { name: "Create clinic" }).click();

  const card = page.locator(".card", { hasText: clinicName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("500.00");

  await card.getByRole("button", { name: "Delete" }).click();
  await card.getByRole("button", { name: "Click again to confirm" }).click();
  await expect(page.locator(".card", { hasText: clinicName })).toHaveCount(0);
});

test("super-admin: sync doctor permissions", async ({ page }) => {
  await page.goto("/super-admin/doctors");
  await page.getByPlaceholder(/Search by name/).fill("doctor@gmail.com");
  await page.getByRole("button", { name: "Search" }).click();

  const card = page.locator(".card", { hasText: "doctor@gmail.com" }).first();
  await card.getByRole("button", { name: "Permissions" }).click();

  const scheduleCheckbox = page.getByRole("checkbox", { name: "schedule" });
  await expect(scheduleCheckbox).toBeVisible();
  if (!(await scheduleCheckbox.isChecked())) {
    await scheduleCheckbox.click();
  }
  await page.getByRole("button", { name: "Save permissions" }).click();
  await expect(page.getByText("Permissions saved for", { exact: false })).toBeVisible();
});

test("super-admin: blog + category CRUD", async ({ page }) => {
  await page.goto("/super-admin/blogs");

  const category = unique("Cat");
  await page.getByRole("button", { name: "New category" }).click();
  await page.getByLabel("Category name").fill(category);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("button", { name: `Delete category ${category}` })).toBeVisible();

  const title = unique("QA Blog");
  await page.getByRole("button", { name: "New post" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Category", { exact: true }).selectOption({ label: category });
  await page.getByLabel("Short summary").fill("A short summary for the test.");
  await page.getByLabel("Content").fill("Full body content for the test blog post.");
  await page.getByRole("button", { name: "Create post" }).click();

  const row = page.locator("tr", { hasText: title });
  await expect(row).toBeVisible();
  await expect(row).toContainText(category);

  await page.getByRole("button", { name: `Delete ${title}` }).click();
  await page.getByRole("button", { name: `Confirm delete ${title}` }).click();
  await expect(page.locator("tr", { hasText: title })).toHaveCount(0);

  await page.getByRole("button", { name: `Delete category ${category}` }).click();
  await page.getByRole("button", { name: `Confirm delete category ${category}` }).click();
  await expect(page.getByRole("button", { name: `Delete category ${category}` })).toHaveCount(0);
});