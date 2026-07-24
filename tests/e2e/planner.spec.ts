import { expect, test } from "@playwright/test";

test("夕食条件、影響プレビュー、追加・削除、復元を確認する", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();

  const dinner = page.locator('input[type="time"]').last();
  await dinner.fill("18:30");
  const wetland = page.getByRole("button", { name: /箱根湿生花園/ });
  await expect(wetland).toHaveCount(1);
  await wetland.click();
  const add = page.getByRole("button", { name: "旅程へ追加" });
  await expect(add).toHaveCount(1);
  await add.click();
  const dialog = page.locator(".add-dialog");
  await expect(dialog).toContainText("どの日に追加しますか？");
  await dialog.getByRole("button", { name: "8月13日" }).click();
  await expect(dialog).toContainText("おすすめ位置");
  await expect(dialog).toContainText("東京駅着");
  await dialog.getByRole("button", { name: "この位置に追加" }).click();
  await expect(page.getByRole("status")).toContainText("箱根湿生花園を8月13日に追加しました");
  await expect(page.locator(".return-card")).toContainText("東京駅着");

  const remove = page.getByRole("button", { name: "最後の観光地を外す" });
  if (await remove.count() === 1) await remove.click();
  await page.reload();
  await expect(page.getByText("保存した旅程を復元しました")).toBeVisible();
});

test("共有URLを作成し、共有旅程の確認画面を表示する", async ({ page, context }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();
  await page.getByRole("button", { name: "共有" }).click();
  const dialog = page.locator(".share-dialog");
  await dialog.getByRole("button", { name: "共有URLを作成" }).click();
  const textArea = dialog.locator("textarea");
  await expect(textArea).toHaveValue(/plan=/);
  const url = await textArea.inputValue();
  const sharedPage = await context.newPage();
  await sharedPage.goto(url);
  await expect(sharedPage.getByRole("dialog", { name: "共有旅程を開きますか？" })).toBeVisible();
  await sharedPage.getByRole("button", { name: "一時的に見る" }).click();
  await expect(sharedPage.getByText("共有旅程を一時的に表示しています")).toBeVisible();
});
