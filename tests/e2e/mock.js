// Mock pages for the end-to-end test: a SharePoint page hosting a fake
// PowerPoint-for-web viewer iframe with the DOM shapes slides-viewer.js reads.
exports.TOP_URL = "https://contoso.sharepoint.com/:p:/r/sites/eng/_layouts/15/Doc.aspx?file=Lesson%20Deck.pptx&action=view";
exports.VIEWER_ORIGIN = "https://usc-powerpoint.officeapps.live.com";

exports.topHtml = (viewerQuery) => `<!doctype html><html><head><title>Lesson Deck.pptx - SharePoint</title></head>
<body style="margin:0;font-family:sans-serif">
<div style="height:40px;background:#eee">SharePoint header</div>
<iframe id="WacFrame_PowerPoint_0" name="WacFrame_PowerPoint_0"
  src="${exports.VIEWER_ORIGIN}/p/PowerPointFrame.aspx?${viewerQuery || ""}"
  style="position:absolute;top:40px;left:0;width:100%;height:calc(100% - 40px);border:0"></iframe>
</body></html>`;

exports.viewerHtml = `<!doctype html><html><head><title>PowerPoint</title>
<style>
 body{margin:0;font-family:sans-serif}
 [role=option]{height:60px;margin:6px;background:#ddd;outline:none}
 [role=option][aria-selected=true]{background:#9cf}
 .wrap{position:absolute;left:40px;top:20px;display:none}
</style></head><body>
<div role="listbox" id="thumbs" style="position:absolute;left:0;top:0;width:180px;bottom:30px;overflow:auto"></div>
<div id="WACViewPanel" style="position:absolute;left:200px;top:0;right:0;bottom:30px"></div>
<div id="WACStatusBarContainer" style="position:absolute;left:0;right:0;bottom:0;height:30px;background:#f3f3f3"></div>
<!-- the "no edit permission" toast: light-dismiss Fluent callout, one OK button -->
<div id="BaseCallout229" style="position:fixed;right:10px;top:10px;width:260px;height:70px;background:#fff;border:1px solid #888;z-index:9">
  <div role="alertdialog">You don't have permission to edit this file.
    <button id="toastOk" onclick="window.__toastOk=1;document.getElementById('BaseCallout229').remove()">OK</button></div>
</div>
<!-- a real question dialog that must NEVER be answered by the extension -->
<div id="BaseCallout300" style="position:fixed;left:10px;bottom:40px;width:170px;height:70px;background:#fff;border:1px solid #888;z-index:9">
  <div role="alertdialog">Reload the file?
    <button onclick="window.__reloadClicked='reload'">Reload</button>
    <button onclick="window.__reloadClicked='cancel'">Cancel</button></div>
</div>
<script>
(function () {
  const N = 5;
  const BROKEN = +new URLSearchParams(location.search).get("broken") || 0;
  const log = (window.__log = { keys: 0, thumbClicks: 0 });
  window.__lightDismissed = 0;
  const toast = document.getElementById("BaseCallout229");
  // Fluent light dismiss: a click outside the callout closes it.
  document.addEventListener("click", (e) => {
    if (toast.isConnected && !toast.contains(e.target)) { toast.remove(); window.__lightDismissed = 1; }
  }, true);
  const panel = document.getElementById("WACViewPanel");
  const list = document.getElementById("thumbs");
  const status = document.getElementById("WACStatusBarContainer");
  const content = (i) =>
    '<svg width="640" height="360"><rect width="640" height="360" fill="hsl(' + i * 70 + ',60%,85%)"/>' +
    '<text x="40" y="80" font-size="40">Slide ' + (i + 1) + '</text></svg>' +
    '<div class="Paragraph" style="position:absolute;left:40px;top:120px">Text of slide ' + (i + 1) + '</div>' +
    (i === 2 ? '<img style="position:absolute;left:300px;top:150px;width:200px;height:150px" src="' + location.origin + '/images.ashx?s=3&t=' + Date.now() + '">' : "");
  const wraps = [];
  const thumbs = [];
  for (let i = 0; i < N; i++) {
    const w = document.createElement("div");
    w.id = "PageContentSizeWrapper" + i;
    w.className = "wrap";
    w.innerHTML = content(i); // every slide's text is in the DOM, like the real viewer
    panel.appendChild(w);
    wraps.push(w);
    const t = document.createElement("div");
    t.setAttribute("role", "option");
    t.className = "grid-content-thumbnail-view";
    t.setAttribute("aria-posinset", i + 1);
    t.setAttribute("title", "Title, Slide " + (i + 1) + " of " + N);
    t.textContent = i + 1;
    t.addEventListener("click", () => { log.thumbClicks++; show(i + 1); });
    list.appendChild(t);
    thumbs.push(t);
  }
  let cur = 1;
  function show(n) {
    cur = n;
    wraps.forEach((w) => (w.style.display = "none"));
    thumbs.forEach((t) => t.setAttribute("aria-selected", +t.getAttribute("aria-posinset") === n ? "true" : "false"));
    status.textContent = "Slide " + n + " of " + N;
    const w = wraps[n - 1];
    w.style.display = "block";
    w.innerHTML = ""; // switched but not drawn yet...
    if (BROKEN === n) { w.style.width = "150px"; w.style.height = "80px"; w.innerHTML = '<div class="Paragraph">Broken ' + n + "</div>"; return; }
    setTimeout(() => { w.innerHTML = content(n - 1); }, 150); // ...drawn a moment later
    // Slide 4: the real viewer's "not rendered yet" overlay (white, grey icon)
    // covers the slide for a while even though its content is in the DOM.
    if (n === 4) {
      const ov = document.createElement("div");
      ov.id = "SlideBlockingIndicator"; ov.className = "ShimmerIndicator SlideShimmer";
      const r = w.getBoundingClientRect();
      ov.style.cssText = "position:absolute;z-index:5;background:#fff;left:" + (r.left) + "px;top:" + r.top + "px;width:640px;height:360px";
      ov.innerHTML = '<div style="margin:150px auto;width:80px;height:60px;border:6px solid #ccc"></div>';
      setTimeout(() => document.body.appendChild(ov), 160);
      setTimeout(() => ov.remove(), 1600);
    }
  }
  list.addEventListener("keydown", (e) => {
    const next = { ArrowDown: Math.min(N, cur + 1), ArrowUp: Math.max(1, cur - 1), Home: 1, End: N }[e.key];
    if (!next) return;
    log.keys++;
    e.preventDefault();
    setTimeout(() => show(next), 80);
  });
  show(1);
  wraps[0].innerHTML = content(0);
})();
</script></body></html>`;
