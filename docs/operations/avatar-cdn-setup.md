# Avatar CDN Setup (Cloudflare R2)

> **Why this exists.** `/public/12 avatar/` ships 46MB of archetype PNGs (24 files × ~2MB). Vercel Hobby caps outbound bandwidth at 100GB/month with no overage option — when the ceiling is hit, deployments and function executions stop. With thesis recruitment incoming (real users loading avatars on the report page), ~2k unique visits with full asset loads would exhaust the quota and halt the platform mid-collection. Cloudflare R2 gives 10GB storage + **unlimited free egress**, which absorbs the entire avatar workload without cost or risk.

## What's in code already

The platform reads `NEXT_PUBLIC_AVATAR_CDN_BASE` at runtime and `NEXT_PUBLIC_AVATAR_CDN_HOST` at build time:

- When **set**: avatars load as `.webp` from `${BASE}/<Name>-<gender>.webp`
- When **unset**: avatars fall back to local `/12 avatar/<Name>-<gender>.png`

Local fallback keeps preview / staging working without R2 setup. Production should always have both env vars set.

## Setup steps (one-time, ~20 minutes)

### 1. Sign up for Cloudflare R2

1. Create a Cloudflare account if needed (free)
2. Enable R2: Cloudflare dashboard → R2 Object Storage → Get Started
3. R2 free tier: 10GB storage, 10M Class A ops/month, 1M Class B ops/month, **unlimited egress**

### 2. Create the bucket

1. R2 dashboard → Create bucket → name it `deepdive-avatars` (or your preference)
2. Region: leave as default (Cloudflare auto-routes)
3. Click into the bucket → Settings → Public access → enable "R2.dev subdomain"
   - This gives you a temporary public URL like `https://pub-abc123.r2.dev`
   - For production: bind a custom domain (e.g. `cdn.deepdive.io`) under Settings → Custom domains

### 3. Convert PNG → WebP locally

From the repo root:

```bash
# Install cwebp (one-time)
brew install webp        # macOS
# OR: sudo apt install webp   # Linux

# Convert all 24 PNGs at quality 82
./scripts/convert-avatars-to-webp.sh
```

Output: `dist/avatars-webp/<Name>-<gender>.webp` (~12MB total, ~70% reduction).

### 4. Upload WebPs to R2

Two options:

**Option A — Cloudflare dashboard (easiest, 24 files)**

R2 dashboard → bucket → Upload → drag the entire `dist/avatars-webp/` folder. Make sure final paths are flat (no nested folders): the URL should be `${BASE}/Architect-female.webp`, not `${BASE}/avatars-webp/Architect-female.webp`.

**Option B — `rclone` (scriptable, idempotent)**

```bash
# One-time: configure rclone with R2 S3-compatible creds
# (R2 dashboard → Manage R2 API Tokens → Create API token → S3 Auth)
rclone config

# Upload (use the remote name you configured)
rclone copy dist/avatars-webp/ <remote>:deepdive-avatars/ --progress
```

### 5. Verify a single avatar loads

```bash
curl -I https://<your-cdn-base>/Architect-female.webp
# Expect: HTTP/2 200, content-type: image/webp
```

If 403: bucket is still private — re-enable R2.dev subdomain or custom domain binding.

### 6. Wire env vars

Local `.env.local`:

```
NEXT_PUBLIC_AVATAR_CDN_BASE=https://pub-abc123.r2.dev
NEXT_PUBLIC_AVATAR_CDN_HOST=pub-abc123.r2.dev
```

Vercel: Project → Settings → Environment Variables → add both for **Production** and **Preview** (the `HOST` one is read at build time, the `BASE` one at runtime — both need to be present in the env where the build runs).

Trigger a redeploy (the `HOST` value bakes into `next.config.mjs` at build time).

### 7. Verify in the browser

After deploy, open a report page in DevTools → Network:

- Avatar requests should hit `https://<your-cdn-base>/...webp`, not `/12 avatar/...png`
- Status 200, type `image/webp`
- Vercel Analytics → Bandwidth should plateau (R2 traffic doesn't count)

## Rollback

If R2 misbehaves, unset `NEXT_PUBLIC_AVATAR_CDN_BASE` in Vercel and redeploy. The runtime fallback serves local PNGs again. Bandwidth risk returns — treat as emergency-only.

## Notes

- `dist/avatars-webp/` is `.gitignore`d (build artifact)
- The local `/public/12 avatar/*.png` stays in the repo as fallback; do not delete until R2 has run for 30+ days without issue
- The bucket only needs to be public-read; no listing required. Cloudflare blocks bucket listing by default.
