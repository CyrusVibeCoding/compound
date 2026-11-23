# Little City · 0.12

A phone-first city built with real effort. Finish tasks, study, earn cash, place homes, and watch residents visit the park. White background, naturally colored models, transparent 3D canvas, and a permanently visible horizonless grid.

**Play:** https://cyrusvibecoding.github.io/compound/?v=little-city-shops-12

![Basic house, big house, park, boy and girl models](models/city/preview.png)

## The first city

New cities start with **$40**, enough for a basic house. Tap Build, choose a building from the scrolling catalog, and tap open ground. A valid drop buys it. Tap Edit to move buildings; tap one in Edit mode to rotate or store it. Tap Done to return to safe camera panning. Layout undo keeps purchased ownership; stored homes pause their residents and rent.

| Building | First price | Residents | Automatic rent |
|---|---:|---:|---:|
| Basic house | $40 | 1 | $2/hour |
| Big house | $120 | 3 | $6/hour |
| Pocket park | $30 | — | — |
| Café | $100 | — | — |

Each additional building of the same type costs 20% more, rounded up. Rent is added directly to cash using elapsed time, including while away. No collection button, upkeep, streaks, energy, or missed-day penalties. Moving a home never duplicates rent; placing/storing/undoing settles the previous layout first.

Finishing a task earns **$20 once**. A completed 5/10/25-minute study session pays **$2 per minute**, claimed once. Choosing Finished task adds the task reward if still unfinished. Made progress keeps the task open; Keep going claims the completed session and starts another. Study tracks elapsed timestamps while the phone is locked. Task notes, subtasks, custom projects, Today selection, progress notes, and next-step history remain available.

Boy and girl residents have distinct low-poly models and articulated walking limbs. They walk around houses to park destinations, pause there, and return home. Without a park they take neighborhood walks. Routing uses a bounded grid search only when layouts change; homes and park furniture are obstacles. The visible crowd is capped at 32 for mobile rendering; all placed homes still count for population and rent. Calmer effects and system reduced motion freeze residents and remove spring placement/particles.

The city contains homes, a park, and a café with a striped awning and outdoor tables. Residents alternate visits between placed parks and cafés. Factory skill-tree content is future work. The retired factory upgrade, energy, invention, material, finish, and collection screens have been removed.

## Run

Node 20.19+ or 22.12+:

```sh
npm ci
npm run dev
npm test
npm run build
```

Source is on `main`; GitHub Pages serves the built `dist/` files from `gh-pages`. Keep `.nojekyll` when deploying. The generated service worker versions its cache using the complete build and models. Existing sessions get an update notice.

## Models

Editable Blender sources are in `models/city/`:

- `house.blend`: gabled cottage, stoop, windows, chimney, planters.
- `big-house.blend`: two-storey home, side wing, balcony, porch.
- `cafe.blend`: plaster shop, teal roof, striped awning, cup sign, and two patio tables.
- `park.blend`: fountain, benches, trees, lamp.
- `boy.blend`, `girl.blend`: stylized residents, named shoulder/hip pivots.

Runtime GLBs are in `public/models/`. Rebuild with Blender 4.3+:

```sh
blender -b --python scripts/build_city_models.py
```

Editable sources retain separate objects. Runtime export batches meshes by material/parent: 5–6 meshes per building and 10 per character, each GLB below 250 KB. Models have no large textures, skeleton solver, or physics dependency. Original factory `.blend` files remain as source archives; their GLBs are removed from the app. `scripts/build_factory_models.py` is the archived factory generator, not the city build step.

## Saves and migration

City saves use `compound-city-v1`, with a previous valid snapshot at `compound-city-v1-backup`. The separate key prevents an old factory tab from overwriting the city. Recovery checks city primary, city backup, `compound-v2`, `compound-v2-backup`, and `compound-v1`, in that order.

Old factory saves migrate once:

- Core → basic house; Press → big house; Assembler → park.
- Existing object IDs, placements, rotations, and layout undo remain intact.
- Matter + stored production + Charge become cash. Retired machine upgrades receive cash credits using their former upgrade prices.
- Tasks, subtasks, notes, projects, active study sessions, focus history, and next-step notes stay intact.
- A `legacyFactory` snapshot of the original save stays in city exports. Migration details and the upgrade credit appear in Settings.
- Rent starts at migration, without inventing pre-city earnings.

Settings includes autosave status, manual save, export/import, Calmer effects, How to play, and a confirmed full reset. Reset replaces city and legacy recovery slots with fresh city state so erased progress cannot return through recovery. Export first to keep a copy. Other apps' storage is untouched; failed resets attempt to restore overwritten values. Import updates live state and the page-hide snapshot before another navigation can overwrite it.

Data stays in the browser. Export before changing devices or clearing storage. There is no server sync, notification system, or sound.

## Verification

38 tests cover cash rewards/replay protection, study outcomes, purchases, failed drops, ownership/rotation/layout undo, finite rent accounting and backwards clocks, offline equivalence, resident routes, invalid backups, legacy migration/refunds, save isolation/recovery, reset rollback, import, and GLB size/joint/draw-call budgets.

Mobile Chromium checks at 390 × 844 cover city model loading, resident totals, offline rent, actual tray drag purchases without text selection, task/study cash, the guide, calmer effects, migration, reset cancel/confirm, legacy import, and reload persistence. Physical iPhone 12/Safari gestures, Home Screen behavior, and frame rate remain unmeasured.

City color pass: warm cream cottage with terracotta roof, sage-blue large home with slate-blue roof, green lawns/trees, wood benches, blue fountain water, and residents with skin tones, brown hair, blue/coral clothing. Both Blender sources and GLBs use the same semantic materials. White canvas and grid remain.

## Café and Edit update

Header uses an opaque isolated compositor layer; navigation no longer uses a backdrop blur. Existing building gestures are attached only in Edit mode. New purchases and stored items can still be placed from the tray in normal mode.

Run `CITY_ASSET=cafe blender -b --python scripts/build_city_models.py` to regenerate only the café. The café adds no rent, residents, upkeep, or new currency; its first price is $100 and follows the existing price increase.

Café update validation: all 24 unit tests and the production build pass. Mobile Chromium at 390 × 844 checks the four-card tray, normal touch panning over a house, Edit-mode touch movement, undo, and café interactions. Physical iPhone Safari rendering still needs a device check.

## Pages first version

Pages adds searchable text notes with editable headings, paragraphs, bullet lists, and checklists. Blocks can be reordered. Pages optionally belong to a project; Projects is accessible from Pages. Archive and restore keep writing recoverable. Notes do not reward cash.

Notes autosave after a short typing pause and on leaving; current notes are included in JSON exports/imports. Older backups migrate with an empty page collection. Reset clears pages too. Browser storage is finite; this version has no account or cross-device sync.

The staged implementation plan is in [docs/pages-plan.md](docs/pages-plan.md). Calendar and task deadlines are planned next.

Validation: 28 unit tests, production build, and mobile Chromium 390 × 844 checks for editing/reordering blocks, checklist state, body search, project filters, archive/restore, reload, project navigation, JSON export/import, and no horizontal overflow. Physical iPhone keyboard/Safari behavior still needs a device check.

## Calendar and linked tasks

Task details now include an optional date-only deadline and a linked Page. Calendar shows a Monday-first month grid and selected-day agenda, with task creation on the selected date. Counts show unfinished tasks; the agenda retains completed tasks. Dated tasks are the same task records used by Today and Pages. No duplicate rewards or calendar task copies.

Today includes manually chosen tasks and tasks due today, once each. Past-due tasks have a separate filter; no penalties or automatic rescheduling. Setting or clearing a deadline preserves manual Today selection. Future calendar tasks do not automatically enter today's list. Dates use local calendar days, with no UTC conversion.

Pages show associated tasks and can create them. Task details can link/unlink an existing task and open its page. Archived pages keep their links; tasks remain editable independently. Older saves without deadline/page fields remain supported. Backups preserve both fields.

Validation: 34 unit tests, production build, and mobile Chromium 390 × 844 flow covering schedule/reschedule/clear, month navigation, Today/past-due, page-created tasks, links in both directions, completed agenda, cash-once behavior, persistence, and horizontal layout. Date tests cover leap years, year boundaries, and DST/local dates in Los Angeles, Auckland, and Tokyo. Physical iPhone Safari/keyboard still needs device testing.

## Build shop and resident sales (0.12)

The former building tray is replaced by Build, opening a two-column catalog with All, Homes, Shops, and Outdoors categories. The catalog scrolls vertically and uses thumbnails rendered from the Blender sources. Choose a building and tap the map; payment occurs only on valid placement. Stored buildings return for free and retain their price history.

Bakery: $90 initially, no residents/rent, warm plaster, bread display and loaf sign. Editable source and GLB are included. Regenerate with `CITY_ASSET=bakery blender -b --python scripts/build_city_models.py`; regenerate thumbnails with `blender -b --python scripts/render_shop.py`.

Resident arrival at a café or bakery can produce a $4/$3 sale and a floating popup over that shop. Each shop and each resident has a persisted ten-minute interval between paid purchases. Repeat callbacks, reloads, stored/replaced shops, and backwards clocks cannot bypass the interval. Other visits are browsing. Paid sales require a placed home, valid resident, placed shop, and reachable route. Unreachable destinations are skipped. Parks remain free.

Shop sales happen only while the visible city is running and pause when the Build catalog is open. No offline sales are invented. Automatic offline home rent is unchanged. Calmer effects stop walking but retain visit timing/income. Shop income never counts as cash from real work. Commerce timestamps are included in backups and cleared on reset; older backups remain accepted.

Validation: 38 unit tests, production build, GLB size/draw-call checks, and mobile Chromium 390 × 844 checks for actual touch scrolling, category filters, choosing/placing a bakery, cancel without spending, café/bakery payouts, floating cash, persistence, and no horizontal overflow. Physical iPhone Safari still needs device validation.

## Update recovery (0.12.1)

An already-open installed app can retain the older JavaScript screen even after deployment. A new published-release check runs on load, return to foreground, and periodically. Settings shows the loaded release, Check for updates, and Save and update. The update saves current state first and navigates to the same app path with a unique query parameter to bypass stale navigation caches. Save failure blocks navigation and keeps export available. No localStorage or progress is cleared. Service-worker update-check requests bypass its offline cache so an offline response cannot masquerade as a current release.

Validation: 40 unit tests and production build; mobile browser test covers latest/new release detection, bakery visibility, blocked update on save failure, fresh navigation, and writing preserved after updating. Users on the older screen must first reload/reopen the installed app or load the fresh release URL to receive this updater.


## Visible visits and little outings (0.13)

Residents pause for four seconds facing shop entrances. Eligible purchases trigger the existing sale popup and a small takeaway cup or paper bread bag carried until home. Browsers remain empty-handed. Errands alternate with simple visits: some residents continue from a shop to a seven-second park stop before heading home. Without destinations they still take a short stroll. No new buildings, needs, currencies, or income rules.

Outings are transient and rebuilt after layout changes; they add nothing to save data. Bounded grid paths are computed only on layout changes; resident movement uses reusable timed segments. Existing 32-visible-resident and DPR limits remain. Tiny props share geometry/materials and cast no shadows. Calmer effects retain visit/payment timing while hiding props and keeping residents stationary. Visits pause in the Build catalog and hidden tabs; background time never fast-forwards shop purchases.

Validation: 44 automated tests, including outing continuity, timing, unreachable shops, home return, and destination coverage; production TypeScript/Vite build. The managed preview relay was unavailable in this session, so pre-publication browser QA and physical iPhone Safari verification remain outstanding. Saves and update protections are unchanged.

## Neighbor greetings and walking paths (0.14)

Placed buildings now share a free, automatic paved walking network. Entrances connect to the nearest reachable earlier entrance, sharing intersections and deduplicating edges. Resident errands use shortest routes on that same graph, including shop-to-park legs. Short approach paths connect homes to their paving. Paths rebuild after moves, rotations, storage, and undo; they do not occupy build slots or add save fields. A lone home gets a small stroll path, and homes without shops can visit a neighboring doorstep.

Nearby walkers occasionally pause, face one another, and wave with a free hand for 2.2 seconds before continuing the same outing. Meetings do not create purchases. Each resident has a 25-second greeting cooldown; at most two pairs greet simultaneously. Proximity checks run four times per simulated second for up to 32 visible residents. Build, Edit, and hidden tabs pause movement and meetings. Calmer effects suppress greetings and keep residents stationary while preserving ordinary visit/payment timing.

Paving uses two instanced, unlit meshes with shared geometry and no shadows or pointer hits. Network paths and cached graph searches run only on layout changes, never per frame. A local 49-building layout produced 340 graph edges in approximately 77 ms on the development machine; this is not an iPhone performance measurement.

Validation: 53 automated tests and a production build. New tests cover visible-route agreement, obstacle avoidance at all four rotations, layout rebuilds, disconnected destinations, greeting pairing/orientation, cooldowns, concurrency, and pause/Calmer behavior. Headless mobile Chromium at 390×844 showed the paving and two waving residents without page errors or horizontal overflow. Browser checks also verified that Edit and Build pause residents, Calmer effects keep them still, and saves survive reload. Physical iPhone Safari behavior remains unverified.

## Parks in use and lively shops (0.15)

Parks now have two usable benches and a fountain-side standing spot. Arriving residents reserve one free spot, walk around the fountain, sit for ten seconds or stand for seven, and walk back to the entrance before continuing their outing. Reservations include approach/return time to prevent shared seats; a full park is passed by without a queue. Seats, poses, local routes, and facing follow building rotation. Layout changes and unmounts discard transient activity.

Cafés and bakeries open a real hinged door and warm their shop window while residents visit, whether browsing or buying. Multiple visitors keep a shop active until the last one leaves. Blender sources and GLBs preserve separate ShopDoor/ShopWindow nodes; cloned per-shop window materials prevent one shop lighting another. No dynamic lights, particles, new currencies, or maintenance. Each shop remains below 250 KB and within the existing 12-mesh budget. Existing bakery bread displays and takeaway props remain.

Activity never modifies saved data or payment rules. The ten-minute shop/resident purchase interval, home rent, and task/study income are unchanged. Build, Edit, and hidden tabs pause visible activity; Calmer effects retain ordinary visit/payment timing with stationary residents, closed doors, and no window glow. Local park movement uses small precomputed routes and reuses pose output objects each frame.

Validation: 57 automated tests and production TypeScript/Vite build. New checks cover exclusive park reservations, full-park behavior, release/reuse, multiple shop customers, rotated park paths and fountain clearance, and named GLB activity nodes. A 390×844 headless Chromium check observed two residents seated on separate benches and both shop doors opening with window glow; Build paused park/shop activity and Calmer effects suppressed the new motion. No page errors or horizontal overflow. Physical iPhone Safari testing remains outstanding.

## Resident personalities, touch, and atmosphere (0.16)

Residents now have stable fictional names, favorite places, and avatars derived from their home ID and resident slot. Moving, storing/replacing, reloading, and restoring a backup retain that identity without adding resident records to saves. Outing plans gently favor the preferred building kind by adding a favorite visit between ordinary errands; all ordinary destinations remain represented, and unavailable favorites are skipped.

Tap a visible neighbor to see a compact live name/status/favorite card and receive a brief wave. A 26 CSS-pixel picking radius helps on phones; building occlusion, movement beyond eight pixels, multiple pointers, Edit, and Build prevent accidental selection. Seated residents wave without leaving their seat; other residents briefly pause their outing. Repeated taps cannot extend an active wave. Neighbors/Next buttons provide a keyboard-accessible way to inspect residents. Only one card is shown, status refreshes twice a second while open, and Calmer effects suppress waving while retaining details.

Settings → City atmosphere offers Day or Warm evening. Evening uses the existing ambient/directional lights with warmer colors and a lower sun, a gentle city background tint, and softly emissive windows. No new lights, post-processing, particles, clock simulation, or gameplay conditions. The optional atmosphere field is validated and included in normal autosaves/backups; old saves default to Day and reset restores Day. All existing payment intervals and saves remain compatible.

Validation: 61 automated tests and production TypeScript/Vite build. Tests cover stable identity, preferred outings with destination coverage, pointer discrimination, and atmosphere compatibility/persistence without income changes. Headless mobile Chromium at 390×844 verified actual tap selection/waving, pan suppression, resident details, evening persistence after reload, and Calmer details with no page errors or horizontal overflow. Physical iPhone Safari testing remains outstanding.

## Continuous resident routines (0.17)

Resident routines now keep compact checkpoints independent of the mounted city scene. Opening Pages, Tasks, Calendar, or focus mode no longer starts outings over. Returning advances their walking, errands, and park activity by elapsed wall time; reopening the browser does the same from saved checkpoints. Whole outing cycles are skipped mathematically, without rendering or running background frames. The 3D scene still unmounts while elsewhere to save battery.

Checkpoints include route progress, carried items, park progress, and a compact layout signature. They join normal autosaves, page-hide saves, JSON exports/imports, and confirmed reset. Old saves need no migration; their first city visit starts a checkpoint. Changed layouts safely rebuild affected outings. Up to 32 snapshots are retained, and removed homes are pruned. Park spots are reacquired without sharing seats; greetings and touch waves are transient.

Only visible shop-visit completions may pay: elapsed-time catch-up never replays purchases, floating payments, or offline shop income. Offline home rent is unchanged. Calmer effects remain visually stationary. Build/Edit still freeze visible interaction, then catch up elapsed routines on resuming.

Validation: 64 automated tests, production build, and headless 390×844 Chromium checks for tab continuity, persisted checkpoints after reload, and no page errors. Tests cover multi-cycle catch-up, park progress, backwards clocks, layout compatibility, backup checkpoints, and malformed data. Physical iPhone Safari remains unverified.
