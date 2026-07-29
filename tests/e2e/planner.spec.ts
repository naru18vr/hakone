import { expect, test } from "@playwright/test";

test("夕食条件、影響プレビュー、追加・削除、復元を確認する", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();

  await page.locator(".return-settings summary").click();
  await page.getByLabel("夕食予定").fill("18:30");
  const pola = page.getByRole("button", { name: /ポーラ美術館を地図で表示して詳細を見る/ });
  await expect(pola).toHaveCount(1);
  await pola.click();
  const selectedSpotButton = page.getByRole("button", { name: /選択中：ポーラ美術館/ });
  await expect(selectedSpotButton).toBeVisible();
  await selectedSpotButton.click();
  await page.waitForTimeout(500);
  const add = page.getByRole("button", { name: "旅程へ追加" });
  await expect(add).toBeVisible();
  await add.press("Enter");
  const dialog = page.locator(".add-dialog");
  await expect(dialog).toContainText("どの日に追加しますか？");
  await dialog.getByRole("button", { name: "8月13日" }).click();
  await expect(dialog).toContainText("おすすめ位置");
  await expect(dialog).toContainText("東京駅着");
  await dialog.getByRole("button", { name: "この位置に追加" }).click();
  await expect(page.locator(".toast")).toContainText("ポーラ美術館を8月13日に追加しました");
  await expect(page.locator(".return-card")).toContainText("東京駅着");

  const remove = page.getByRole("button", { name: "最後の観光地を外す" });
  if (await remove.count() === 1) await remove.click();
  await page.reload();
  await expect(page.getByText("保存した旅程を復元しました")).toBeVisible();
});

test("初期候補を絞って表示し、必要な件数だけ追加表示する", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();

  await expect(page.locator(".travel-condition-editor")).not.toHaveAttribute("open");
  await expect(page.locator(".spot-row")).toHaveCount(12);
  await expect(page.locator(".spot-list-footer")).toContainText("12件を表示");
  await page.getByRole("button", { name: /さらに12件表示/ }).click();
  await expect(page.locator(".spot-row")).toHaveCount(24);
  await expect(page.locator(".map-controls")).not.toHaveAttribute("open");
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

test("地図上の仮地点を確定し、追加フォームへ戻る", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();
  await page.getByRole("button", { name: "予定を追加" }).click();
  const dialog = page.getByRole("dialog", { name: "旅行の予定を追加" });
  await dialog.getByLabel("タイトル（必須）").fill("地図で決めた休憩");
  await dialog.getByLabel("設定方法").selectOption("map");
  await dialog.getByRole("button", { name: "地図上で地点を選択" }).click();
  await expect(page.getByText("地点選択モード")).toBeVisible();
  await page.locator(".leaflet-container").click({ position: { x: 180, y: 220 } });
  await expect(page.getByText("選択地点")).toBeVisible();
  await page.getByRole("button", { name: "この地点を使用" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("設定済み：")).toBeVisible();
  await dialog.getByRole("button", { name: "予定を追加" }).click();
  await expect(page.getByText("地図で決めた休憩", { exact: true })).toBeVisible();
});

test("地点選択のキャンセル後も入力内容を保持する", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  const sheetHandle = page.getByRole("button", { name: "旅程・観光地を開く" });
  if (await sheetHandle.count() === 1 && await sheetHandle.isVisible()) await sheetHandle.click();
  await page.getByRole("button", { name: "予定を追加" }).click();
  const dialog = page.getByRole("dialog", { name: "旅行の予定を追加" });
  await dialog.getByLabel("タイトル（必須）").fill("入力を保持する休憩");
  await dialog.getByLabel("設定方法").selectOption("map");
  await dialog.getByRole("button", { name: "地図上で地点を選択" }).click();
  await page.getByRole("button", { name: "選択を中止" }).click();
  await expect(dialog.getByLabel("タイトル（必須）")).toHaveValue("入力を保持する休憩");
});
