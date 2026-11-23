# Little City · 0.11

A phone-first city built with real effort. Finish tasks, study, earn cash, place homes, and watch residents visit the park. White background, naturally colored models, transparent 3D canvas, and a permanently visible horizonless grid.

**Play:** https://cyrusvibecoding.github.io/compound/?v=little-city-calendar-11

![Basic house, big house, park, boy and girl models](models/city/preview.png)

## The first city

New cities start with **$40**, enough for a basic house. Drag a building from the tray onto open ground, or select it and tap the grid. A valid drop buys it. Tap Edit to move buildings; tap one in Edit mode to rotate or store it. Tap Done to return to safe camera panning. Layout undo keeps purchased ownership; stored homes pause their residents and rent.

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

34 tests cover cash rewards/replay protection, study outcomes, purchases, failed drops, ownership/rotation/layout undo, finite rent accounting and backwards clocks, offline equivalence, resident routes, invalid backups, legacy migration/refunds, save isolation/recovery, reset rollback, import, and GLB size/joint/draw-call budgets.

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
