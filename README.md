# Compound · pocket factory 0.5

A phone-first, monochrome productivity game. Real work earns Matter and Charge. Charge powers the miniature farm you build.

**Live app:** https://cyrusvibecoding.github.io/compound/?v=pocket-factory-05

![Blender machine preview](models/preview.png)

## Run and build

Node 20.19+ or Node 22.12+:

```sh
npm ci
npm run dev
npm test
npm run build
```

`dist/` is the deployable static site. Relative paths support GitHub Pages under `/compound/`. The `gh-pages` branch contains the deployed build; `main` contains source. Changes on `main` need rebuilding and publishing to `gh-pages`.

For iPhone, open the live HTTPS app in Safari and choose Share → Add to Home Screen. Home Screen installation and offline caching require HTTPS. Opening `localhost` on an iPhone does not connect it to a different computer.

## Farm controls

- Drag objects from the tray or directly on the farm. Tap a placed object for upgrades, rotation, or returning it to the tray.
- Tap a tray object then an open map space as an alternative to dragging.
- Placement snaps to half-unit spacing and rejects overlaps. The infinite grid stays visible at all times. Ghost previews appear while editing; the 3D canvas has a transparent background over the white app.
- Layout undo restores the previous placement/rotation without reversing purchases or production rewards. Machines remain owned after undo.
- Pan empty space, pinch to zoom, or recenter to frame the saved layout.

## Multiple machines and touch controls

- Tray cards add machines. Drop stored machines for free; when no stored copy remains, dropping another buys a new copy at the displayed price. Invalid or cancelled drops never charge Matter.
- Base extra-copy prices: Core 40, Press 60, Assembler 120 Matter. Prices grow by 35% per additional owned copy (the initial free Core is excluded from this growth).
- Every copy has a persistent ID, position and rotation. Drag an existing machine directly on the farm to move it. Returning to the tray preserves ownership and rotation.
- Type upgrades apply to all copies of that type; machine panels explicitly say “Upgrade all”. Layout undo preserves purchases and restores only the previous layout.
- Farm, header and tray text cannot be selected or invoke native drag menus. Touch movement prevents browser scrolling during a machine drag. Notes and text fields retain normal editing and copy/paste.

## Motion and milestones

- Machines spring into position and rotate through the shortest angle. Drops and upgrades create brief ground ripples and a bounded particle burst.
- Curved pale tracks carry small resource blocks while production runs. These tracks visualize the existing factory; they are not editable production connections.
- Collection, task completion and focus outcomes send reward particles to the Matter counter. Task completion gets a brief checkmark pop. Machines gain a subtle selection ring.
- Open the tray's sparkle button for five milestones and their progress. Finishes are visual rewards: Porcelain is available immediately, Graphite unlocks after 3 finished tasks, and Brushed silver after 25 completed focus minutes. Previously earned progress counts automatically.
- Finish selection and the Calmer effects setting save with your existing data. System reduced-motion preferences always take priority. Calmer effects keep production and rewards identical.
- No bloom, screen shake or full-screen flashes. Effects use a small fixed particle budget; the 3D farm unmounts during focus sessions.

## Work and production

- A completed 5/10/25-minute session earns **2 Matter +1 Charge per minute**.
- Completing a task earns **20 Matter +5 Charge**, once. Partial work earns the session reward without marking the task done. Continue claims the completed round and starts a new one.
- Charge rewards fill available tank capacity. Removing capacity does not delete existing Charge; no new Charge is added until space is available.
- At least one Core must be placed to produce. Each placed Core stores 30/60/90 Charge according to its individual level, with a minimum one-Core tank available while all Cores are stored. Matter yield is 1/1.25/1.5 per Charge for uniform Core levels; mixed fleets use the average placed Core level.
- Each placed Core contributes 1 Charge/min of processing. Each placed Press adds 0.5/1/1.5 Charge/min according to its level. For one Core and one Press this is 1.5/2/2.5 per minute. More speed produces Matter sooner rather than creating energy.
- Any placed Assembler enables auto-collection. Each placed Assembler adds 30 Charge and 40 output capacity per level (base output capacity: 20).
- Without auto-collection, output waits in storage. Full storage pauses production without consuming Charge. Tap Collect to bank it.
- Production uses elapsed timestamps, catches up when reopened, and is capped by earned Charge and available output storage. Placing, removing or upgrading settles previous production before changing rates.

Tasks include editable titles, notes, subtasks, custom projects and an explicit Today selection. Focus history includes outcome and optional progress notes. Work is self-reported. No background alarms, sound or notifications are enabled.

## Data and updates

Data stays in this device/browser's `compound-v2` local-storage key. The old `compound-v1` key is read for migration and left untouched, so an old cached build cannot overwrite new multiple-machine progress. Old saves and exported backups retain tasks, Matter, ownership, sessions and layout. A Save icon and Settings show save status and last-saved time. Autosave runs after changes and flushes on page hide; `compound-v2-backup` retains the previous valid local snapshot and can recover a corrupt primary save. Export backups in Settings before clearing browser data or switching devices. No sync or server database is configured.

Production builds cache the app and models for offline reopening. Navigation bypasses HTTP cache, updates are checked when returning to the app, and an update notice offers refresh without interrupting a work session. Versioned test links help open a fresh document.

## Blender models

Editable `.blend` files are in `models/`; optimized runtime GLBs are in `public/models/`. Blender 4.3+:

```sh
blender -b --python scripts/build_models.py
blender -b --python scripts/render_models.py
```

The first command regenerates sources and exports. The second creates a showroom scene and PNG preview. Separate moving meshes retain their names. `L2_` and `L3_` objects appear and assemble at matching upgrade levels.

## Verification and limits

TypeScript, production build and 60 unit tests pass. Tests cover rewards, independent upgrades, purchases, layout undo, storage recovery, legacy migration, finite online/offline construction, completion preserving spare Charge, pause/resume, blueprint validation, and cosmetic settings.

Physical iPhone 12 gestures, Safari Home Screen/offline behavior, and frame rate remain unverified. Mobile Chromium checks at 390 × 844 passed: construction start/pause, saved task notes and placements, keyboard placement, reduced-motion preference, canvas selection and individual level 1→2→3 upgrades with correct costs and an unchanged second Core. Screenshots were inspected for layout; no horizontal overflow or page errors remained. The transient in-canvas HTML loading overlay was removed after it caused a React DOM removal error during model loading. No sound, notifications, prestige, or missed-day penalties.

## Working inventions 0.6

Open **Build an invention** in the bottom tray to select the kinetic observatory. It has three permanent construction stages: frame (10 parts), dish and gimbal (26 cumulative), and activation (50 total). A Core alone can finish it. Placed Presses and Assemblers improve speed and parts per Charge without requiring adjacency. Construction plays out in seconds, using timestamp accounting even while away; watching grants nothing. Completed observatories turn slowly and can be hidden without losing progress. The project link is a label, not a task-completion gate. Version 0.6 introduced this first blueprint; 0.7 adds the mechanical clock.

Construction is opt-in. Existing saves continue Matter production until you choose Build. Build mode consumes Charge instead of producing Matter; existing stored output stays claimable. Pause to resume Matter production. At completion, unused Charge stays saved until you explicitly return to Matter production. In 0.7 each construction stage uses its own machine role: Core fabricates frame blanks (0–10), Press shapes panels or gears (10–26), Assembler installs mechanisms (26–50). Core can handle specialist stages at 60 Charge/min if none is placed. A specialist processes 120 + 60 per placed role level Charge/min. Frame processing starts at 120 Charge/min plus 60 for each additional Core. Core efficiency adds 0.1 parts per Charge for each level above one; specialist stages add 0.1 for each placed specialist level. Preview calculations cross stage boundaries using the same rates and efficiencies as production. No new currency is introduced; parts only represent installed blueprint progress.

Machine levels now belong to IDs. Every existing machine (including tray inventory) inherits the previously purchased type level. New purchases start at level 1. Returning a machine to the tray preserves its level. Upgrade previews compare the selected ID's actual factory contribution, including construction efficiency and remaining Charge requirements. Type-level summaries remain for compatibility and ownership milestones, not runtime upgrades. GLBs and editable Blender sources contain larger level-two mechanisms and level-three transformations, revealed in sequence.

The local key remains `compound-v2`, with existing backup and `compound-v1` recovery. Payload `version: 1` stays readable; `schemaRevision: 3` retains per-machine levels and adds saved blueprint choices; revision 2 saves remain readable. Migration is idempotent and retains tasks, subtasks, notes, resources, sessions, history, IDs, positions, rotations, and layout undo. Safari selection suppression and pointer handling remain intact. Reduced motion reveals final parts without assembly motion and stops the completed dish rotation.

Settings → Reset all progress asks for confirmation before deleting all local tasks, notes, custom projects, focus history, resources, machines, layouts, and invention progress. Export a backup first to keep a copy. Recovery and legacy save slots are replaced with fresh state so old progress cannot return through recovery. Other apps’ storage stays untouched. Storage failures report an error and attempt to restore prior save values. Mobile Chromium checks cover cancelling, confirming, and reloading after reset.

## Working together 0.7

Choose either the observatory or mechanical clock. Switching settles elapsed work, saves the old blueprint’s installed parts and project label, restores the chosen blueprint, and pauses production. Both blueprints can be completed and displayed by selecting them; only the selected blueprint operates or appears on the farm. Completed builds retain spare Charge until Return to Matter production is selected. The current stage animates its worker and shows component transport toward the build. Clock gears and both hands activate on completion; reduced motion freezes them.

The tray names the next visible construction goal. The blueprint sheet forecasts how far current Charge reaches, shows the active role and any Core fallback, and the selected machine upgrade previews remaining Charge costs before and after purchase. No extra currencies or manual wiring.

Focus completion accepts an optional Next small step, stored with the focus history entry and shown beside that task in Today and Projects. It does not complete the task or earn an extra reward. Existing progress notes remain intact.

Open **How to play** in the tray or **How Compound works** in Settings for the five-step guide, ten-minute homework example, explanations of Matter and Charge, machine placement and upgrades, build/Matter modes, offline progress, and saves. It links directly to Today and blueprint selection and does not force onboarding over the farm.

Mobile Chromium checks at 390 × 844 passed: guide access from both entry points, next-step input and Today display, reload persistence, clock selection/build/pause, retained completed observatory, reduced motion, and no page errors or horizontal overflow. Physical iPhone/Safari frame rate and gestures still need device validation.
