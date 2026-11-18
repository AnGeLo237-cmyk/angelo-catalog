import { test } from "@playwright/test"
import { SHOP } from "./fixtures"

test("warm up pages", async ({ page }) => {
  await page.goto(`/${SHOP.slug}`, { timeout: 60_000 })
})