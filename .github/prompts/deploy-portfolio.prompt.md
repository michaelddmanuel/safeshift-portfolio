# Playbook: ship an Expo app + site to GitHub & Vercel as shareable portfolio links

## Goal
Turn a local project into public links: a GitHub repo, the Expo app running on the web (so anyone can use it with no install), and - if there is a marketing/site - a "live preview" page that embeds the app inside a phone frame.

## Core concept
A native app has no URL - it runs on the device. So the trick is: export the Expo app to web and deploy that static build to Vercel. Then optionally embed it in an iframe inside a phone-shaped frame on a site page. Result = one link, no install, works on any phone or laptop. (iOS native installs need a paid Apple Developer account; the web route avoids that.)

## Preconditions - check before doing anything
```bash
git rev-parse --is-inside-work-tree 2>/dev/null || echo "not a repo"
gh auth status            # must be logged in to push/create repos
vercel whoami             # must be logged in to deploy
node -v && pnpm -v        # or npm/yarn
```
If gh or vercel is not authenticated, stop and ask the user to run gh auth login / vercel login themselves.

## Step 1 - Recon the project
Determine the shape:
- Standalone Expo app (has app.json/app.config.* + expo dep), or
- Monorepo (for example: apps/mobile Expo + apps/web Next.js + shared packages/*).

Confirm the Expo app is web-compatible (Expo Go / RN-Web-safe libs). If it depends on custom native modules, the web build will not include those features.

## Step 2 - Git -> GitHub
```bash
git init -q && git add -A
# SAFETY: verify no junk is staged
git diff --cached --name-only | grep -cE 'node_modules|\.next/|/dist/|\.expo/|/out/'   # must be 0
git commit -q -m "<project>: initial commit"
git branch -M main
gh repo create <PROJECT_NAME> --public --source=. --remote=origin --push \
  --description "<one-liner>"
```
Make sure .gitignore excludes node_modules, .next, out, dist, .expo, .env*.

## Step 3 - Deploy the Expo app to the web (the runnable app)
```bash
cd <expo-app-dir>          # e.g. apps/mobile
rm -rf dist && npx expo export --platform web    # -> dist/ static SPA
# Deploy from a cleanly named copy so the Vercel project gets a good name:
rm -rf /tmp/<PROJECT>-app && cp -r dist /tmp/<PROJECT>-app
cd /tmp/<PROJECT>-app && vercel deploy --prod --yes
```
Grab the aliased URL it prints (for example: https://<PROJECT>-app.vercel.app).

## Step 4 - If there is a Next.js site, configure static export
Use static export to avoid monorepo workspace-resolution pain in Vercel CLI uploads.

next.config.mjs:
```js
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["<shared workspace pkgs>"],
};
export default nextConfig;
```

public/vercel.json (so /app, /demo resolve; static export writes app.html):
```json
{ "cleanUrls": true, "trailingSlash": false }
```

Live-preview page should read app URL from NEXT_PUBLIC_APP_URL and embed it in an iframe in a phone frame, with size toggle + reload + fullscreen open.

## Step 5 - Build & deploy the site
```bash
# Stop any running next dev / expo start FIRST.
NEXT_PUBLIC_APP_URL="<APP_URL from step 3>" pnpm --filter <web-pkg> build   # -> out/
rm -rf /tmp/<PROJECT>-site && cp -r <web-dir>/out /tmp/<PROJECT>-site
cp <web-dir>/public/vercel.json /tmp/<PROJECT>-site/vercel.json
cd /tmp/<PROJECT>-site && vercel deploy --prod --yes
```

## Step 6 - Verify
```bash
for u in "<SITE_URL>/" "<SITE_URL>/app" "<SITE_URL>/demo" "<APP_URL>/"; do
  curl -s -o /dev/null -w "%{http_code}  $u\n" "$u"; done
curl -s "<SITE_URL>/app" | grep -o "<APP_URL>"
```
All expected URLs should return 200 and iframe target should not be localhost.

## Gotchas to avoid
- Never run next build while next dev is running against the same .next output.
- Async/background shells can reset cwd to repo root; prefer pnpm --filter <pkg> exec <cmd>.
- Raw static deploys need cleanUrls or /app can 404.
- Expo web export uses absolute /_expo/... paths; serve at domain root unless baseUrl is configured.
- Vercel CLI from a monorepo subdir usually misses workspace deps; static export folder deploy avoids this.
- Check iframe embeddability headers if embedding third-party app hosts.
- Use the aliased Vercel URL, not only per-deployment hash URLs.

## Optional long-term setup
Connect repo to Vercel for auto-deploy:
- One project for app web export (output dist)
- One project for web site (Next.js)
- Set NEXT_PUBLIC_APP_URL in site project env

## Deliverables to return
- GitHub repo URL
- Site URL
- Site /app URL (phone preview)
- Site /demo URL
- Raw app URL
- Any trademark/logo visibility warning before public repo release
