# Worth Knowing (by Juniper Brief)

Static editorial site built for **https://worthknowing.pages.dev/** with zero npm dependencies.

| What to change | File |
| --- | --- |
| Add or edit articles | `posts.mjs` |
| Change site copy, AdSense ID, or templates | `build.mjs` |
| Change design & typography | `dist/style.css` |
| Interactive charts, live rate, highlighter & translation | `dist/article.js` |
| Upload to Cloudflare Pages | Contents of `dist/` (or `worthknowing-dist.zip`) |

## Deploy in 30 seconds (Drag & Drop)
1. In Cloudflare Dashboard (**Workers & Pages → Create → Pages → Drag and drop your files**), upload the `dist` folder (or `worthknowing-dist.zip`) and name the project **`worthknowing`**.
2. Your site goes live at `https://worthknowing.pages.dev/`.

## Deploy via GitHub (Auto-deploy on push)
1. Push this entire project folder to a GitHub repository.
2. In Cloudflare Dashboard (**Pages → Connect to Git**), select your repo.
3. Set **Build command** to `SITE_URL=https://worthknowing.pages.dev/ node build.mjs` and **Build output directory** to `dist`.

## Enable Google AdSense
1. Apply for AdSense once `worthknowing.pages.dev` is live.
2. Open `build.mjs`, paste your Publisher ID into `const adsenseClient = "ca-pub-XXXXXXXXXXXXXXXX";`, and update the `data-ad-slot` IDs.
3. Run `node build.mjs` and redeploy `dist/`.

## Local Preview
Run `py -m http.server 8080 --directory dist` and open `http://localhost:8080/`.
