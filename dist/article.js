(() => {
  // 1. Reading progress bar
  const progress = document.getElementById("read-progress");
  if (progress) {
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      progress.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  // 2. Font size comfort controls
  const storyBody = document.getElementById("story-body");
  const fontDec = document.getElementById("font-dec");
  const fontInc = document.getElementById("font-inc");
  if (storyBody && fontDec && fontInc) {
    let size = parseFloat(localStorage.getItem("wk-font-size") || "1.12");
    const applySize = () => {
      size = Math.min(1.4, Math.max(0.95, Math.round(size * 100) / 100));
      storyBody.style.setProperty("--story-size", `${size}rem`);
      try { localStorage.setItem("wk-font-size", String(size)); } catch {}
    };
    applySize();
    fontDec.addEventListener("click", () => { size -= 0.08; applySize(); });
    fontInc.addEventListener("click", () => { size += 0.08; applySize(); });
  }

  // 3. Interactive text highlighter
  const hlToggle = document.getElementById("hl-toggle");
  const hlClear = document.getElementById("hl-clear");
  if (storyBody && hlToggle && hlClear) {
    let hlActive = false;
    const syncClearBtn = () => {
      hlClear.hidden = storyBody.querySelectorAll("mark.hl-user").length === 0;
    };
    hlToggle.addEventListener("click", () => {
      hlActive = !hlActive;
      hlToggle.setAttribute("aria-pressed", String(hlActive));
      hlToggle.textContent = hlActive ? "🖍️ Highlighter: On (select text)" : "🖍️ Highlighter: Off";
      storyBody.classList.toggle("hl-mode", hlActive);
    });
    storyBody.addEventListener("mouseup", () => {
      if (!hlActive) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!storyBody.contains(range.commonAncestorContainer)) return;
      try {
        const mark = document.createElement("mark");
        mark.className = "hl-user";
        range.surroundContents(mark);
        sel.removeAllRanges();
        syncClearBtn();
      } catch {
        // Ignore cross-element partial selections safely
      }
    });
    hlClear.addEventListener("click", () => {
      storyBody.querySelectorAll("mark.hl-user").forEach((m) => {
        const parent = m.parentNode;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      });
      syncClearBtn();
    });
  }

  // 4. Live Global Gold Rate Widget
  const priceEl = document.getElementById("live-gold-price");
  const noteEl = document.getElementById("live-gold-note");
  const currButtons = [...document.querySelectorAll(".currency-tabs button")];
  if (priceEl && noteEl && currButtons.length) {
    let usdPerOz = 2650;
    let fx = { USD: 1, INR: 84.4, EUR: 0.94, GBP: 0.79, AED: 3.67 };
    let isLive = false;
    let currentCurr = "USD";

    const renderPrice = () => {
      const ozToGram = 31.1035;
      let formatted = "";
      if (currentCurr === "USD") {
        formatted = `$${usdPerOz.toLocaleString("en-US", { maximumFractionDigits: 2 })} / oz`;
      } else if (currentCurr === "INR") {
        const inr10g = (usdPerOz / ozToGram) * 10 * (fx.INR || 84.4);
        formatted = `₹${Math.round(inr10g).toLocaleString("en-IN")} / 10g`;
      } else {
        const perGram = (usdPerOz / ozToGram) * (fx[currentCurr] || 1);
        const sym = { EUR: "€", GBP: "£", AED: "AED " }[currentCurr] || "";
        formatted = `${sym}${perGram.toFixed(2)} / g`;
      }
      priceEl.textContent = formatted;
      noteEl.textContent = isLive
        ? "Live global spot benchmark (24K equivalent, before local taxes or making charges)."
        : "Reference global benchmark (connect online for live spot refresh; local taxes not included).";
    };

    currButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentCurr = btn.dataset.curr;
        currButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        renderPrice();
      });
    });

    Promise.all([
      fetch("https://api.gold-api.com/price/XAU").then((r) => (r.ok ? r.json() : null)),
      fetch("https://open.er-api.com/v6/latest/USD").then((r) => (r.ok ? r.json() : null))
    ])
      .then(([goldData, fxData]) => {
        if (goldData && typeof goldData.price === "number") {
          usdPerOz = goldData.price;
          isLive = true;
        }
        if (fxData && fxData.rates) {
          fx = fxData.rates;
        }
        renderPrice();
      })
      .catch(() => renderPrice());
  }

  // 5. Interactive 45-Year Gold History Chart
  const chartBox = document.getElementById("gold-history-chart");
  const readout = document.getElementById("history-readout");
  if (chartBox && readout) {
    const points = [
      { year: "1980", price: 850, dip: false, note: "1980 Peak ($850/oz) — Inflation panic & oil shock" },
      { year: "1982", price: 315, dip: true, note: "1982 Crash ($315/oz) — Volcker hikes rates near 20% (–63%)" },
      { year: "1999", price: 255, dip: true, note: "1999 Bottom ($255/oz) — End of the 20-year gold winter" },
      { year: "2008", price: 870, dip: false, note: "2008 ($870/oz) — Global financial crisis sparks safe-haven rush" },
      { year: "2011", price: 1920, dip: false, note: "2011 Peak ($1,920/oz) — Post-crisis QE & debt fears" },
      { year: "2015", price: 1050, dip: true, note: "2015 Slump ($1,050/oz) — Strong USD & tech boom (–45%)" },
      { year: "2020", price: 2070, dip: false, note: "2020 Peak ($2,070/oz) — Pandemic stimulus & zero rates" },
      { year: "2022", price: 1620, dip: true, note: "2022 Squeeze ($1,620/oz) — Fastest Fed rate hikes in 40 yrs (–21%)" },
      { year: "2024", price: 2780, dip: false, note: "2024 Surge ($2,780/oz) — Record central bank buying" },
      { year: "Now", price: 2650, dip: true, note: "Pullbacks — Profit-taking & rate/USD swings inside long uptrend" }
    ];

    const w = 720;
    const h = 260;
    const padX = 46;
    const padY = 26;
    const maxP = 3000;
    const coords = points.map((pt, i) => ({
      ...pt,
      x: padX + (i * (w - padX * 2)) / (points.length - 1),
      y: h - padY - (pt.price / maxP) * (h - padY * 2)
    }));

    const lineD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const areaD = `${lineD} L${coords[coords.length - 1].x.toFixed(1)},${h - padY} L${coords[0].x.toFixed(1)},${h - padY} Z`;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("class", "history-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Gold price history from 1980 to present showing major crashes and recoveries");

    svg.innerHTML = `
      <defs>
        <linearGradient id="wk-gold-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d49b27" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#d49b27" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="#dddae4" stroke-width="1"/>
      <path d="${areaD}" fill="url(#wk-gold-grad)"/>
      <path d="${lineD}" fill="none" stroke="#b88214" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${coords.map((c, idx) => `
        <g class="chart-node" data-idx="${idx}" tabindex="0" role="button" aria-label="${c.note}">
          <circle cx="${c.x}" cy="${c.y}" r="14" fill="transparent"/>
          <circle class="node-dot" cx="${c.x}" cy="${c.y}" r="5.5" fill="${c.dip ? "#c63d2f" : "#b88214"}" stroke="#fbfaf7" stroke-width="2"/>
          <text x="${c.x}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#535360">${c.year}</text>
        </g>`).join("")}
    `;
    chartBox.appendChild(svg);

    const showNote = (idx) => {
      const item = points[idx];
      if (!item) return;
      readout.textContent = item.note;
      readout.classList.toggle("is-dip", item.dip);
    };

    chartBox.querySelectorAll(".chart-node").forEach((node) => {
      const idx = Number(node.dataset.idx);
      node.addEventListener("mouseenter", () => showNote(idx));
      node.addEventListener("focus", () => showNote(idx));
      node.addEventListener("click", () => showNote(idx));
    });
  }

  // 6. Auto Language Translation (Google Translate Widget)
  const langSelect = document.getElementById("lang-select");
  if (langSelect) {
    const setCookie = (lang) => {
      document.cookie = `googtrans=/en/${lang}; path=/`;
    };

    const triggerTranslate = (lang) => {
      const combo = document.querySelector(".goog-te-combo");
      if (combo) {
        combo.value = lang;
        combo.dispatchEvent(new Event("change"));
      } else if (lang !== "en") {
        setCookie(lang);
        location.reload();
      }
    };

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element"
        );
      }
    };

    const gtScript = document.createElement("script");
    gtScript.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    gtScript.async = true;
    document.head.appendChild(gtScript);

    // Auto-detect browser language on first visit if user hasn't picked one
    const savedLang = localStorage.getItem("wk-lang");
    const browserLang = (navigator.language || "en").split("-")[0];
    const supported = [...langSelect.options].map((o) => o.value);
    if (!savedLang && browserLang !== "en" && supported.includes(browserLang)) {
      langSelect.value = browserLang;
      setCookie(browserLang);
    } else if (savedLang && supported.includes(savedLang)) {
      langSelect.value = savedLang;
    }

    langSelect.addEventListener("change", () => {
      const lang = langSelect.value;
      try { localStorage.setItem("wk-lang", lang); } catch {}
      if (lang === "en") {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
      } else {
        setCookie(lang);
        triggerTranslate(lang);
      }
    });
  }
})();
