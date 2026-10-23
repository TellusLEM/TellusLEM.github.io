// User manual: reveal on scroll, the active contents entry, MCP tabs, copy buttons and the
// screenshot lightbox. The page reads fine without JavaScript.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => (reduce ? el.classList.add("in") : io.observe(el)));

  // the contents entry of the section in view
  const links = [...document.querySelectorAll(".toc a")];
  const byId = Object.fromEntries(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((a) => a.classList.remove("active"));
      byId[e.target.id] && byId[e.target.id].classList.add("active");
    }
  }), { rootMargin: "-30% 0px -60% 0px" });
  document.querySelectorAll(".sec").forEach((s) => spy.observe(s));

  // MCP client tabs
  const tabs = document.getElementById("mcp-tabs");
  if (tabs) {
    tabs.querySelectorAll(".tab-bar button").forEach((b) => b.addEventListener("click", () => {
      tabs.querySelectorAll(".tab-bar button").forEach((x) => x.classList.toggle("on", x === b));
      tabs.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === b.dataset.tab));
    }));
  }

  // copy buttons on the commands
  document.querySelectorAll(".code.copy").forEach((pre) => {
    const text = pre.textContent.trim();
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; }
      catch (e) { btn.textContent = "Select and copy"; }
      setTimeout(() => (btn.textContent = "Copy"), 1600);
    });
    pre.appendChild(btn);
  });

  // screenshot lightbox
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  document.querySelectorAll(".shot.zoom img").forEach((img) => img.addEventListener("click", () => {
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lb.classList.add("on");
    lb.setAttribute("aria-hidden", "false");
  }));
  const close = () => { lb.classList.remove("on"); lb.setAttribute("aria-hidden", "true"); };
  lb.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();
