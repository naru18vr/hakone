import { expect, test } from "@playwright/test";

test("8月13日への追加、順番変更、再読み込み、初期化", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();
  const wetland = page.getByRole("button", { name: /箱根湿生花園/ });
  await expect(wetland).toHaveCount(1);
  await wetland.click();
  const addPanel = page.locator(".add-destination");
  await addPanel.getByRole("button", { name: "8月13日" }).click();
  await page.getByRole("button", { name: "8月13日へ追加" }).click();
  await expect(page.getByRole("status")).toContainText("箱根湿生花園を8月13日に追加しました");
  await page.getByRole("tab", { name: /8\/13 2日目/ }).click();
  await page.getByRole("button", { name: "上へ" }).last().click();
  await expect(page.locator(".route-explanation")).toContainText(/再計算|道路ルート|簡易推計/);
  await page.reload();
  await expect(page.getByText("保存した旅程を復元しました")).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /初期化/ }).click();
  await expect(page.getByRole("status")).toContainText("初期サンプルプランに戻しました");
});
