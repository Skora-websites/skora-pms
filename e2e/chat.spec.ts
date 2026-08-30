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
    // The message <p> has a sibling actions div with class `group-hover:opacity-100`.
    // Use `force: true` on click since the button is CSS-opacity-hidden.
    const messageRow = page.locator("div.group", { has: page.locator("p", { hasText: messageContent }) }).first();
    await messageRow.hover();
    const favButton = messageRow.getByTitle("Favorite");
    await expect(favButton).toBeAttached({ timeout: 10_000 });
    await favButton.click({ force: true });

    // After favoriting, the button title becomes "Unfavorite" (polled every 5s + refresh).
    await expect(messageRow.getByTitle("Unfavorite")).toBeAttached({ timeout: 15_000 });

    // ── Delete the message ──────────────────────────────────────────────────
    // Only own messages have a Delete button.
    await messageRow.hover();
    const deleteButton = messageRow.getByTitle("Delete");
    await expect(deleteButton).toBeAttached({ timeout: 5_000 });
    await deleteButton.click({ force: true });

    // Message should be removed from the list.
    await expect(messageEl).toHaveCount(0, { timeout: 15_000 });
  });
});