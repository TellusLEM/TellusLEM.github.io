// TellusLEM site: the "License" button in the footer opens the freeware license
// agreement in a modal dialog. The text is fetched from LICENSE.txt so it exists
// once; if the fetch fails (file:// preview) the button falls back to opening the
// text file directly.
(() => {
  const footer = document.querySelector("footer .links");
  if (!footer) return;

  const btn = document.createElement("a");
  btn.href = "LICENSE.txt";
  btn.className = "license-btn";
  btn.textContent = "License";
  footer.appendChild(btn);

  const dlg = document.createElement("dialog");
  dlg.className = "license-dialog";
  dlg.innerHTML =
    '<div class="license-head">' +
      '<div><b>TellusLEM Freeware License</b><span>Copyright © 2026 Sompote Youwai</span></div>' +
      '<button type="button" class="license-close" aria-label="Close">×</button>' +
    '</div>' +
    '<pre class="license-text">Loading…</pre>' +
    '<div class="license-foot">' +
      '<a href="LICENSE.txt" download>Download LICENSE.txt</a>' +
      '<button type="button" class="btn primary license-ok">Close</button>' +
    '</div>';
  document.body.appendChild(dlg);

  const pre = dlg.querySelector(".license-text");
  const close = () => dlg.close();
  dlg.querySelector(".license-close").addEventListener("click", close);
  dlg.querySelector(".license-ok").addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });   // backdrop

  let loaded = false;
  btn.addEventListener("click", async (e) => {
    if (typeof dlg.showModal !== "function") return;        // very old browser: follow the link
    e.preventDefault();
    if (!loaded) {
      try {
        const r = await fetch("LICENSE.txt", { cache: "no-cache" });
        if (!r.ok) throw new Error(r.status);
        pre.textContent = await r.text();
        loaded = true;
      } catch {
        window.open("LICENSE.txt", "_blank");
        return;
      }
    }
    dlg.showModal();
    pre.scrollTop = 0;
  });
})();
