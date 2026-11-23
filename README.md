# Compound · local prototype

A phone-first, monochrome incremental productivity app. Real work earns Matter; Matter builds a miniature world.

![Blender machine preview](models/preview.png)

## Run

Node 20.19+ (or Node 22.12+):

```sh
npm install
npm run dev
```

Use the displayed localhost address on this computer. For iPhone installation and offline use, serve `npm run build` output (`dist/`) over HTTPS. An iPhone cannot reach another computer through `localhost`; use an HTTPS host or a trusted local HTTPS setup. Source is available on GitHub. Live app: https://cyrusvibecoding.github.io/compound/ .

```sh
npm run build
npm test
```

## Included

- Three custom Blender machines: Core, Press, Assembler, with level-specific attachments.
- Editable `.blend` sources in `models/`; lightweight GLB runtime exports in `public/models/`.
- White horizonless 3D farm with a bottom object tray. Touch-drag or tap-to-place, snapped placement, collision checks, pan/pinch zoom, recenter, and tap-to-upgrade sheets. Placement saves locally; old saves retain owned machines.
- Task capture, three project categories, subtasks, completion history.
- 5/10/25-minute focus sessions that recover from backgrounding or phone lock using timestamps.
- 2 Matter per completed focus minute, 20 per completed task, repeat-claim protection.
- Three levels per machine. Upgrades are visual in this prototype; passive production and prestige are not implemented.
- Local device storage, validated JSON export/import, production offline cache, reduced-motion support.

Tasks are self-reported. A session reward and task completion reward are separate. Ending a session early does not award Matter. No notifications or background alerts. No sound yet.

## Model pipeline

Requires Blender 4.3+:

```sh
blender -b --python scripts/build_models.py
blender -b --python scripts/render_models.py
```

The first command regenerates all `.blend` and `.glb` files. The second makes `models/showroom.blend` and `models/preview.png`. Keep moving pieces as separate named meshes. `L2_` and `L3_` objects appear at the corresponding upgrade stage. Runtime animation uses the Rotor, InnerRing and Hammer node names.

## Verification

TypeScript and production build pass. Eight unit tests cover rewards, elapsed-time recovery, upgrades, backup validation, save migration, placement costs, collisions and returning machines to the tray. Blender files export successfully. Browser and physical iPhone performance, Home Screen install and offline behavior still need testing; no browser automation was available during this build. Target is iPhone 12; 60 fps has not been measured.

Local storage is device/browser-specific and can be removed by iOS or clearing browser data. Export backups regularly. No sync or server database is configured.
