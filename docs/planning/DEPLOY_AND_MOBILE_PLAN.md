# Skoracare — Git Deploy Plan + React Native App Plan

Repo: `github.com/Skora-websites/skora-pms` (branch `main`) · Deploy target: aaPanel (single persistent server, Node + Nginx + MySQL) · Live: https://pms.skorainfotech.com

---

# PART 1 — GIT DEPLOY PLAN (aaPanel)

## 1.1 Current state

- Branch `main` tracks `origin/main`, up to date with remote.
- Before this plan: `app/api/mobile/` (~70 route files across patient / doctor / admin / super + the
  emergency lifecycle) was **untracked**, so git-based deploys would not have included the mobile
  endpoints at all. That gap is now closed — the layer is committed, along with the `.gitignore`
  rules keeping `.perch/`, `AUDIT_REPORT.md` and `*.tmp.*` out of the repo, and this plan itself
  moved from the repo root into `docs/planning/`.
- Remaining local-only items (never deploy source): `.perch/`, `AUDIT_REPORT.md`.

## 1.2 One-time repo hygiene (local, before first deploy)

1. Delete `dbprobe.tmp.mts` (stray probe file).
2. Update `.gitignore`: add `.perch/`, `AUDIT_REPORT.md` (or commit the report if you want it in-repo), `*.tmp.*`.
3. Commit in two commits:
   - `chore: ignore perch workspace + audit artifacts` (.gitignore, .perch/)
   - `feat(mobile): JSON API layer for native clients (doctor/patient/admin/super + emergency lifecycle)` (app/api/mobile/)
4. Push to `origin/main`.

## 1.3 Server layout (aaPanel)

```
/www/wwwroot/skoracare/          # app root (git clone of skora-pms)
  .env                           # production env (NEVER in git)
  uploads/                       # local upload dir (see 1.6 backups)
```

- Node 20+ via aaPanel Node project manager or nvm.
- PM2 process: `pm2 start npm --name skoracare -- start`, then `pm2 save` + `pm2 startup` for reboot survival.
- Nginx site (aaPanel) proxying to the Next.js port (default 3000).

## 1.4 Nginx config — SSE-critical

The emergency stream (`/api/doctor/sos/stream`) dies silently with default proxy buffering. Add to the site's nginx location block:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # SSE: no buffering, long read timeout (emergency stream is long-lived)
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    client_max_body_size 25m;   # uploads (photos, consent files, videos)
}
```

Reload: `nginx -t && nginx -s reload` (or via aaPanel UI).

## 1.5 First deploy (from git, replacing the copy-paste flow)

```bash
cd /www/wwwroot
git clone https://github.com/Skora-websites/skora-pms.git skoracare
cd skoracare
cp .env.example .env          # then fill production values (see 1.7)
npm ci
npm run db:migrate            # ordered migration runner, tracks state
npm run build
pm2 start npm --name skoracare -- start
pm2 save
```

Verify: `curl https://pms.skorainfotech.com/api/health` → `{"status":"ok","checks":{"database":"up"}}`.

## 1.6 Ongoing update flow (replaces manual file re-import + .sql)

```bash
cd /www/wwwroot/skoracare
git pull origin main
npm ci                        # only if package-lock changed
npm run db:migrate            # NEVER manual .sql import — the runner tracks applied migrations
npm run build
pm2 restart skoracare
```

**Stop importing .sql files by hand.** The repo has 24 ordered migrations and a runner (`npm run db:migrate`, `--status` to check). Manual imports can double-apply or skip migrations and desync the schema from the code. If a one-off data fix is needed, write it as migration `0024_xxx.sql` and commit it.

Rollback: `git checkout <previous-sha> && npm run build && pm2 restart skoracare` (migrations are forward-only; keep them additive).

## 1.7 Production `.env` checklist

- `DATABASE_URL` → production MySQL (not localhost dev), `DB_SSL=true` if managed DB.
- `AUTH_SECRET` (strong random, `openssl rand -hex 32`) — app refuses to start without it.
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — required for SOS web push.
- `NEXT_PUBLIC_APP_URL=https://pms.skorainfotech.com`.
- SMTP/mail keys if configured.
- File perms: `chmod 600 .env`.

## 1.8 Production readiness on aaPanel

1. **PM2 + reboot survival** (above).
2. **Cron for SOS expiry:** aaPanel cron every minute: `curl -s https://pms.skorainfotech.com/api/cron/expire-sos` (add this endpoint wrapping `lib/dispatch/expiry.ts` if not present) so stale pending requests are cleaned without relying on patient polling.
3. **Backups (daily, off-server):** aaPanel backup job for (a) MySQL dump, (b) the `uploads/` directory. Uploads live outside the DB — a .sql restore does not restore consent files/photos.
4. **Logs:** `pm2 logs skoracare` + log rotation (`pm2 install pm2-logrotate`).
5. **Firewall:** only 80/443 public; MySQL (3306) never exposed.
6. **HTTPS:** aaPanel SSL (Let's Encrypt) on, force-redirect.
7. **Health monitoring:** uptime monitor on `/api/health` with alerting.

## 1.9 Branch strategy (lightweight, solo-friendly)

- `main` = deployable production. Deploy = `git pull` on server.
- Feature branches (`feat/mobile-push`, `feat/rn-api-v1`) merged via PR even solo — cheap review, keeps main green.
- Tag releases: `git tag v1.0.0 && git push --tags` before each server update, so rollback has a named point.

---

# PART 2 — REACT NATIVE APP PLAN (Expo, iOS Liquid Glass UI, Skora theme)

## 2.1 Design system — extracted from the live web app (`app/globals.css`)

The app inherits the exact web palette. No redesign, brand continuity for free.

**Brand (forest green):** 50 `#f1f5f3` · 100 `#dcebe4` · 200 `#c2d8cf` · 300 `#a2c5b5` · 400 `#6ba48c` · 500 `#3f7d5f` · 600 `#2a5f45` · **700 `#114232` (primary CTA)** · 800 `#0e382b` · 900 `#0b2d23` · 950 `#071e17`

**Accent (mint):** 400 `#4dd69c` · **500 `#1fd186` (live/active indicators)** · 600 `#14b571` · 700 `#109a60`

**Neutrals (slate-green):** 50 `#f8faf9` · 100 `#eef1ef` · 200 `#e2e7e4` · 400 `#9da4a0` · 600 `#525a56` · 900 `#141716`

**Emergency red:** web uses `type: "error"` toasts for SOS — mirror with a dedicated `sos` token (recommend `#dc2626` family) since emergency UI must never be subtle.

**Typography:** Plus Jakarta Sans (web `--font-jakarta`) — load via `expo-font`; Geist Mono for numbers/OTP.
**Shape:** pill buttons (999px radius), large card radii (up to 2rem), soft shadows — matches the web's `rounded-full` CTA language.

## 2.2 iOS Liquid Glass UI/UX approach (modern but professional)

Liquid Glass = Apple's iOS 26 material: translucent, refractive surfaces with specular highlights. Practical implementation in React Native today:

- **Stack:** Expo SDK 54+, `expo-blur` (`BlurView` with `systemChromeMaterial` / `ultraThinMaterial`) for glass surfaces; `expo-linear-gradient` for specular edge highlights; `react-native-reanimated` 3 for spring physics; `@react-native-community/blur` only if BlurView falls short on Android fallbacks.
- **Glass recipe per surface:** background `BlurView` (intensity 40–80, tint per light/dark) + 1px inner border at 8–15% white opacity + subtle top-edge gradient highlight + content on opaque layers for legibility. Never put body text directly on glass over busy content.
- **Where glass goes (professional restraint):** tab bar, floating SOS trigger button, top navigation bar, incoming-SOS doctor alert card, modals/sheets. **Where it doesn't:** patient data lists, forms, charts — those stay opaque slate-50/white for clinical readability. Glass is chrome, not content.
- **SOS moment design:** full-screen takeover, deep forest `#071e17` background, pulsing accent-500 ring on the live tracker, glass status card showing doctor assignment/ETA/OTP. This screen is the brand moment — calm, high-contrast, zero clutter.
- **Dark mode:** brand-950 `#071e17` base, glass tint dark, accent-400 for interactive elements. Ship both from day one; the palette is already built for it.
- **Android fallback:** BlurView degrades gracefully — pre-render translucent solid colors (brand-800 at 85% opacity) behind a feature flag so Android looks intentional, not broken.
- **Motion:** spring-based (reanimated, stiffness ~200, damping ~20) for sheet present, SOS ring pulse (loop), tab transitions. Respect `prefers-reduced-motion`.

## 2.3 Architecture

- **Expo (dev builds, EAS)** — not bare RN. OTA updates via EAS Update for JS-only fixes.
- **Expo Router** (file-based, role-based route groups: `(patient)`, `(doctor)`, `(auth)`).
- **TanStack Query** for all `app/api/mobile/*` consumption (polling intervals per screen).
- **Zustand** for client state, **MMKV** for fast local storage, **expo-sqlite** only if offline queue proves needed (defer).
- **Monorepo optional:** keep the RN app in a sibling repo/folder (`skora-mobile/`) — the web repo stays clean; shared logic is minimal since the API already encapsulates it.

## 2.4 Screens by role (mapping to existing API)

**Auth:** login (`POST /api/mobile/session`), role-based redirect (`homePathForRole` logic mirrored client-side).

**Patient:** home (`mobile/patient/home`), doctors list/booking (`mobile/patient/doctors`, `appointments`), prescriptions/records/reports, **SOS trigger + live tracker** (`mobile/emergency/requests` + poll `status` every 2–3s), emergency history.

**Doctor:** home, schedule/appointments, patients, **on-duty toggle + live SOS feed** (SSE via `doctor/sos/stream` with reconnect, fallback poll `mobile/doctor/*`), accept → navigate (turn-by-turn later) → arrive → OTP verify → complete → rating flow, chat, income/expense.

**Admin (phase 2):** the `mobile/admin/*` tree exists; ship patient + doctor apps first.

## 2.5 Emergency feature in the app (the core differentiator)

1. **Trigger:** hold-to-confirm SOS button (1.5s press, haptic + countdown ring) — prevents pocket triggers. Captures GPS (`expo-location`, foreground) + optional complaint text + auto-attaches patient context.
2. **Live tracker:** poll `/api/mobile/emergency/requests` status; show doctor assigned, distance, arrival, OTP screen for handoff. Pulsing accent-500 ring = "live".
3. **Doctor side:** FCM high-priority push (see 2.6) + in-app sound/vibration loop until acknowledged; accept/decline race handled server-side already (atomic claim).
4. **Offline behavior:** SOS trigger retries on network loss (exponential backoff, local queue of 1 — the SOS itself); non-emergency actions show "will sync" states. Server stays authoritative.
5. **Wake lock** on the doctor emergency screen (web already has `components/sos/use-wake-lock.ts` — mirror with `expo-keep-awake`).

## 2.6 Native push (the audit's biggest gap — build first)

- Expo Notifications → FCM (Android) / APNs (iOS). New `device_tokens` table (user_id, platform, token, updated_at) + `lib/push/native.ts` sender alongside `web-push`.
- Wire into `announceSosToDoctors` (hub.ts) as a fourth channel: SSE + in-app + web-push + **FCM**.
- Android onboarding step: battery-optimization exemption request (killed app = dead push otherwise). Critical alert entitlement on iOS for SOS.
- Backend work estimate: 3–5 days. Do this before the app UI — both platforms depend on it.

## 2.7 Build order (6–7 weeks)

| Phase | Weeks | Work |
|---|---|---|
| 0 | now | Commit mobile API (Part 1), deploy current state to aaPanel via git flow |
| 1 | 1 | Backend: FCM device tokens + native push sender + cron expiry endpoint |
| 2 | 1–2 | Expo app skeleton: auth, role routing, theme system (tokens above), glass component kit |
| 3 | 2–4 | Patient app: home, doctors, booking, records |
| 4 | 3–4 | Doctor app: schedule, patients, on-duty, chat |
| 5 | 4–5 | Emergency UX both sides: SOS trigger, tracker, accept/arrive/OTP/complete, FCM wiring end-to-end |
| 6 | 5–6 | Polish: dark mode, haptics, offline states, Android blur fallback, reduced-motion |
| 7 | 6–7 | Beta (TestFlight + Play internal track) with real clinics; fix field bugs; store submission |

## 2.8 Risks

- **Liquid Glass on Android:** no native equivalent material — the solid-translucent fallback keeps it professional, not broken.
- **Push in killed apps:** the battery-optimization onboarding flow is not optional; test on Xiaomi/Samsung/Oppo aggressively (aggressive OEM killers).
- **SSE on mobile:** backgrounded apps kill streams — FCM is the primary doctor alert channel; SSE only enriches while foregrounded.
- **Store review:** medical app — prepare demo accounts, privacy policy, and (if India) be ready for health-app questions. Start Apple developer account now if not active.

## 2.9 What NOT to do

- Don't move data to Firestore — the dispatch correctness is relational (atomic accepts, unique offers); MySQL stays.
- Don't rebuild the mobile API — it exists; consume it.
- Don't put glass material on clinical data surfaces.
- Don't deploy from manual file copies — the git flow in Part 1 replaces it permanently.
