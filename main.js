// TellusLEM site: the slope animation, counters, the agent terminal, the verification bars
// and reveal-on-scroll. Everything degrades to static content without JavaScript or with
// prefers-reduced-motion.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- nav border on scroll
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- reveal on scroll
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        e.target.dispatchEvent(new CustomEvent("revealed"));
        seen.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    seen.observe(el);
  });

  // ---------------------------------------------------------------- the slope and slip circle
  const ground = [[20, 250], [190, 250], [330, 150], [540, 150]];
  const groundY = (x) => {
    for (let i = 0; i < ground.length - 1; i++) {
      const [x0, y0] = ground[i], [x1, y1] = ground[i + 1];
      if (x >= x0 && x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
    return null;
  };
  const C = [316, 30], R = 236;
  // the arc below the ground, from the toe side to the crest side
  const arc = [];
  for (let k = 0; k <= 400; k++) {
    const t = Math.PI * (0.02 + 0.96 * k / 400);       // lower half, left to right
    const x = C[0] - R * Math.cos(t), y = C[1] + R * Math.sin(t);
    const g = groundY(x);
    if (g !== null && y >= g) arc.push([x, y]);
  }
  const svg = document.getElementById("slope-svg");
  const slip = document.getElementById("slip");
  const slices = document.getElementById("slices");
  const centre = document.getElementById("centre");
  const radius = document.getElementById("radius");
  const fsLabel = document.getElementById("fs-label");
  const fsValue = document.getElementById("fs-value");
  if (arc.length > 2) {
    slip.setAttribute("d", "M" + arc.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L"));
    // the sliding mass, shaded, and its slices
    const xa = arc[0][0], xb = arc[arc.length - 1][0];
    const top = [[xa, groundY(xa)]];
    ground.forEach((p) => { if (p[0] > xa && p[0] < xb) top.push(p); });
    top.push([xb, groundY(xb)]);
    const mass = document.createElementNS(NS, "path");
    mass.setAttribute("d", "M" + top.concat(arc.slice().reverse()).map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L") + " Z");
    slices.appendChild(mass);
    const n = 14;
    const yOnArc = (x) => {
      for (let i = 0; i < arc.length - 1; i++) if (x >= arc[i][0] && x <= arc[i + 1][0]) return arc[i][1] + (arc[i + 1][1] - arc[i][1]) * (x - arc[i][0]) / (arc[i + 1][0] - arc[i][0]);
      return null;
    };
    for (let k = 1; k < n; k++) {
      const x = xa + (xb - xa) * k / n;
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", x); l.setAttribute("x2", x);
      l.setAttribute("y1", groundY(x)); l.setAttribute("y2", yOnArc(x));
      slices.appendChild(l);
    }
    fsLabel.setAttribute("transform", `translate(${C[0]} ${C[1] - 6})`);
  }
  const len = slip.getTotalLength ? slip.getTotalLength() : 600;

  const countTo = (el, to, ms, decimals) => new Promise((done) => {
    const t0 = performance.now();
    const step = (t) => {
      const u = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - u, 3);
      el.textContent = (to * e).toFixed(decimals);
      if (u < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let playing = false;
  async function playSlope() {
    if (playing) return;
    playing = true;
    const lines = [...slices.querySelectorAll("line")];
    const mass = slices.querySelector("path");
    lines.forEach((l) => l.classList.remove("on"));
    mass && mass.classList.remove("on");
    fsLabel.classList.remove("on");
    centre.style.opacity = 0;
    fsValue.textContent = "0.000";
    if (reduce) {
      slip.style.strokeDasharray = "none";
      lines.forEach((l) => l.classList.add("on"));
      mass && mass.classList.add("on");
      centre.style.opacity = 1;
      fsLabel.classList.add("on");
      fsValue.textContent = "0.984";
      playing = false;
      return;
    }
    // the trial circles of a search: the radius sweeps, then the critical one is drawn
    slip.style.transition = "none";
    slip.style.strokeDasharray = `${len} ${len}`;
    slip.style.strokeDashoffset = len;
    centre.style.opacity = 1;
    const end = arc[arc.length - 1] || C;
    radius.setAttribute("x2", C[0]); radius.setAttribute("y2", C[1]);
    await wait(250);
    const t0 = performance.now();
    await new Promise((done) => {
      const step = (t) => {
        const u = Math.min(1, (t - t0) / 700);
        radius.setAttribute("x2", C[0] + (end[0] - C[0]) * u);
        radius.setAttribute("y2", C[1] + (end[1] - C[1]) * u);
        if (u < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
    slip.getBoundingClientRect();
    slip.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.45,0,.2,1)";
    slip.style.strokeDashoffset = 0;
    await wait(1500);
    mass && mass.classList.add("on");
    for (const l of lines) { l.classList.add("on"); await wait(55); }
    fsLabel.classList.add("on");
    await countTo(fsValue, 0.984, 1100, 3);
    playing = false;
  }
  const hero = document.querySelector(".slope");
  hero.addEventListener("revealed", () => setTimeout(playSlope, 300));
  hero.addEventListener("click", playSlope);
  hero.style.cursor = "pointer";
  hero.title = "Click to replay";

  // ---------------------------------------------------------------- counters
  document.querySelectorAll(".num b").forEach((b) => {
    const to = parseFloat(b.dataset.count), dec = parseInt(b.dataset.decimals || "0", 10), suf = b.dataset.suffix || "";
    const show = (v) => { b.textContent = v + suf; };
    if (reduce) { show(to.toFixed(dec)); return; }
    b.closest(".num").addEventListener("revealed", () => {
      const t0 = performance.now();
      const step = (t) => {
        const u = Math.min(1, (t - t0) / 1400);
        show((to * (1 - Math.pow(1 - u, 3))).toFixed(dec));
        if (u < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });

  // ---------------------------------------------------------------- the agent terminal
  // the recorded session on ACADS 1(a) (TigrimOS agent, five tool calls, 10.9 s)
  const script = [
    ["u", "› Build the ACADS 1(a) slope: soil 20 kN/m³, c′ 3 kPa, φ′ 19.6°; ground (20,25) (30,25) (50,35) (70,35); base 20; dry. Find the critical circle and report every method.\n\n"],
    ["t", "⚙ update_material", " {name: \"Soil\", unit_weight: 20, c: 3, phi: 19.6}"], ["ok", "  ✓\n"],
    ["t", "⚙ set_section", " {ground: [[20,25],[30,25],[50,35],[70,35]], base: 20}"], ["ok", "  ✓\n"],
    ["t", "⚙ set_water", " {method: \"none\"}"], ["ok", "  ✓\n"],
    ["t", "⚙ calculate", " {}"], ["ok", "  ✓ 1652 of 1830 trials converged\n"],
    ["t", "⚙ show_picture", " {kind: \"critical\"}"], ["ok", "  ✓\n\n"],
    ["r", "Critical circle: centre (29.64, 53.38), R 28.39 m\n"],
    ["f", "F = 0.984 Morgenstern–Price · 0.985 Bishop · 0.984 Spencer\n"],
    ["r", "The section is narrow at the toe; widen it?\n"],
  ];
  const term = document.getElementById("term");
  let termStarted = false;
  async function runTerm() {
    if (termStarted) return;
    termStarted = true;
    while (true) {
      term.innerHTML = "";
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      for (const item of script) {
        const [cls, a, b] = item;
        const span = document.createElement("span");
        span.className = cls;
        term.appendChild(span);
        term.appendChild(cursor);
        const text = a + (b || "");
        if (reduce) { span.textContent = text; continue; }
        const speed = cls === "u" ? 14 : cls === "t" ? 18 : 9;
        for (let i = 0; i < text.length; i++) {
          span.textContent += text[i];
          await wait(speed);
        }
        await wait(cls === "t" ? 380 : 120);
      }
      if (reduce) return;
      await wait(5200);
    }
  }
  document.querySelector(".terminal").addEventListener("revealed", runTerm);

  // ---------------------------------------------------------------- verification bars
  const rows = [
    ["ACADS 1(a)", 0.984, 0.986],
    ["Fredlund–Krahn", 2.073, 2.075],
    ["Arai–Tagyo 3 (non-circ.)", 1.094, 1.094],
    ["Pockoski–Duncan", 1.295, 1.300],
    ["LASH terminal", 1.169, 1.157],
    ["Bradwell (toe)", 1.756, 1.758],
    ["James Bay", 1.423, 1.464],
  ];
  const max = 2.3;
  const bars = document.getElementById("bars");
  rows.forEach(([name, tl, s2]) => {
    const r = document.createElement("div");
    r.className = "bar-row";
    r.innerHTML = `<span class="name">${name}</span>` +
      `<div class="track"><div class="fill tl" data-w="${(100 * tl / max).toFixed(1)}">${tl.toFixed(3)}</div></div>` +
      `<div class="track"><div class="fill s2" data-w="${(100 * s2 / max).toFixed(1)}">${s2.toFixed(3)}</div></div>`;
    bars.appendChild(r);
  });
  const fillBars = () => bars.querySelectorAll(".fill").forEach((f, i) => setTimeout(() => { f.style.width = f.dataset.w + "%"; }, reduce ? 0 : 60 * i));
  bars.addEventListener("revealed", fillBars);
})();
