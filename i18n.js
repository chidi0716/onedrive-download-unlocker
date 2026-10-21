// i18n.js
// 共用的語言字串表，同時被 popup.html（透過 <script>）與 content.js
// （透過 manifest.json 的 content_scripts）載入，所以兩邊永遠用同一份
// 翻譯，不會各自維護一份造成不一致。
// 預設語言是英文（en），使用者可以在 popup 裡切換成中文（zh-Hant），
// 選擇會存進 chrome.storage.local，下次開啟時會記住。
(function (global) {
  const STORAGE_KEY = "odpdf_lang";
  const DEFAULT_LANG = "en";

  const STRINGS = {
    en: {
      popupTitleLine1: "OneDrive / SharePoint",
      popupTitleLine2: "Download Unlocker",
      langLabel: "Language",
      helpSummary: "How to use",
      helpStep1: "Open the OneDrive / SharePoint <b>PDF preview tab</b>",
      helpStep2: "Press <b>F5 to reload</b> that tab",
      helpStep3: "Wait for the page to <b>fully load</b> (the PDF content shows up)",
      helpStep4: "Come back here and click <b>\"Rescan\"</b> below",
      helpStep5: "Pick a file from the list — <b>the first one is usually the right one</b>",
      refreshBtn: "🔄 Rescan",
      emptyText: "No file requests detected yet.<br/>Reload the PDF preview tab, wait for it to fully load, then try again.",
      footerText: "Detected requests are only kept for the current tab and are cleared automatically when it's closed.",
      sizeUnknown: "size unknown (streamed)",
      matchKeyword: "⭐ Likely target",
      matchLarge: "📦 Large file",
      authOk: "🔑 Auth header captured",
      authBad: "⚠️ No auth header",
      downloadBest: "Download this file (best match)",
      downloadThis: "Download this file",
      downloading: "Downloading…",
      saved: "Saved ✓",
      downloadFailed: "Download failed: ",
      unknownError: "Unknown error",
      btnIdleShort: "Download",
      btnIdleFull: "Download PDF",
      btnDownloading: "Downloading…",
      btnSaved: "Saved ✓",
      btnFailed: "Failed: ",
      btnTitle: "Download this file with the extension (original filename)",
      closeTitle: "Don't show this time",
      btnNotFound: "PDF not detected",
      btnNotFoundTitle: "No file detected yet. Wait a moment or reload the page.",
      slidesExportPdf: "Export slides (PDF)",
      slidesExportText: "Text",
      slidesQualityLabel: "Quality",
      slidesQualityStandard: "Standard (1600px, small file)",
      slidesQualityHigh: "High (2000px)",
      slidesQualityMax: "Max (2560px, near-print)",
      slidesExportTitle: "Save all slides as a PDF plus a text file",
      slidesTextTitle: "Save only the slide text (fast)",
      slidesPreparing: "Preparing…",
      slidesProgress: "Exporting {i}/{n}…",
      slidesDone: "Done: {n} slides in {s}s",
      slidesTextDone: "Text saved: {n} slides in {s}s",
      slidesFailed: "Export failed: ",
      slidesPopupHeading: "PowerPoint slides detected ({n} slides)",
      slidesStarted: "Export started. Progress shows at the bottom-left of the viewer.",
      slidesDebuggerNote: "An “is debugging this browser” bar shows while exporting. It closes when the export ends.",
      slidesStartFailed: "Couldn't start the export. Reload the tab, wait for the slides, then try again.",
      slidesCancelled: "Export cancelled.",
      slidesNeedActiveTab: "Click the extension's toolbar icon on this page first, then start the export again.",
      slidesFirefoxNote: "Keep this tab in front while exporting.",
      slidesPartialSaved: "Saved slides 1–{k} of {n}.",
      slidesCloseTitle: "Hide this button on this page",
      helpSlides1: "Open the deck in <b>PowerPoint for the web</b> and wait until the slides appear",
      helpSlides2: "Pick a <b>quality</b> below and click <b>\"Export slides (PDF)\"</b> — or use the orange button at the bottom-right of the page",
      helpSlides3: "The PDF and a .txt of the slide text go to your <b>Downloads</b> folder",
    },
    "zh-Hant": {
      popupTitleLine1: "OneDrive / SharePoint",
      popupTitleLine2: "下載解鎖工具",
      langLabel: "語言",
      helpSummary: "使用說明",
      helpStep1: "開啟 OneDrive / SharePoint 的 <b>PDF 預覽分頁</b>",
      helpStep2: "按 <b>F5 重新整理</b> 該分頁",
      helpStep3: "等待頁面 <b>完全載入</b>（PDF 內容顯示出來）",
      helpStep4: "回到這裡點下方 <b>「重新掃描」</b>",
      helpStep5: "從清單選擇檔案，<b>第一個通常就是要的檔案</b>",
      refreshBtn: "🔄 重新掃描",
      emptyText: "尚未偵測到任何檔案內容請求。<br/>請重新整理 PDF 預覽分頁，等待完全載入後再試一次。",
      footerText: "偵測到的請求只會保留在目前分頁，關閉分頁後會自動清除",
      sizeUnknown: "大小未知（串流）",
      matchKeyword: "⭐ 可能是目標",
      matchLarge: "📦 大型檔案",
      authOk: "🔑 已取得授權標頭",
      authBad: "⚠️ 未取得授權標頭",
      downloadBest: "下載這個檔案（最佳匹配）",
      downloadThis: "下載這個檔案",
      downloading: "下載中…",
      saved: "已儲存 ✓",
      downloadFailed: "下載失敗：",
      unknownError: "未知錯誤",
      btnIdleShort: "下載",
      btnIdleFull: "下載 PDF",
      btnDownloading: "下載中…",
      btnSaved: "已儲存 ✓",
      btnFailed: "失敗：",
      btnTitle: "用擴充功能下載這個檔案（原始檔名）",
      closeTitle: "這次先不顯示",
      btnNotFound: "未偵測到 PDF",
      btnNotFoundTitle: "尚未偵測到檔案。請稍等，或重新整理頁面。",
      slidesExportPdf: "匯出投影片（PDF）",
      slidesExportText: "文字",
      slidesQualityLabel: "畫質",
      slidesQualityStandard: "標準（1600px，檔案小）",
      slidesQualityHigh: "高（2000px）",
      slidesQualityMax: "最高（2560px，接近可列印）",
      slidesExportTitle: "把所有投影片存成 PDF，並另存文字檔",
      slidesTextTitle: "只儲存投影片文字（很快）",
      slidesPreparing: "準備中…",
      slidesProgress: "匯出中 {i}/{n}…",
      slidesDone: "完成：{n} 張，耗時 {s} 秒",
      slidesTextDone: "文字已儲存：{n} 張，耗時 {s} 秒",
      slidesFailed: "匯出失敗：",
      slidesPopupHeading: "偵測到 PowerPoint 投影片（共 {n} 張）",
      slidesStarted: "已開始匯出，進度顯示在檢視器左下角。",
      slidesDebuggerNote: "匯出時上方會出現「正在對這個瀏覽器進行偵錯」提示列，匯出結束後自動消失。",
      slidesStartFailed: "無法開始匯出。請重新整理分頁，等投影片出現後再試一次。",
      slidesCancelled: "已取消匯出。",
      slidesNeedActiveTab: "請先在這個頁面點一下工具列上的擴充功能圖示，再重新開始匯出。",
      slidesFirefoxNote: "匯出期間請讓這個分頁保持在最前面。",
      slidesPartialSaved: "已儲存第 1–{k} 張（共 {n} 張）。",
      slidesCloseTitle: "在這個頁面隱藏此按鈕",
      helpSlides1: "在 <b>PowerPoint 網頁版</b>開啟簡報，等投影片顯示出來",
      helpSlides2: "在下方選擇<b>畫質</b>後按<b>「匯出投影片（PDF）」</b>，或直接點頁面右下角的橘色按鈕",
      helpSlides3: "PDF 與投影片文字的 .txt 會存到<b>「下載」</b>資料夾",
    },
  };

  function getLang(callback) {
    try {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const lang = (res && res[STORAGE_KEY]) || DEFAULT_LANG;
        callback(STRINGS[lang] ? lang : DEFAULT_LANG);
      });
    } catch (e) {
      callback(DEFAULT_LANG);
    }
  }

  function setLang(lang, callback) {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: lang }, () => {
        if (callback) callback();
      });
    } catch (e) {
      if (callback) callback();
    }
  }

  function t(lang, key) {
    const dict = STRINGS[lang] || STRINGS[DEFAULT_LANG];
    if (dict && dict[key] != null) return dict[key];
    return (STRINGS[DEFAULT_LANG] && STRINGS[DEFAULT_LANG][key]) || key;
  }

  global.ODPDF_I18N = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_LANG: DEFAULT_LANG,
    LANGS: Object.keys(STRINGS),
    getLang: getLang,
    setLang: setLang,
    t: t,
  };
})(typeof window !== "undefined" ? window : this);
