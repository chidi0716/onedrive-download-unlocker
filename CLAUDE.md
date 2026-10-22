# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 browser extension (Chrome / Edge / Firefox) with two features:

1. **PDF download** from OneDrive / SharePoint "preview only" pages: the background watches network requests, finds the one carrying the file content, and re-fetches it with the captured auth headers.
2. **PowerPoint-for-web slide export**: walks a view-only deck slide by slide inside the PowerPoint viewer, captures each slide (Chrome / Edge: DevTools protocol via `chrome.debugger`; Firefox: `tabs.captureVisibleTab`), and saves an image-based PDF plus a `.txt` of the slide text.

Plain JavaScript, no build step, no dependencies, no tests in the repo. User-facing docs are bilingual (README.md / README.zh-TW.md); CHANGELOG.md is written in Traditional Chinese.

## Commands

- Syntax check (the only automated check): `for f in *.js; do node --check "$f"; done`
- Package: `pwsh build.ps1` (or `powershell -ExecutionPolicy Bypass -File build.ps1` on Windows) → `dist/onedrive-download-unlocker-<version>-chrome.zip` and `-firefox.zip`. `<version>` comes from `manifest.json`. `dist/` and zips are git-ignored; release zips are attached to GitHub Releases by hand.
- Run in Chrome: `chrome://extensions` → Developer mode → Load unpacked → repo root. Firefox needs the built firefox zip (its manifest only exists inside it).
- Validate the Firefox package the way addons.mozilla.org does: `npx addons-linter dist/onedrive-download-unlocker-<version>-firefox.zip` (must report 0 errors; the `debugger.*` / `innerHTML` warnings are known and harmless).
- Sign for self-distribution (unlisted): unzip the firefox zip to a folder, then `npx web-ext sign --channel=unlisted --source-dir <folder> --api-key "$WEB_EXT_API_KEY" --api-secret "$WEB_EXT_API_SECRET"`. Credentials are the owner's AMO API keys and are never committed; each signed version number can only be used once.

## Architecture

### Script contexts and load order
- `background.js` — service worker (Chrome) / background script (Firefox). Request detection, downloads with chunked transfer, and the privileged side of slide export (CDP on Chrome, `fx*` functions on Firefox).
- Content scripts share globals that are loaded first, in manifest order: `i18n.js` → `ODPDF_I18N`, `util.js` → `ODPDF_UTIL` (filename sanitising, base64, chunked-transfer pull, `saveBlob`). The popup loads the same two via `<script>` tags.
  - Entry 1 (top frame only, SharePoint/OneDrive/officeapps): `content.js` — floating PDF download button, and on PowerPoint pages the on-page "Export slides" button.
  - Entry 2 (`*.officeapps.live.com`, `all_frames`): `slidepdf.js` (`ODPDF_PDF`, minimal JPEG→PDF writer), `slides-viewer.js` (`ODPDF_VIEWER`), `slides.js`. `slides.js` only activates in frames whose hostname contains `powerpoint`.
- `popup.js` / `popup.html` — candidate list, language switch, slide-export box with quality (`chrome.storage.local` keys `odpdf_lang`, `odpdf_slide_quality`).

### Firefox
`manifest.json` is the single source. `build.ps1` generates the Firefox manifest (service worker → `background.scripts`, drops the `debugger` permission, drops `version_name`, adds `browser_specific_settings.gecko` with `strict_min_version` 140 and `data_collection_permissions: none`, which AMO requires for signing). Keep `description` ≤132 chars (Chrome Web Store) — AMO rejects >250. There is no `manifest.firefox.json`. Bump the version only in `manifest.json`.

### Firefox slide-export backend
background.js picks a backend with `USE_CDP = !!chrome.debugger`; the `fx*` functions are the Firefox side behind the same messages. Capture is `tabs.captureVisibleTab(windowId, {rect, scale})` (re-renders, so no native-resolution clamp; `SLIDES_BEGIN` replies `backend: "tab"` vs `"cdp"`). It needs an `activeTab` grant (user clicked the toolbar icon on that page); without it `SLIDES_BEGIN` fails with `ODPDF_NEED_ACTIVETAB` and slides.js shows `slidesNeedActiveTab`. Input: at begin, `scripting.executeScript({world:"MAIN"})` installs `fxPageInputHelper` in the viewer frame (marks it with `data-odpdf-input`); slides.js then fires `__odpdf_input` CustomEvents in-frame and the helper dispatches keydown/keyup with `keyCode` defined in the page world (Xray wrappers hide overrides made from the content-script world) or a pointer/mouse click sequence. No per-key round trip; `SLIDES_INPUT` is only the fallback. Mouse-move is a no-op. The verify gap between the two capture shots counts the shot's own duration on Firefox. The tab must stay in front. Firefox ≥140.

### Slide export flow (messages)
- Start: popup sends `SLIDES_RUN` to the tab, or `content.js` sends `SLIDES_START` → background relays `SLIDES_RUN` to all frames; only the ready viewer frame (slides.js) answers.
- `slides.js` drives everything and calls background for privileged work: `SLIDES_BEGIN` (attach debugger, compute viewer-iframe offset), `SLIDES_INPUT` (trusted key/click/mouse-move via CDP `Input.*`), `SLIDES_CAPTURE` (`Page.captureScreenshot` with clip + scale), `SLIDES_END` (detach).
- Per slide: `goToSlide` (focus thumbnail list in-frame, one CDP ArrowDown; thumbnail click only as fallback) → `waitSlideReady` → `captureCurrent` → finally `ODPDF_PDF.buildPdfBlob` and `saveBlob` inside the viewer frame.
- The on-page button is event driven: slides.js sends `SLIDES_STATE {total, busy}`, background relays it to frame 0 where content.js shows/hides the button (hidden while busy so it can't be captured). `SLIDES_QUERY` is a one-off ping used on load.
- Failure mid-export still saves a partial PDF/txt (`… (1-k of n)`); closing the browser's debugging bar surfaces as error string `ODPDF_CANCELLED`.
- Progress/errors show in a status bar inside the viewer; the final console line `[odpdf] slide export {…timingsMs, reshots}` is the main diagnostic.

### Where to change what
- **`slides-viewer.js` holds every assumption about PowerPoint for the web's DOM** (thumbnails `[role=option][class*=thumbnail]` with `aria-posinset/aria-selected`, `#PageContentSizeWrapperN`, `#WACViewPanel`, "Slide X of N", the permission toast). When Microsoft changes the viewer, fix it here.
- All slide-export waits/timeouts are in the `TIMING` object at the top of `slides.js`.
- Every user-visible string goes in `i18n.js`; the `en` and `zh-Hant` tables must keep identical keys.

## Hard-won constraints (don't regress these)
- **Never CSS-hide the "no edit permission" toast** (Fluent callout `#BaseCallout…`): Fluent re-creates it in a loop and janks the whole browser. `dismissNotification` light-dismisses it (synthetic outside click) and otherwise clicks its single OK button; only single-button alert callouts are touched, never removed by hand.
- **Readiness signals**: the viewer puts src-less `.SlidePictureIncrementalLoading` `<img>`s in every slide that never load — they must not count as pending. Pictures are SVG `<image>` elements that first show a small inline-SVG "image" icon (`loadingPictures()`) before the real JPEG/PNG swaps in. A slide the viewer hasn't rendered yet sits behind `#SlideBlockingIndicator` (`.SlideShimmer`: white overlay, grey layout icon), outside the slide wrapper, while the wrapper may already hold its text; `slideBlocked()` checks it in both `waitSlideReady` and `captureCurrent`. `captureCurrent` also requires two byte-identical consecutive shots, because the viewer sometimes repaints after looking finished.
- **Capture**: Chrome's `captureVisibleTab` has no clip/scale, hence CDP. Never pass `clip` to `Page.captureScreenshot` in the normal path: Chromium zooms the live page onto the clip for the duration of the shot, which flashes on every slide (seen on Edge). The background shoots the whole tab and slides.js `cropShot` cuts the slide out (scale = shot width / top viewport width, `offset.vw`); only if that shot doesn't cover the slide (seen under Playwright's device emulation) does it fall back to clipped shots for the rest of the export. Output width is clamped to the display's native resolution. `fromSurface:false` is tried first; Arc rejects it, so the code falls back to surface capture once per export.
- **Navigation**: keyboard-first; coordinate clicks on the slide itself enter text-edit mode. PowerPoint ignores synthetic keys unless `keyCode` is set, and ignores a bare `.click()` (needs the pointer/mouse event sequence) — relevant for any non-debugger (e.g. Firefox) path.
- Previously tried and rejected: drawing slides via DOM→canvas (shapes/fonts wrong on real Macs), vector PDF via svg2pdf (CJK garbled), reconstructing the file from the server's cell-storage data (deliberately not done — it would defeat sensitivity labels).
- "Force enable right-click/copy" extensions re-scan the viewer's DOM constantly and make exports crawl; rule them out when debugging slowness.

## Testing without a SharePoint login
The public Office viewer can open the full PowerPoint editor for any public `.pptx`: load `https://view.officeapps.live.com/op/view.aspx?src=<url>`, take the `PowerPointFrame.aspx?PowerPointView=ReadingView…` URL it POSTs to, and POST `access_token=1` to the same URL with `PowerPointView=EditView` — it redirects to `…/pods/ppt.aspx` with thumbnails and the permission toast, i.e. the same DOM as SharePoint. Apache POI's `test-data/slideshow/*.pptx` on raw.githubusercontent.com are usable public decks. Never commit private SharePoint links used for testing.

## Repo conventions
- Commits are authored as `chidi0716 <chidi0716@gmail.com>` without AI attribution trailers.
- When behaviour changes, update README.md and README.zh-TW.md together, add a CHANGELOG entry, and keep PRIVACY.md in sync with permissions and stored settings.
- Docs must not state real-device results that haven't been verified; mark them as expected/unverified.
