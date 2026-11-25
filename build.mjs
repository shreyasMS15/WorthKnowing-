import { mkdir, rm, writeFile } from "node:fs/promises";
import { posts } from "./posts.mjs";

const dist = new URL("./dist/", import.meta.url);
const siteURL = new URL(process.env.SITE_URL || "https://worthknowing.pages.dev/");
const [featured] = posts;
const categories = [...new Set(posts.map((post) => post.category))];
const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
const siteName = "Worth Knowing";
const author = "Juniper Brief";

// Optional: Paste your Google AdSense Publisher ID (e.g. "ca-pub-1234567890123456") when approved.
const adsenseClient = "";

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

const storyURL = (post) => `/stories/${post.slug}/`;
const postMeta = (post) => `${escape(post.category)} <span aria-hidden="true">·</span> ${escape(post.readingTime)}`;
const dateTag = (date) => `<time datetime="${escape(date)}">${day.format(new Date(date))}</time>`;
const image = (post, eager = false) => `<img src="/images/${post.image}" alt="${escape(post.alt)}" width="${post.width}" height="${post.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const mark = `<span class="mark" aria-hidden="true"><span></span><span></span><span></span></span>`;

const widgetTemplates = {
  "live-rate": `
    <div class="widget live-rate-card" data-widget="live-rate">
      <div class="widget-head">
        <div>
          <span class="widget-eyebrow">Global Gold Benchmark (XAU)</span>
          <strong class="live-price" id="live-gold-price">Loading live spot…</strong>
        </div>
        <div class="currency-tabs" role="group" aria-label="Select currency">
          <button type="button" data-curr="USD" aria-pressed="true">USD / oz</button>
          <button type="button" data-curr="INR">INR / 10g</button>
          <button type="button" data-curr="EUR">EUR / g</button>
          <button type="button" data-curr="GBP">GBP / g</button>
          <button type="button" data-curr="AED">AED / g</button>
        </div>
      </div>
      <p class="widget-note" id="live-gold-note">Fetching global spot &amp; FX rates…</p>
    </div>`,
  "history-chart": `
    <figure class="widget chart-card" data-widget="history-chart">
      <figcaption class="widget-head">
        <div>
          <span class="widget-eyebrow">Interactive History · 1980–2026</span>
          <strong>45 Years of Gold Peaks, Crashes &amp; Comebacks (USD / oz)</strong>
        </div>
        <span class="chart-readout" id="history-readout">Hover or tap any point</span>
      </figcaption>
      <div class="chart-wrap" id="gold-history-chart"></div>
      <p class="widget-note">Notice how major drops (red markers) always look terrifying in the moment—and tiny a decade later.</p>
    </figure>`,
  "pattern-chart": `
    <figure class="widget pattern-card">
      <figcaption class="widget-head">
        <div>
          <span class="widget-eyebrow">Crash Anatomy</span>
          <strong>The 3 Gold Dip Patterns &amp; How Fast They Recover</strong>
        </div>
      </figcaption>
      <div class="pattern-grid">
        <div class="pattern-item">
          <span class="pattern-badge badge-fast">Pattern A · Liquidity Panic</span>
          <h4>Fast Drop, Fast Snapback</h4>
          <p class="pattern-stat">Avg. dip: <strong>–10% to –15%</strong> · Recovery: <strong>3–6 months</strong></p>
          <p class="pattern-desc">Example: March 2020. Traders sell everything for cash, then rush back in.</p>
        </div>
        <div class="pattern-item">
          <span class="pattern-badge badge-med">Pattern B · Rate-Hike Squeeze</span>
          <h4>Pressed Underwater</h4>
          <p class="pattern-stat">Avg. dip: <strong>–15% to –22%</strong> · Recovery: <strong>12–18 months</strong></p>
          <p class="pattern-desc">Example: 2022. High bond yields pressure gold until rate hikes pause.</p>
        </div>
        <div class="pattern-item">
          <span class="pattern-badge badge-slow">Pattern C · Post-Mania Hangover</span>
          <h4>The Long Winter</h4>
          <p class="pattern-stat">Avg. dip: <strong>–45% to –65%</strong> · Recovery: <strong>5–20 years</strong></p>
          <p class="pattern-desc">Example: 1980 &amp; 2011. Happens only when inflation cools AND stocks/bonds boom.</p>
        </div>
      </div>
    </figure>`
};

function renderAdSlot(slotNumber) {
  if (adsenseClient) {
    return `
    <aside class="ad-slot" aria-label="Advertisement">
      <span class="ad-label">Advertisement</span>
      <ins class="adsbygoogle"
           style="display:block; text-align:center;"
           data-ad-layout="in-article"
           data-ad-format="fluid"
           data-ad-client="${escape(adsenseClient)}"
           data-ad-slot="000000000${slotNumber}"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </aside>`;
  }
  return `
  <aside class="ad-slot ad-slot-clean" aria-label="Sponsored">
    <span class="ad-label">Sponsored · Non-intrusive slot #${slotNumber}</span>
    <p class="ad-placeholder-copy">Clean in-article ad space (zero popups, zero layout jump). Ready for Google AdSense when your domain is approved.</p>
  </aside>`;
}

function frame({ title, description, pathname, main, home = false }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fbfaf7">
  <meta name="description" content="${escape(description)}">
  <title>${escape(title)}</title>
  <link rel="canonical" href="${escape(new URL(pathname, siteURL).href)}">
  <link rel="icon" type="image/png" href="/icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  ${adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escape(adsenseClient)}" crossorigin="anonymous"></script>` : ""}
  ${home ? '<script src="/filter.js" defer></script>' : ""}
  <script src="/article.js" defer></script>
</head>
<body id="top"${home ? ' class="home-page"' : ' class="article-page"'}>
  ${home ? "" : '<div class="read-progress" id="read-progress" aria-hidden="true"></div>'}
  <a class="skip" href="#main">Skip to content</a>
  <header class="header">
    <div class="wrap header-inner">
      <a class="wordmark" href="/#top">${mark}${siteName}</a>
      <div class="header-right">
        <nav aria-label="Primary"><a href="/#latest">Articles</a><a href="/#about">About</a></nav>
        <div class="lang-box notranslate">
          <label class="sr-only" for="lang-select">Language</label>
          <select id="lang-select" aria-label="Translate page">
            <option value="en">🌐 English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="zh-CN">中文</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
            <option value="pt">Português</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
          </select>
          <div id="google_translate_element" class="sr-only" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  </header>
  ${main}
  <footer class="wrap footer">
    <a class="wordmark" href="/#top">${mark}${siteName}</a>
    <span>Published by ${author} · Big ideas, global money &amp; clear explainers</span>
  </footer>
</body>
</html>`;
}

const postCards = posts.map((post) => `
  <article class="card" data-topic="${escape(post.category)}">
    <a href="${storyURL(post)}" class="card-link">
      <div class="card-photo">${image(post)}</div>
      <div class="card-content">
        <div class="card-heading"><span class="topic">${escape(post.category)}</span><span>${escape(post.readingTime)}</span></div>
        <h3>${escape(post.title)}</h3>
        <p class="blurb">${escape(post.summary)}</p>
        <p class="card-date">${dateTag(post.updated ?? post.published)}</p>
      </div>
    </a>
  </article>`).join("");

const main = `<main id="main" class="wrap">
  <section class="intro" aria-labelledby="intro-heading">
    <h1 id="intro-heading">Things actually <em>worth knowing.</em></h1>
    <p>Sharp, funny, deeply researched explainers on global money, markets, and how the world works—written for curious humans everywhere.</p>
  </section>

  <section class="feature" aria-labelledby="featured-title">
    <div class="feature-copy">
      <p class="eyebrow">Featured deep dive · ${escape(featured.readingTime)}</p>
      <h2 id="featured-title">${escape(featured.title)}</h2>
      <p class="meta feature-meta">${postMeta(featured)}</p>
      <p class="feature-summary">${escape(featured.summary)}</p>
      <a class="button" href="${storyURL(featured)}">Read the 11-min story</a>
    </div>
    <div class="feature-photo">${image(featured, true)}</div>
  </section>

  <section class="latest" id="latest" aria-labelledby="latest-title">
    <div class="section-top">
      <h2 id="latest-title">Latest briefs</h2>
      <div class="filters" aria-label="Filter articles" role="group" hidden>
        <button type="button" data-category="all" aria-pressed="true">All</button>
        ${categories.map((category) => `<button type="button" data-category="${escape(category)}" aria-pressed="false">${escape(category)}</button>`).join("")}
      </div>
    </div>
    <p id="filter-status" class="sr-only" role="status"></p>
    <div class="cards">${postCards}</div>
  </section>

  <section class="about" id="about" aria-labelledby="about-title">
    <h2 id="about-title">About ${siteName}</h2>
    <div>
      <p>Just a guy who likes to explore, dig deep into how things actually work, and explain them simply to others.</p>
      <p class="author-bio" id="author">No jargon walls, no clickbait—just clear, entertaining reads with visual charts and instant translation so anyone around the world can jump right in.</p>
    </div>
  </section>
</main>`;

await mkdir(dist, { recursive: true });
await rm(new URL("stories/", dist), { recursive: true, force: true });

await writeFile(new URL("index.html", dist), frame({
  title: `${siteName} — Things actually worth knowing`,
  description: "Sharp, entertaining explainers on global money, gold markets, and how the world works.",
  pathname: "/",
  main,
  home: true
}));

let adCounter = 0;

for (const post of posts) {
  const directory = new URL(`stories/${post.slug}/`, dist);
  await mkdir(directory, { recursive: true });
  const related = post.related.map((slug) => postsBySlug.get(slug)).filter(Boolean);

  const sectionsHtml = post.sections.map((section) => {
    const paragraphs = section.paragraphs.map((p) => `<p>${p}</p>`).join("");
    const callout = section.callout
      ? `<div class="callout"><strong>${escape(section.callout.label)}</strong><p>${escape(section.callout.text)}</p></div>`
      : "";
    const widget = section.widget ? (widgetTemplates[section.widget] ?? "") : "";
    const ad = section.adAfter ? renderAdSlot(++adCounter) : "";
    return `<section><h2>${escape(section.heading)}</h2>${paragraphs}${callout}${widget}</section>${ad}`;
  }).join("");

  const postMain = `<main id="main" class="wrap story">
    <a class="back back-primary" href="/#latest">Back to briefs</a>
    <article>
      <header class="story-header">
        <p class="story-meta"><span class="topic">${escape(post.category)}</span> <span>${escape(post.readingTime)}</span></p>
        <h1>${escape(post.title)}</h1>
        <p class="story-summary">${escape(post.summary)}</p>
        <div class="story-byline">
          <span>By <a href="/#author">${author}</a></span>
          <span>Published ${dateTag(post.published)}</span>${post.updated && post.updated !== post.published ? `
          <span>Updated ${dateTag(post.updated)}</span>` : ""}
        </div>
      </header>
      <div class="comfort-bar notranslate" role="toolbar" aria-label="Reading tools">
        <div class="comfort-group">
          <span class="comfort-label">Text size</span>
          <button type="button" id="font-dec" aria-label="Decrease text size">A-</button>
          <button type="button" id="font-inc" aria-label="Increase text size">A+</button>
        </div>
        <div class="comfort-group">
          <button type="button" id="hl-toggle" aria-pressed="false">🖍️ Highlighter: Off</button>
          <button type="button" id="hl-clear" hidden>Clear mine</button>
        </div>
      </div>
      <div class="story-photo">${image(post, true)}</div>
      <div class="story-body" id="story-body">
        ${sectionsHtml}
      </div>
    </article>
    ${related.length ? `<nav class="related" aria-labelledby="related-title">
      <h2 id="related-title">Related briefs</h2>
      <ul>
        ${related.map((item) => `<li><a href="${storyURL(item)}"><span class="meta">${postMeta(item)}</span><strong>${escape(item.title)}</strong></a></li>`).join("")}
      </ul>
      <a class="back" href="/#latest">Back to briefs</a>
    </nav>` : `<div class="story-end-nav"><a class="back back-primary" href="/#latest">Back to Worth Knowing home</a></div>`}
  </main>`;

  await writeFile(new URL("index.html", directory), frame({
    title: `${post.title} | ${siteName}`,
    description: post.summary,
    pathname: storyURL(post),
    main: postMain
  }));
}

const sitemapEntries = [
  { pathname: "/" },
  ...posts.map((post) => ({ pathname: storyURL(post), modified: post.updated ?? post.published }))
].map(({ pathname, modified }) => `  <url>
    <loc>${escape(new URL(pathname, siteURL).href)}</loc>${modified ? `
    <lastmod>${escape(modified)}</lastmod>` : ""}
  </url>`);

await writeFile(new URL("sitemap.xml", dist), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join("\n")}
</urlset>
`);

await writeFile(new URL("robots.txt", dist), `User-agent: *
Allow: /

Sitemap: ${new URL("/sitemap.xml", siteURL).href}
`);
