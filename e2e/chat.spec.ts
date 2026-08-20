import { test, expect } from "@playwright/test";
import { unique } from "./helpers";

test.describe("P2.3 Chat", () => {
  test("send a message, favorite it, then delete it", async ({ page }) => {
    const messageContent = unique("E2E Chat message");

    // ── Navigate to chat page ───────────────────────────────────────────────
    await page.goto("/doctor/chat");
    await expect(page.getByRole("heading", { name: /Doctor Group Chat/i }).first()).toBeVisible();

    // ── Send a message ──────────────────────────────────────────────────────
    await page.getByPlaceholder("Type a message…").fill(messageContent);
    await page.getByRole("button", { name: /Send message/i }).click();

    // Wait for the message to appear in the list (polled every 5s).
    const messageEl = page.locator("p", { hasText: messageContent }).first();
    await expect(messageEl).toBeVisible({ timeout: 15_000 });

    // ── Favorite the message ────────────────────────────────────────────────
    // The message is inside a row; hover to reveal the action buttons.
    const messageRow = messageEl.locator("..");
    await messageRow.hover();
    const favButton = messageRow.getByTitle("Favorite");
    await expect(favButton).toBeVisible({ timeout: 5_000 });
    await favButton.click();

    // After favoriting, the button title becomes "Unfavorite".
    await expect(messageRow.getByTitle("Unfavorite")).toBeVisible({ timeout: 5_000 });

    // ── Delete the message ──────────────────────────────────────────────────
    // Only own messages have a Delete button.
    await messageRow.hover();
    const deleteButton = messageRow.getByTitle("Delete");
    await expect(deleteButton).toBeVisible({ timeout: 5_000 });
    await deleteButton.click();

    // Message should be removed from the list.
    await expect(messageEl).toHaveCount(0, { timeout: 15_000 });
  });
});