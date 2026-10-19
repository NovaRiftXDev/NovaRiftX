# Public sharing and scope update — 2.6

Public play link: https://subscriptions-spring-manga-mit.trycloudflare.com

This is a TEMPORARY Cloudflare Quick Tunnel to the running game on this Mac. It works from other computers over the internet while the Mac stays awake and connected and both the Node server and cloudflared stay running. No permanent hosting or domain has been purchased. Restarting the tunnel generally produces a different link. Accounts remain stored on this Mac and can be used through the public link by signing in. Touch-only mobile gameplay is still unsupported.

Two independent authenticated clients connected through public HTTPS/WSS, joined the same room and started a live match successfully. Use the public URL, not localhost, when sharing.

Double-click or Q toggles scope while keeping mouse capture and staying in the arena. Escape leaves scope and keeps the arena view; the browser releases mouse capture, so click the small Resume aiming prompt to capture it again. You are protected while capture is released. A second Escape opens settings. Browser-reserved Escape release is not overridden. Full manual pointer-lock scope testing remains unverified.

# Smooth companion update — 2.5

Animal companions now use a single blended, continuous body surface: connected necks, shoulders, legs, paws, ears, tails and wing membranes. Smooth surface normals, soft nonmetallic materials, cream markings and glossy eyes replace the previous assembled primitive look. Scout orb keeps its smooth sphere and orbital rings.

All eight animal body meshes passed connectivity and finite-normal checks; each body is one connected component. Geometry is cached and cloned for reuse. The shop, personal locker and live match use the same models. The preview gallery is available at /pet-gallery.html without signing in. Browser previews were checked without console errors. These are stylized procedural sculptures, not photorealistic animals.

# Current release: NovaRiftX 2.4

Start with `npm install` and `npm start`, then open http://localhost:3000 on the server computer. Create a username and password in the account screen. Existing browser purchases can be attached when registering. Later, log in with the same credentials on the SAME server to restore your profile, name, settings and locker. Passwords use salted scrypt hashes; profile secrets are excluded from public state. This version has no password recovery. Keep a secure backup of the data directory.

Localhost is not an internet address. Sharing that link will never connect another computer to yours. Use the deployed HTTPS address below. Current gameplay needs a desktop browser and keyboard plus mouse/trackpad; touch-only iPad gameplay is not implemented.

## Recommended hosting: Render paid web service + persistent disk

1. Put the contents of this folder in a GitHub repository. Exclude `data` and `node_modules` (the included .gitignore does this). Never upload saved profile credentials.
2. Sign into Render and create a Blueprint from that repository using render.yaml.
3. Review the paid Starter service and 1 GB persistent disk cost before approving deployment. Current pricing: https://render.com/pricing . Persistence details: https://render.com/docs/disks . Free web services do not support this required disk.
4. The configuration mounts /var/data and sets NOVA_DATA_DIR accordingly. Run one instance. Render's HTTPS address is the link you and your friends should open; create a room there and send its invite link.
5. For existing local accounts to appear online, the server operator must securely migrate data/profiles.json to the persistent volume before starting the new service. Do not commit it or send it to friends. Otherwise, accounts on the new server start separately.

Hosting has NOT been purchased or deployed. A Dockerfile is also included for other hosts with a persistent /data volume and HTTPS. Backups and account recovery are the operator's responsibility.

## Latest gameplay changes

- Robots take 40% more weapon damage; player-versus-player damage is unchanged.
- Double-click the mouse/trackpad while in the arena to toggle a 2.5x scope. Escape exits scope and releases mouse capture into protected settings. Trackpad clicking must be enabled in your OS. Browser-reserved Escape behavior is preserved.
- Shop balances refresh every five seconds while open. Purchase failures show a clear message; items cost Rift Tokens, not NovaPoints.
- 30 cosmetics, six equipment slots, personal locker, unique armor geometry and gun patterns. Nine pets now use elongated torsos, articulated-looking legs/paws, tapered muzzles/tails and wings instead of spherical bodies.
- Callsign and changed settings save to the account. Login elsewhere requires the same hosted server. Anonymous match joining is disabled outside automated tests.

21 automated tests pass, including authentication, duplicate usernames, wrong passwords, preserving old purchases, persisted settings and keeping password hashes out of public responses. The account screen loads without browser errors. Scope input and full mouse gameplay have not been manually verified in the embedded browser.

---
Previous release notes (where conflicting, the current release above takes precedence):

# NovaRiftX

A browser shooter with real multiplayer, 24 cover layouts across desert/forest/industrial biomes, six weapons, six cosmetic suit colors, and first-/third-person cameras. No slogan. Rounded futuristic lobby with mode cards, arena tiles, skin selection, and sensitivity settings.

## Play locally

Install Node.js 22+, open a terminal in this folder, then run:

```sh
npm install
npm start
```

Open http://localhost:3000 in desktop Chrome, Edge or Firefox. Keep the server running. Refresh with Command+Shift+R after updates. The original bookmark address still works.

## Controls

- WASD **or arrow keys**: move.
- Space: jump. Mouse: aim. Hold left click: repeat fire with automatic reload.
- R: reload manually. 1–6: pistol, shotgun, assault rifle, SMG, marksman, machine gun.
- V: first-/third-person camera. Escape: open protected settings; other players continue playing.
- Mouse sensitivity: 0.2×–3.0×, adjustable before and during a match, saved in this browser.

Head bob and recoil shake are removed. Camera movement interpolates server snapshots with a 70 ms rendering delay to smooth network steps. This adds a small movement-display delay. Smooth graphics is the new default; High/Ultra remain selectable. Full frame rate has not been benchmarked on other computers.

## Modes

**Co-op Survival:** 1–4 real players against enemy waves. Defeated teammates respawn between waves. Friendly fire disabled.

**Battle Royale:** 2–8 real players in a private room. No bots or public matchmaking. The host cannot start with fewer than two players. Players spawn apart, can damage each other, and have one life. After 15 seconds the purple safe-zone boundary begins shrinking; being outside deals 12 HP/second. Last survivor wins. Everyone starts with all six weapons; health/ammo pickups are scattered around the map. Late joins are blocked during a round. The host can restart with at least two connected players. Disconnecting removes that player from the match.

## Arenas and skins

24 selectable arenas: Dust Basin, Pine Ridge, Iron Yard, Solar Ruins, Emerald Divide, Orbital Depot, Canyon Relay, Mistwood, Quantum Works, Mirage Station, Verdant Crossing, Eclipse Terminal. Each has its own cover layout and server-side collision. The three biomes share scenery assets.

Six cosmetic suit colors: Ion, Obsidian, Aurora, Crimson, Glacier, Verdant. Choose a skin before joining; it is visible on your third-person character, first-person sleeves and other players' clients. Skins have no gameplay advantage.

## Play with a friend online

Deploy this folder as a Node web service (not a static site). On Render, connect a GitHub repository containing this folder, use build command `npm install` and start command `npm start`, and choose an instance plan. The included render.yaml can also be used as a Blueprint. The server honors PORT and listens on 0.0.0.0.

Use the resulting HTTPS address to create a room and copy its invite link. Your friend opens the link and joins with the room code. Localhost only refers to the current computer, so localhost links do not work for remote friends. Same-Wi-Fi players may use the host computer's LAN address if its firewall permits port 3000.

Run one server instance: rooms are in memory. Server restarts erase rooms. No hosting has been provisioned here. Render has offered a free tier with quotas and idle spin-down; check current pricing and limits before deployment:
https://render.com/docs/web-services
https://render.com/docs/websocket
https://render.com/docs/free
https://render.com/pricing

## Chrome extension

This main folder can be loaded unpacked as a small launcher that opens the local server. The separate NovaRiftX-extension.zip bundles the game client and lets you enter a hosted server address. In chrome://extensions, enable Developer mode, select Load unpacked, and choose the extracted folder containing manifest.json. After updating, click Reload on the extension card. Both forms still require the game server.

## Verification

`npm test` runs 19 automated tests: real WebSocket room joining, host transfer, weapons/reload, map synchronization, royale minimum players, skin synchronization, separated spawns, PvP victory, storm damage, arrow mappings, jump physics, snapshot interpolation, and map clearance. All pass. Two separate browser clients joined and started a battle royale match, and sensitivity persistence and the new lobby were checked. Full mouse gameplay remains unverified in the embedded browser because it previously rejected pointer lock; use a regular desktop browser.

Graphics are procedural and stylized rather than photorealistic. This is a small private game, not a production matchmaking or anti-cheat service.

## Terrain, settings and admin update (2.1)

Maps now span 94 metres with solid elevated plateaus and sloped ramps shared by rendering and server physics. Larger layouts include outpost scenery, improved robot armor and optics, and openings in suitable cover blocks that bullets can pass through. Ammo caches replenish every 15 seconds and provide four magazines per weapon; pickups are easier to collect.

You cannot take damage or attack while choosing settings on the Enter arena screen, after Escape, or while the admin panel is open. Protection ends when you enter the arena and the mouse locks to the game.

Expand More settings for 18 additional controls: field of view, volume, invert aim, crosshair size/color, HUD scale, player list, third-person distance, weapon size/visibility, muzzle flash, tracers, particles, bloom, shadows, fog, brightness, and resolution. Preferences are saved in this browser.

### Admin controls

Every connected player can open the panel in both Co-op and Battle Royale. Press Shift, then Command, then plus (+), then underscore (_) within three seconds. Open the shop first. The full sequence is required; there is no onscreen opening button.

The panel contains 50 working controls including flight, assisted aim, invulnerability, infinite ammo, rapid fire, movement modifiers, teleports, healing, loot drops and room controls. Space rises in flight; Shift descends. Close the panel and enter the arena to move. Enemy spawning and wave advancement apply to Co-op; zone controls apply to Battle Royale. Controls labelled Room affect everyone. This keyboard shortcut is a convenience, not authentication: all players are intentionally allowed to use these controls.

Validation: 15 automated tests pass, including protected settings, solid terrain and window raycasts, and non-host admin access in both modes. The browser loaded without console errors; arena entry protection and Flight acknowledgement were verified. Full mouse gameplay and Chrome extension installation remain unverified in the embedded browser.

## Rift Exchange update (2.2)

- 24 arena layouts across three shared biomes; the new layouts rotate and reshape cover.
- More detailed robot joints, pistons, metal plating, vents, scout fins and ranged backpacks.
- Easy, Medium and Hard change Co-op enemy health, movement speed and damage. The room creator chooses difficulty; joining players use that setting. Battle Royale is unaffected.
- Nine crosshair colors, five shapes, outline and opacity, alongside size controls.
- Rift Exchange offers six armor finishes, six gun finishes and three cosmetic flying pets. Equip these independently; they are visible in multiplayer and provide no combat bonus. Common items cost 15–20 tokens, Rare 60–80, Epic 180–200 and Legendary 400–450.
- Each kill earns 1 Rift Token and 10 NovaPoints. Each completed Co-op wave awards 10 tokens and 100 NovaPoints to players currently playing (not protected in settings). Rewards are credited by the server once. Buying spends only Rift Tokens; NovaPoints never decrease when buying.
- Open Shop & leaderboard from the lobby, room or protected settings. Profiles, purchases and scores persist in data/profiles.json. A random profile credential stays in this browser's local storage; clearing browser data loses access. There is no account recovery or cross-device sign-in yet.

### Shared online leaderboard

The leaderboard ranks the top 100 profiles by NovaPoints on the connected server. All friends must use the same deployed server for shared worldwide rankings. Localhost is local-only; no public deployment has been created. Admin-assisted scores count, explicitly labelled in the UI; this is a sandbox leaderboard, not a competitive anti-cheat service.

For durable hosting, run ONE Node service and mount persistent storage. Set NOVA_DATA_DIR to a directory on that persistent volume. Back it up. Ephemeral hosting loses scores and purchases when its filesystem is reset. The sample free Render configuration is for temporary play, not durable progression; choose a host/plan with persistent storage and confirm its current cost before deploying. Never publish or include the data directory in downloads: it contains profile credentials. Multiple server replicas require migrating this file store to a shared database.

All 19 tests passed, including exact kill/wave rewards, no duplicate wave credit, purchase affordability/ownership, profile reuse, difficulty health changes and all 24 map centers. Browser shop loading was verified. These are procedural game graphics and cosmetics, not scanned photorealistic assets.

## Locker and cosmetic designs (2.3)

Arena settings, HUD sound, weapon labels and admin action buttons are more compact.

Six armor designs now have separate shoulder silhouettes and crests, knee plates and head ornaments. Six weapon finishes use frost shards, flames, circuit lines, diamonds, constellations or engraved gold patterns. The shop previews render the actual 3D models.

The collection has 30 items across six independent slots: armor, gun finish, pet, backpack, halo and gun charm. Personal locker shows only owned items, supports category filtering, and lets you equip or remove each slot without losing ownership. Existing purchases retain their IDs and remain owned.

Nine cosmetic flying pets: Scout orb, Fox drone, Orbit dragon, Volt wolf, Solar phoenix, Astral owl, Kitsune, Night wyvern and Sky manta. Their shapes include orbit rings, paws, tails, ears, wings, horns or tentacles; winged pets animate while following players. Pets have no combat effect.

20 automated checks pass, including purchases and removing/re-equipping all six slots. Browser model previews were visually checked without console errors. Full mouse-controlled gameplay and extension installation were not manually tested this update.


## Version 2.7
- Optional co-op bosses every tenth wave (checkbox when creating a room).
- Separate Battle Royale 100: up to 8 real players, with bots filling the roster to exactly 100 at match start. Original players-only royale remains available.
- Practice range: respawning targets, unlimited reserve ammo, no death or currency rewards.
- Admin panel: 50 cosmetic meme toggles, clear-memes button, and map-wide nuke. The nuke eliminates combatants; protected/invulnerable players survive and scenery stays intact.
- 21 additional cosmetic variants, 51 shop items total. Existing prices increased fourfold; new items cost 800–2,800 Rift Tokens. Owned items remain owned.
- Validation: 25 server/multiplayer tests pass.


## Version 2.8.0
- Co-op combat balance retained. Battle Royale bots have 55 HP, lower accuracy against humans and 4 damage per hit.
- Every map has its own continuous terrain function, palette and named landmark. Orbital Depot includes docking platforms, ships and orbital rings. Battle Royale always uses Riftfall Island; Practice always uses Nova Training Lab. Preview all 26 maps at `/arena-gallery.html`.
- C slides while moving on ground, with a cooldown; jump cancels sliding. Ten weapons (1–0 or mouse wheel), including plasma carbine, rail rifle, scatter blaster and pulse repeater.
- Ammo pickups refill reserves for every weapon within 5 meters. Supplies refresh every four seconds; outposts have supplies.
- Escape opens protected settings with Leave match, including when scoped or eliminated. Host can change the tenth-wave boss toggle midmatch.
- Shop has 76 cosmetics, 18 daily rotating items plus six permanent essentials. Rotation is server-enforced and changes at midnight UTC; owned items remain in the locker.
- Companion studio saves name, coat color, size and accessory.
- Shop Admin is available in the shop and the main admin panel. Unlimited tokens toggle affects purchases without inflating earned NovaPoints. Inferno sovereign is a free admin dragon, firing for 60 damage every 1.2 seconds at visible enemies within 28 meters. It cannot attack while its owner is protected.
- v2.8.0 appears beside the game name in small muted grey text.
- 32 automated tests cover multiplayer, terrain, sliding, purchases, rotation, pet persistence, bosses, and combat dragon protection.

## Free permanent-address hosting
See [HOSTING-FREE.md](HOSTING-FREE.md). `render.yaml` now selects the free Node service and requires a Neon PostgreSQL connection string for durable accounts. No paid disk is configured. Hosting still requires sign-in and deployment; a stable public address has not yet been assigned. Free servers can sleep and have usage limits.

PostgreSQL persistence has automated adapter tests; a live Neon database connection remains to be verified during deployment.

## Movement and building update
Double-tap W and keep W held to sprint at 1.5× walking speed. Sprint energy drains only during sprinting and recovers while resting. Press C while sprinting on flat or downhill ground to slide at 2× walking speed. Uphill slopes cancel slides.

B toggles building. Z selects walls, X floors, T ramps; click to place the translucent preview. Aim at your own nearby wall and press G to toggle a doorway, or Delete to remove your structure. Builds are shared solid cover, capped at 200 per room, and reset on a new match. This is a basic grid-building system, not a full Fortnite editor.

Practice has unlimited magazines. Other modes replenish reserve ammo automatically while retaining reloads. Pets are smaller, follow behind and to the side, and animate their legs or wings. Core admin includes enemy outlines. Open the shop, then press Shift, Command, +, _ in order to open admin; this hidden shortcut is not an account-based security restriction.
