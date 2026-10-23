# 隱私權政策 / Privacy Policy

**OneDrive / SharePoint Download Unlocker**

最後更新 / Last updated: 2026-10-23

---

## 中文版

### 這個擴充功能做什麼

這個擴充功能做兩件事：

- 在你開啟 OneDrive 或 SharePoint 的 PDF 預覽分頁時，偵測該分頁載入的檔案內容請求，讓你用一個按鈕把檔案存到本機的「下載」資料夾。
- 在 PowerPoint 網頁版中，逐張擷取你正在檢視的簡報，在本機組成 PDF 與文字檔。

### 我們不收集、不上傳任何資料

這個擴充功能的所有運作都只發生在你自己的瀏覽器裡：

- 偵測檔案請求、抓取檔案內容、擷取投影片、組成檔案、觸發下載，全部都在你的電腦本機完成。
- 我們**不會**把你瀏覽的網址、檔案內容、檔案名稱、帳號資訊或任何其他資料傳送到任何外部伺服器、第三方服務，或開發者的伺服器（開發者沒有任何伺服器）。
- 沒有任何分析、追蹤、廣告或遠端記錄功能。
- 唯一的對外連線是**新版本檢查**：在你打開彈出視窗或下載／匯出完成時，最多每天一次向 GitHub 公開的 API（`api.github.com`）讀取本專案最新的版本號。這個請求不帶任何你的資料。可以在提示上選「不再提示」關閉。

### 本機儲存的資料

擴充功能會用瀏覽器內建的 `chrome.storage.local`（只存在你的裝置上）儲存：

- 你選擇的顯示語言（英文或中文）。
- 你選擇的投影片匯出畫質（標準／高／最高）。
- 新版本檢查：上次檢查的時間、查到的最新版本號，以及你是否選了「跳過這個版本」或「不再提示」。

除此之外不儲存任何內容。匯出的檔案只會存到你的「下載」資料夾；分頁關閉後，該分頁偵測到的請求資訊會自動清除。

### 使用到的權限與用途

| 權限 | 用途 |
|---|---|
| `webRequest` / `webNavigation` | 偵測 OneDrive / SharePoint 頁面載入的檔案內容請求，找出真正的 PDF/文件資料 |
| `downloads` | 把抓到的檔案內容存成本機檔案 |
| `activeTab` / `scripting` | 讀取目前分頁的檔案標題、觸發下載。Firefox 的投影片匯出也用它們擷取畫面與翻頁 |
| `storage` | 記住顯示語言、投影片匯出畫質與新版本提醒的設定 |
| `debugger`（Chrome / Edge） | 只用於匯出投影片：翻頁並擷取投影片畫面。只在你按下匯出時作用於該分頁，匯出結束立即解除 |
| `host_permissions`（限定 sharepoint.com、sharepointonline.com、onedrive.live.com、officeapps.live.com、1drv.ms、svc.ms、mcas.ms、login.microsoftonline.com、login.windows.net、spoprod-a.akamaihd.net） | 只在這些微軟網域上運作（檔案內容、安全代理、登入與靜態資源），不讀取其他網站 |

---

## English

### What this extension does

This extension does two things:

- On OneDrive / SharePoint PDF preview pages, it detects the request that carries the file's content and lets you save the file to your Downloads folder with one click.
- In PowerPoint for the web, it captures the deck you're viewing slide by slide and builds a PDF and a text file locally.

### We do not collect or transmit any data

Everything this extension does happens entirely inside your own browser:

- Detecting file requests, fetching file bytes, capturing slides, building the files, and triggering the download all happen locally on your machine.
- We do **not** send the URLs you visit, file contents, filenames, account information, or any other data to any external server, third-party service, or the developer (the developer runs no servers).
- There is no analytics, tracking, advertising, or remote logging of any kind.
- The only outbound request is the **new-version check**: when you open the popup or a download/export finishes, at most once a day, the extension reads this project's latest version number from GitHub's public API (`api.github.com`). The request carries none of your data. Choose "Don't remind me" on the notice to turn it off.

### Data stored locally

The extension uses the browser's built-in `chrome.storage.local` (stored only on your device) to remember:

- Your chosen display language (English or Chinese).
- Your chosen slide-export quality (Standard / High / Max).
- The new-version check: when it last ran, the latest version it found, and whether you chose "Skip this version" or "Don't remind me".

Nothing else is stored. Exported files go only to your Downloads folder, and a tab's detected requests are cleared when the tab closes.

### Permissions used and why

| Permission | Purpose |
|---|---|
| `webRequest` / `webNavigation` | Detect the network request on OneDrive/SharePoint pages that carries the actual PDF/document content |
| `downloads` | Save the fetched file content as a local file |
| `activeTab` / `scripting` | Read the current tab's document title and trigger downloads. Firefox's slide export also uses them to capture and step through slides |
| `storage` | Remember the display language, slide-export quality and new-version reminder settings |
| `debugger` (Chrome / Edge) | Used only by slide export: steps through and captures slides. Attached only to that tab while you export, and detached as soon as it ends |
| `host_permissions` (limited to sharepoint.com, sharepointonline.com, onedrive.live.com, officeapps.live.com, 1drv.ms, svc.ms, mcas.ms, login.microsoftonline.com, login.windows.net, spoprod-a.akamaihd.net) | The extension only runs on these Microsoft domains (file content, security proxy, sign-in and static assets) and does not access other websites |
