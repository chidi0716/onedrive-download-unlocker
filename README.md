**English** | [繁體中文](./README.zh-TW.md)

# OneDrive / SharePoint Download Unlocker

Last updated: 2026-10-21 (version 1.3.0)

A browser extension (Manifest V3) for files on OneDrive / SharePoint that you can view but not download. It does two things:

1. **Download preview-only PDFs** — one click saves the file under its original name.
2. **Export PowerPoint-for-web slides** — saves a view-only deck (even a sensitivity-labelled one) as an image-based PDF plus a `.txt` of the slide text.

| | Chrome | Edge | Firefox |
|---|:-:|:-:|:-:|
| PDF download | ✅ | ✅ | ✅ |
| Slide export | ✅ | ✅ | ✅ (since 1.3.0) |

## Why

Files set to "preview only" have no download button, but their content still reaches the browser. Saving one used to mean finding the right request in DevTools, copying its URL and auth headers, and re-sending it by hand. The extension does this automatically and adds a download button to the page.

## Screenshots

| Download button on the preview page | Popup showing a detected file |
| --- | --- |
| ![Download button](./screenshots/screenshot-preview-page.png) | ![Popup](./screenshots/screenshot-popup.png) |

## Installation

The extension isn't on any store; install it from the [Releases](../../releases) page.

### Chrome / Edge

1. Download `onedrive-download-unlocker-<version>-chrome.zip` and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder (the one containing `manifest.json`).

Chrome / Edge ask you to confirm the `debugger` permission (used for slide capture). After an update, click **Enable** if the extension is turned off.

### Firefox

1. Download `onedrive-download-unlocker-<version>-firefox.zip` and unzip it.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick `manifest.json` in the unzipped folder.

Temporary add-ons are removed when Firefox restarts; load it again after each restart.

## Usage

### Download a PDF

1. Open the PDF preview page on OneDrive / SharePoint.
2. Click the **Download PDF** button that appears on the page. The file goes to your Downloads folder.

No button? Reload the page, or open the popup and click **Rescan**.

### Export slides

1. Open the deck in PowerPoint for the web and wait until the slides show.
2. Click the orange **Export slides (PDF)** button at the bottom-right of the page, or click the extension icon, choose a quality and press **Export slides (PDF)**. Press **Text** if you only want the text.
3. Progress shows at the bottom-left of the viewer. When it's done, the PDF and the `.txt` are in your Downloads folder.

**Quality** (remembered between exports): Standard 1600px (small file), High 2000px, Max 2560px (near-print). On Chrome / Edge, output is capped at your display's native resolution.

**On Chrome / Edge**, an "is debugging this browser" bar shows during the export and closes when it ends. Closing it cancels the export.

**On Firefox:**
- Click the extension's toolbar icon once on the PowerPoint page before exporting.
- Keep the tab in front during the export.
- Requires Firefox 140 or later.

**Good to know:**
- The **✕** on the export button hides it for that page.
- If an export stops partway, the slides done so far are still saved (e.g. `… (1-12 of 50).pdf`).
- The "you don't have permission to edit" notice and the "Click to add…" placeholders are removed from the captures automatically.
- In Arc, the window flashes on every slide.
- Extensions that force-enable right-click / copy (e.g. *Absolute Enable Right Click & Copy*) slow exports down a lot; turn them off while exporting.

## How it works

- **PDF download:** `background.js` watches requests on Microsoft domains (`webRequest`) and picks the one carrying the file by URL keywords (`passthrough`, `download.aspx`, `getfilebycontent`, `allowlistfiletype`, …). The download re-sends that request with its captured headers; files over 8 MB are passed to the page in 8 MB chunks, so size isn't limited by the browser's message cap.
- **Slide export:** `slides.js` runs inside the PowerPoint viewer. It moves to each slide with the arrow keys, waits until the slide (fonts and pictures included) has finished rendering, captures it, and finally builds the PDF locally. Chrome / Edge capture through the debugger API (`Page.captureScreenshot`); Firefox uses `tabs.captureVisibleTab`.

## Building the zips

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1   # macOS / Linux: pwsh build.ps1
```

This writes `dist/onedrive-download-unlocker-<version>-chrome.zip` and `-firefox.zip`, with the version taken from `manifest.json`. The Firefox manifest is generated from `manifest.json`, so there's only one manifest to maintain.

## File structure

- `manifest.json` — extension configuration (Firefox's is generated from it by `build.ps1`)
- `build.ps1` — packaging script
- `background.js` — request detection, downloads, and the privileged side of slide export
- `content.js` — the on-page download button and the "Export slides" button
- `popup.html` / `popup.js` — the popup: file list, language, slide export and quality
- `slides.js` — slide export: navigation, render waiting, capture, output, status bar
- `slides-viewer.js` — everything that depends on PowerPoint for the web's page structure; the file to fix when Microsoft changes the viewer
- `slidepdf.js` — builds the image-based PDF
- `util.js` — shared helpers (filenames, chunked transfer, saving files)
- `i18n.js` — English / Chinese strings
- `PRIVACY.md`, `CHANGELOG.md`, `LICENSE`

## Testing

- **Slide export:** tuned over many rounds on macOS + Arc. Since 1.2.1, each release is checked on a real 50-slide SharePoint deck (pictures, tables, charts, CJK text), with every slide inspected. For 1.3.0: Chromium 50/50 slides in about 41 s, Firefox 157 50/50 slides in about 47 s. An automated test against a mock viewer covers the on-page button, cancelling, and partial saves (25/25).
- **Large files (issue #1):** byte-for-byte identical downloads at 8 MB, 70 MB, 150 MB and 400 MB against a mock SharePoint server that requires `X-SPOPacToken`.
- **Firefox PDF download (issue #2):** confirmed by the user who requested it.

Found a problem? Open an issue with your browser, what you tried, and what happened.

## Known limitations

- Only Microsoft's global cloud (`*.sharepoint.com` etc.) is covered, not sovereign clouds (`.sharepoint.us` / `.cn` / `.de`).
- PDF detection relies on URL keywords. If Microsoft changes those URLs, `URL_KEYWORDS` in `background.js` needs updating.
- Slide export produces an image-based PDF; the text is in the separate `.txt`. Planned next: a selectable text layer in the PDF, and output above display resolution.

## License

[MIT](./LICENSE)
