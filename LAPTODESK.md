# LAPTODESK — Session Handoff Notes
> Shared context between Desktop Claude and Laptop Claude.
> Update this at the end of every session with what was done and what's pending.

---

## Last Updated: 2026-03-30 (Laptop Session — Late Night)

### What Was Done This Session (Laptop)

**Narrative Craft Knowledge Base — AI Storytelling Upgrade:**
- Integrated a 15-work literary canon distillation into the GM prompt system
- `app/storyEngine.js` — Added sections 6, 7, 8:
  - **Section 6**: Condensed craft principles (10 maxims) + 17 named techniques (token-optimized: name + 1-liner only)
  - **Section 7**: New 7-phase guidance system replacing old 5-phase inline block. Phases: opening, discovery, rising_tension, confrontation, crisis, oath, aftermath. Each phase has matched techniques + guidance.
  - **Section 8**: Scene type detection layer (independent from action tags). 7 types: npc_dialogue, exploration, combat, injury, moral_dilemma, revelation, emotional. Detected from action text patterns + game context.
- `app/ui.js` — `turnPrompt()`: Replaced 30-line inline phase if/else with `StoryEngine.getPhaseGuidance()` + `StoryEngine.getSceneGuidance()`. `openingPrompt()`: Rewrote opening rules to match KB.
- `app/combat.js` — System prompt (`getAiDmSystemPrompt`): Craft principles + technique library injected. All 4 combat prompt types (opening, round, victory, defeat) get phase-appropriate craft guidance via `getCombatCraftGuidance()`.
- `app/gameState.js` — Combat beat range widened: `COMBAT_BEATS_MIN` 3→2, `COMBAT_BEATS_MAX` 8→12 for unpredictable pacing.

**Prompt Caching — Cost Reduction:**
- `app/combat.js` — `getAiDmSystemPrompt()` now returns array of content blocks (not string). Block 1 = stable (world identity, craft rules, techniques, choices format) with `cache_control: {type: 'ephemeral'}`. Block 2 = dynamic (narrative context).
- `db/worker_index.js` — Worker detects array-format system prompts and adds `anthropic-beta: prompt-caching-2024-07-31` header.
- Technique library in system prompt condensed to names-only (~100 tokens). Full descriptions expanded inline only in per-turn phase/scene blocks (2-3 matched techniques instead of all 17).
- **Cost savings**: ~15% per campaign ($2.33 → $1.97 estimated)

**Full Technique Descriptions — DB Storage:**
- `db/migrations/006_narrative_craft_kb.sql` — `narrative_techniques` table with 17 rows. Stores full literary technique essays (seed_work, use_when, how, phases[], scene_types[]) for future admin audit tool against campaign chronicles.

**R2 Upload Limits:**
- `db/worker_index.js` — `/img/upload` now requires auth. Admin user (`54f49563-7c59-4c28-b4c8-3f1fca4e42fa`) = unlimited. All others = max 20 images, tracked in `user_uploads` table.
- New `DELETE /img/uploads/...` endpoint — owner or admin can delete images, frees upload count.
- Uploads keyed by user ID prefix (`uploads/{userId}/...`).
- `db/migrations/007_user_uploads.sql` — `user_uploads` tracking table.

**World Editor — Image Management:**
- `app/ui.js` — Theme editor panel expanded to "World Editor". New "Class Images" section below color pickers. Upload, change, remove images for each class. Remove calls `DELETE /img/...` to free R2 + upload count.

**Blurry Text Fix — All Screens:**
- `app/main.js` — Removed ALL `filter: 'blur(...)'` from every GSAP entrance animation (16 instances across campaign, title, create, lobby, game, combat screens). Root cause: CSS `filter` promotes elements to GPU layers, degrades sub-pixel text rendering on Windows/Chrome.
- Added `clearProps: 'all'` to all screen animation timeline defaults to prevent `opacity: 0` getting stuck on elements after interrupted animations.
- Title screen: added `gsap.killTweensOf()` + force-clear of opacity/transform before re-animating.
- `app/combat.js` — Replaced `parentElement.style.opacity = '0.5'` loading state with `el.style.color` change (no GPU compositing).
- `styles/components.css` — `.combat-narrative`: added `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`, `backface-visibility: hidden`.

**Character Creation Crash Fix:**
- `app/ui.js` — `onEnter()`: Now calls `await _loadWorldFromId(worldId)` instead of raw `loadSystem()`. Ensures custom world config is loaded from localStorage/community cache/DB before `renderCreate()`.
- `app/hub.js` — `_loadWorldFromId()`: Made async. Added 3-tier lookup: localStorage → community cache → `GET /db/worlds/:worldId` (new DB endpoint). Fixed broken guard (`!typeof` → `typeof !== `).
- `app/hub.js` — `routeFromHash()`: `await _loadWorldFromId(wid)` inside async block before rendering any game screen.
- `app/ui.js` — `renderCreate()` catch block now shows user-facing error message instead of silently logging.
- `db/worker_index.js` — New `GET /db/worlds/:worldId` endpoint for single world fetch.

**Community World Card Not Rendering:**
- Root cause: `goTo('worlds')` called `showScreen('worlds')` but never called `animateHub()`, so `renderWorldsGrid()` never ran. Community cards are dynamically rendered and depend on this.
- Fix: `goTo()` now calls `animateHub()` when navigating to worlds screen.
- `renderWorldsGrid()` made async with self-fetch fallback if community cache is empty.
- Official world duplicates filtered: skip any world from DB with `tier === 'official'` or ID in `{stormlight, dnd5e, wretcheddeep}`.

**Custom World Builder Fix (`app/systems/custom.js` line 120):**
- `_buildCharCreation()` had 3 bugs in one line:
  1. `keys` — variable from `_buildStats()` scope, not accessible here → `ReferenceError`
  2. `STAT_PRESETS` — wrong name, module-level const is `_STAT_PRESETS` (with underscore)
  3. `.statKeys` — wrong property name, preset objects use `.keys` not `.statKeys`
  4. `classic6` — wrong key name, preset map uses `classic` not `classic6`
- Fix: `_STAT_PRESETS[cfg.statSystem] || _STAT_PRESETS.classic).keys.length`
- Audited all other helpers (`_buildRules`, `_resolveStats`, `_buildSkillMap`, `_buildClasses`) — no other scope leaks found. All use proper parameter passing or module-level `_STAT_PRESETS`.

### Migrations To Run (if not already done)
- [ ] `006_narrative_craft_kb.sql` — narrative techniques table (for future admin audit)
- [ ] `007_user_uploads.sql` — user upload tracking table (required for R2 limits to work)

### Known Issues / Next Session

- [ ] Remove debug `console.log('[WorldGrid]...')` lines from hub.js (left in for diagnostics)
- [ ] Self-critique checklist (Component 5 from narrative KB) — deferred as admin tool against DB campaign chronicles, not runtime
- [ ] CSS `@keyframes stormlightIn` and `depthIn` in animations.css still use `filter: blur()` — these are entrance keyframes that animate to `blur(0px)`, less impactful than GSAP but could still affect text if applied to text containers
- [ ] World editor image management untested end-to-end (upload/remove cycle with R2)
- [ ] R2 upload auth: existing uploads before this session have no `user_uploads` row — won't count toward limit. Only new uploads tracked.
- [ ] Mobile layout — still untested on real devices
- [ ] Per-world font loading — wired but untested

### File Counts (current)
- **app/systems/**: 4 files (stormlight, dnd5e, wretcheddeep, custom) — ~2,770 lines
- **app/*.js**: 16 files — ~16,500 lines
- **app/storyEngine.js**: grew from 317 → ~580 lines (narrative craft KB)
- **styles/*.css**: 4 files — ~4,400 lines
- **db/migrations/**: 7 files
- **db/worker_index.js**: ~870 lines

### Worker Deployments This Session
1. Prompt caching header (`anthropic-beta`)
2. R2 upload limits + delete endpoint + `GET /db/worlds/:worldId`
3. All three deployed and live at `cyoahub-proxy.rruss7997.workers.dev`

---

### Desktop Session — 2026-03-31 (Stat Pools + Era Weapons)

**Stat Pool Display Fix (`app/ui.js` + `index.html`):**
- All hardcoded `12` and `3` in stat allocation UI replaced with dynamic `ATTR_POINTS_START` and `ATTR_MAX_CREATE` (which read from `SystemData.charCreation.attributePoints` / `.maxPerAttribute`)
- Hint text, "All X points allocated", error text, and per-stat `/max` display all dynamic now
- Custom worlds with `pointBuyPool: 27` and 5 stats correctly show "27 points, max 6 per attribute"

**Era-Based Weapon Pools (`app/systems/custom.js`):**
- New `_ERA_WEAPON_POOLS` constant with 8 full eras, each defining `heroWeapons`, `weapons`, `startingKits`, `armors`:
  - **Ancient** — Spear, Khopesh, Sling, War Club, Javelin, Ritual Staff
  - **Medieval** — Sword, Battle Axe, Longbow, Magic Staff, Twin Daggers, Spear, Warhammer, Crossbow
  - **Renaissance** — Rapier, Musket, Cutlass, Flintlock Pistol, Halberd, Crossbow
  - **Colonial** — Brown Bess Musket, Blunderbuss, Hand Cannon, Officer's Rapier, Tomahawk, Cavalry Sabre, Bayonet
  - **Modern** — .45 Handgun, Tactical Shotgun, Assault Rifle, SMG, Sniper Rifle, Stun Baton, Combat Knife, Twin Glocks
  - **Post-Apocalyptic** — Lead Pipe, Machete, Salvaged Shotgun, Makeshift Crossbow, Spiked Knuckles, Molotov, Rusty Revolver
  - **Futuristic** — Plasma Blaster, Laser Pistol, Rail Rifle, Vibro-Blade, Shock Baton, Pulse Grenades, Smart Pistol, Plasma Sword
  - **Timeless** — resolves to Medieval
- `build()` fallbacks rewired: `cfg.heroWeapons || eraPool.heroWeapons` (same for weapons, startingKits, armors)
- Old hardcoded medieval weapon fallbacks removed from build()

**Wizard Update (`index.html`):**
- Added **Colonial** and **Modern** to era selector (8 total, chronological order)

**DB Migration (`db/migrations/008_backfill_era_weapon_pools.sql`):**
- Stamps `"era": "Medieval"` on custom worlds missing the field
- Strips stale hardcoded medieval weapon data so worlds pick up fresh era pools

### ACTION REQUIRED — Update Your Custom World in DB

Your existing custom world is still using the old hardcoded medieval weapons. To switch it to Futuristic (or any era), run this against the Neon DB:

```sql
-- Replace <your-world-id> with the actual world ID from world_library
-- Change 'Futuristic' to whichever era you want

UPDATE world_library
SET config = config || '{"era": "Futuristic"}'::jsonb - 'heroWeapons' - 'weapons' - 'startingKits' - 'armors'
WHERE id = '<your-world-id>'
  AND system = 'custom';
```

To find your world ID:
```sql
SELECT id, config->>'name' AS name, config->>'era' AS era FROM world_library WHERE system = 'custom';
```

Also run migration 008 if not already applied:
```sql
\i db/migrations/008_backfill_era_weapon_pools.sql
```

Or via the Neon console, paste the contents of `008_backfill_era_weapon_pools.sql`.

### Migrations Still Pending
- [ ] `006_narrative_craft_kb.sql` — narrative techniques table
- [ ] `007_user_uploads.sql` — user upload tracking table
- [ ] `008_backfill_era_weapon_pools.sql` — era backfill + stale weapon strip

---

### Previous Session Summary (Desktop — 2026-03-30 AM)

Built: dnd5e.js, wretcheddeep.js, custom.js, enemyPatterns.js, 7-step wizard, world library, auth, campaign ownership, theme pipeline, full dynamic character creation, ambient audio, mobile responsive, spren images, routing fixes, combat heal fix, stale doc sweep. See git log for details.

---

> **Convention**: Update this file at the END of each session. The next Claude instance reads it at the START.
