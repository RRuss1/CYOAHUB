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

### Desktop Session — 2026-03-31 (Massive Feature Drop)

#### 1. Stat Pool Display Fix (`app/ui.js` + `index.html`)
- All hardcoded `12` and `3` replaced with dynamic `ATTR_POINTS_START` / `ATTR_MAX_CREATE`
- Hint text, allocation message, error text, per-stat `/max` all dynamic now

#### 2. Era-Based Weapon Pools (`app/systems/custom.js`)
- New `_ERA_WEAPON_POOLS` constant — 8 full eras, each with `heroWeapons`, `weapons`, `startingKits`, `armors`:
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

#### 3. Wizard Era Options Expanded (`index.html`)
- Added **Colonial** and **Modern** to era selector (8 total, chronological order)

#### 4. Starting Kit Fonts Enlarged (`app/ui.js`)
- Kit card text bumped from 10-11px → 12-15px for readability

#### 5. All Kit Expertise Nulls Filled
- Every era kit now has an expertise label (Warfare, Survival, Lore, Military, Underworld, etc.)

#### 6. Image Upload Compression (`app/hub.js`)
- New `_compressImage()` — resizes to 1200px max, JPEG at 0.8 quality
- Progressive retry at lower quality if still over 2MB
- Both class image and card image uploaders use it
- Effectively eliminates "file too big" errors

#### 7. World Card Image Uploads (4 max per user)
- Upload tile in card image picker with `+` button and counter
- Hidden file input, R2 upload, auto-select on success
- Dashed teal border styling for the upload tile

#### 8. Paperdoll Character Sheet Modal (Phase A)
**New files:**
- `assets/paperdoll/fantasy.svg` — Ancient/Medieval/Renaissance/Timeless
- `assets/paperdoll/colonial.svg` — Colonial era
- `assets/paperdoll/modern.svg` — Modern era
- `assets/paperdoll/postapoc.svg` — Post-Apocalyptic
- `assets/paperdoll/scifi.svg` — Futuristic/Sci-Fi

**Modal system:**
- Full overlay modal in `index.html` (`#charsheet-modal`)
- Two-column layout: paperdoll left (with class image background at 25% opacity), stats right
- Equipped items shown as text labels overlaid on paperdoll slots (weapons, armor, kit)
- Class/race image layered behind SVG silhouette via `.cs-paperdoll-bg`
- Inventory grid below paperdoll showing all equipment, loot, fragments
- Stats, defenses, abilities, surge skills, bonds, ideals, origins — all rendered
- 📋 icon button on every **ppip party card** (story screen) and **combat card** (combat screen)
- Old `▸ Character Sheet` button now redirects to the new modal
- Escape key closes modal, click-outside closes modal
- ~130 lines of new CSS in `components.css`

#### 9. Wizard Expansions — 8 New World-Building Fields (Phase B)
All added to `index.html` wizard and wired through `hub.js` → `worldConfig` → `custom.js build()` → GM prompt:

| Field | Location | Options |
|-------|----------|---------|
| Morality System | Step 4 | Good/Evil, Honor/Shame, Corruption, Karma, None |
| Climate & Weather | Step 4 | Temperate, Desert, Frozen, Tropical, Toxic, Void, Mixed |
| NPC Dialogue Style | Step 6 | Full sentences, Terse grunts, Court speech, Alien syntax, Slang |
| Rest & Recovery | Step 6 | Safe, Risky, No Rests, Time-Limited |
| Loot & Rewards | Step 6 | Sparse, Balanced, Generous, Crafting Only |
| Win Condition | Step 6 | Defeat Boss, Survive Rounds, Collect Artifacts, Escape, Open-Ended |
| Lose Condition | Step 6 | TPK, Corruption Max, Time Out, Narrative Only |
| Difficulty Curve | Step 6 | Punishing, Balanced, Cinematic, Adaptive |

#### 10. World Systems Engine — `app/worldSystems.js` (Phase C)
**New file: ~400 lines.** Houses 9 runtime gameplay systems:

1. **Skill Checks** — `[CHECK:stat:dc]` tags in GM choices trigger d20+stat rolls
2. **Faction Reputation** — per-faction rep tracker, `[FACTION:name:±N]` tags
3. **Loot Engine** — post-combat drops with rarity tiers (Common→Legendary), loot-style-aware frequency
4. **Dynamic Difficulty** — adaptive/punishing/cinematic enemy scaling
5. **Win/Loss Checker** — evaluates conditions after each GM turn
6. **Rest & Recovery** — safe/risky/no-rest/time-limited mechanics
7. **Weather System** — per-climate weather tables with HP costs and mechanical effects
8. **NPC Generator** — dialogue style + faction awareness injected into GM prompt
9. **Morality Tracker** — `[MORALITY:±N]` tags, axis-aware labels (Righteous↔Evil, Honored↔Disgraced, etc.)

**Wiring:**
- `worldSystems.js` added to script load order in `index.html` (after storyEngine, before hub)
- `WorldSystems.initAll(gState)` called on game enter in `ui.js`
- `WorldSystems.getGmContextBlock(gState)` appended to dynamic block in `getAiDmSystemPrompt()`
- `WorldSystems.processGmResponse(gState, text)` called after every GM response in `combat.js`

---

### ACTION REQUIRED — Update Your Sci-Fi vs Robots Custom World

**Step 1: Find your world ID:**
```sql
SELECT id, config->>'name' AS name, config->>'era' AS era FROM world_library WHERE system = 'custom';
```

**Step 2: Run this single UPDATE to set era, weapons, AND all new gameplay fields:**
```sql
UPDATE world_library
SET config = config
  || '{"era": "Futuristic"}'::jsonb
  || '{"moralityAxis": "None — Moral ambiguity"}'::jsonb
  || '{"climate": "Void / Space — No atmosphere"}'::jsonb
  || '{"npcDialogue": "Alien / strange syntax"}'::jsonb
  || '{"restRules": "Risky Rests — Roll for interruptions"}'::jsonb
  || '{"lootStyle": "Balanced — Regular rewards"}'::jsonb
  || '{"winCondition": "Defeat the Final Boss"}'::jsonb
  || '{"loseCondition": "Total Party Kill"}'::jsonb
  || '{"difficulty": "Adaptive — Scales to party performance"}'::jsonb
  - 'heroWeapons' - 'weapons' - 'startingKits' - 'armors'
WHERE id = '<your-world-id>'
  AND system = 'custom';
```

This does everything at once:
- Sets era to **Futuristic** → unlocks Plasma Blasters, Rail Rifles, Vibro-Blades, Smart Pistols, etc.
- Strips old medieval weapon fallbacks so the Futuristic era pool kicks in
- Sets climate to **Void/Space** → weather table includes solar flares, micrometeorites, radiation
- Sets NPC dialogue to **Alien/strange syntax** → robots and AI entities speak differently
- Sets difficulty to **Adaptive** → enemies scale based on how well the party is doing
- Sets win condition to **Defeat the Final Boss** → gives the campaign a clear endpoint
- Sets rest to **Risky** → can't just heal freely, robots might find you
- Strips morality (robots don't judge, you just survive)

**Step 3: Run pending migrations:**
```sql
-- Run these in order in the Neon console:

-- 006: narrative craft knowledge base
-- (paste contents of db/migrations/006_narrative_craft_kb.sql)

-- 007: user upload tracking
-- (paste contents of db/migrations/007_user_uploads.sql)

-- 008: era backfill + stale weapon strip
-- (paste contents of db/migrations/008_backfill_era_weapon_pools.sql)
```

### Migrations — All Applied
- [x] `006_narrative_craft_kb.sql` — narrative techniques table
- [x] `007_user_uploads.sql` — user upload tracking table
- [x] `008_backfill_era_weapon_pools.sql` — era backfill + stale weapon strip
- [x] `009_indexes_and_fk_fixes.sql` — indexes on owner_id/published, FK on user_uploads + campaigns

#### 11. Bug Squash + Wiring Pass (same session, continued)

**Console.log cleanup (`hub.js`):** Removed 5 debug `[WorldGrid]` logs. Kept compression log.

**CSS blur fix (`animations.css`):** Removed `filter: blur()` from `stormlightIn` and `depthIn` keyframes — this was causing blurry text on screen transitions.

**Skill checks wired into choice buttons (`ui.js`):**
- `[CHECK:stat:dc]` tags parsed from GM choice text
- Displayed as blue `DEX DC 15` pill badge on the choice button
- On submit: d20+stat rolled, result string appended to action text sent to GM
- GM receives `[SKILL CHECK: SUCCESS — d20(14) + DEX(3) = 17 vs DC 15]` with the player's action

**Loot drops wired into combat resolution (`combat.js`):**
- `WorldSystems.processPostCombat(gState, 'win'|'loss')` called in `exitCombat()`
- Each surviving player rolls for loot based on loot style setting
- Drops shown as toast notifications: `"Player found: ⚔ Enchanted Weapon (Rare)"`

**Victory/defeat screen (`combat.js`):**
- `_showEndScreen(message, isVictory)` — full-screen overlay with icon, title, message
- "Continue Playing" and "Back to Worlds" buttons
- Triggered by `processGmResponse` when win/loss conditions met

**Weather indicator + Rest button (`index.html` + `ui.js`):**
- Weather name shown in chronicle header bar (auto-updates on renderAll)
- `⛺ REST` button in chronicle header — heals party, risky rests can trigger ambush combat
- Hidden during combat and when rest rules are "No Rests"

**Toast notification system (`combat.js`):**
- `_showToast(text, color)` — bottom-center pill, auto-dismiss after 3s, stacks vertically
- Used for loot drops, rest results, weather changes, faction shifts

**All migrations confirmed run** (006, 007, 008).

#### 12. Loot Tables Expanded + DB Audit + Prompt Refactor (same session, continued)

**Era-specific loot tables (`worldSystems.js`):**
- Replaced 4-item generic table with **7 full era tables** (Ancient, Medieval, Renaissance, Colonial, Modern, Post-Apoc, Futuristic)
- Each era has weapon/armor/consumable/misc categories with 4-8 items each, rarity 0-4
- Examples: Futuristic → Singularity Cannon, Nanite Swarm Injector, AI Chip Fragment, Void Walker Suit
- Post-Apoc → Nuclear Fist, Stimpak, Pre-War Power Armor, Mutant Gland
- `rollLoot()` now calls `_getLootTable()` which picks era from `SystemData._era`

**DB migration 009 (`db/migrations/009_indexes_and_fk_fixes.sql`):**
- Added indexes: `idx_campaigns_owner`, `idx_world_library_owner`, `idx_world_library_published`
- FK: `user_uploads.user_id → users(id) ON DELETE CASCADE`
- FK: `campaigns.owner_id → users(id) ON DELETE SET NULL` (prevents orphaned campaigns)
- **Migration applied to Neon DB.**

**GM prompt refactored into slot architecture (`combat.js`):**
- Old monolithic `getAiDmSystemPrompt()` replaced with `_PROMPT_SLOTS` registry
- **Stable slots** (cached): `identity`, `format`, `world`, `craft`, `choices`
- **Dynamic slots** (per-turn): `narrative`, `worldSystems`
- Each slot tagged with `[SLOT NAME]` header for AI boundary awareness
- Runtime API: `window.PromptSlots.set(name, fn, isDynamic)`, `.remove(name)`, `.list()`
- Plugins/systems can add/replace/remove prompt sections without touching the core

#### 13. Paperdoll Visual Fix + World Editor Button (same session, continued)

**Paperdoll SVG fix (all 5 SVGs):**
- Body silhouette changed from `fill="url(#bodyGrad)"` → `fill="none"` (no more blue overlay)
- Stroke reduced to `opacity: 0.3`, `stroke-width: 1` (faint outline only)
- Slot box fill reduced from `rgba(0,0,0,0.3)` → `rgba(0,0,0,0.15)` (subtle)
- Background image bumped from `opacity: 0.25 + saturate(0.6)` → `opacity: 0.85` (full color character art)

**World Editor button moved to chronicle header bar:**
- New `🎨 EDIT` button in chronicle header (next to weather + rest)
- Visible at all times during gameplay for custom worlds
- Same `toggleThemeEditor()` function, just accessible location
- Old button below story card still works as fallback

#### 14. Pure Narrative Mode — Non-Combat Worlds (same session, continued)

**Wizard:**
- "Combat" field moved from Step 6 → **Step 1** (World Identity), right after Technology Level
- New first option: **"None — Pure Narrative"** with description: "disables all combat for a story-only experience"
- Old duplicate removed from Step 6

**Engine — 4 combat triggers gated by `_isCombatDisabled()`** (`gameState.js`):
- Beat counter (NPC turn handler, `ui.js`)
- Beat counter (human turn handler, `ui.js`)
- `[COMBAT]` tag from player choices (`ui.js`)
- Combat screen transition check (`ui.js`)

**GM prompt changes when combat disabled:**
- `[WORLD]` slot appends: "PURE NARRATIVE MODE: This world has NO combat. Never generate fights, enemies, or violence. Focus on story, dialogue, exploration, mystery, relationships, discovery. Never use [COMBAT] or [ATTACK] tags."
- `[CHOICES FORMAT]` slot: tags swap to `[DISCOVERY], [DECISION], [SKILL]` only; approaches become "investigative, diplomatic, emotional, bold"

**Data flow:**
- `combatFrequency` stored in worldConfig (`hub.js`) and on SystemData as `_combatFrequency` (`custom.js`)
- `_isCombatDisabled()` in `gameState.js` checks if it starts with "None"

**Result:** A world set to "None — Pure Narrative" gets zero combat — no enemies, no combat screen, no beat counter. Pure story, dialogue, skill checks, faction politics, and exploration.

---

### Desktop Session — 2026-03-31 (Evening — Inventory & Cleanup)

#### 15. Spren Images Behind Paperdoll (`app/ui.js`)
- `_getClassBgImg(p)` now falls back to spren images for Stormlight when no class `imgUrl` exists
- Radiants get their bonded spren (from `SPREN_IMG_MAP`), Heroes get a deterministic random spren (from `HERO_SPREN_POOL`)
- Also wired D&D 5e class/background images behind paperdoll as bonus
- Uses existing `.cs-paperdoll-bg` CSS (opacity 0.85, z-index behind SVG)

#### 16. Equip/Swap Inventory System (`app/ui.js` + `styles/components.css`)
- New functions: `equipItem(invIdx)`, `unequipItem(type, slotIdx)`, `_toInventoryItem(equipped, type)`
- `_csPlayerIdx` tracks which player the modal is showing
- **Weapon equip**: adds to `p.weapons[]` (max 2), displaces oldest weapon to inventory if full
- **Armor equip**: swaps current armor to inventory, parses deflect from item detail or uses `rarity + 1`
- **Unequip**: moves equipped item back to inventory as loot-format object
- Paperdoll modal redesigned:
  - Equipped items: gold border, `EQUIPPED` badge, `✕` unequip button
  - Inventory items: `EQUIP` button on weapons/armor, rarity color left-border
  - Inventory grid changed from CSS grid to flex column for better item+button layout
- Auto-saves via `saveAndBroadcast` and re-renders party strip after every equip/unequip
- Handles both kit format (`{name, dmg, dmgType}`) and loot format (`{name, detail, rarity, icon, type}`)

#### 17. GM Item Granting (`app/worldSystems.js` + `app/combat.js`)
- New tag: `[ITEM:name]` or `[ITEM:type:name]` or `[ITEM:type:name:detail]`
- Types: weapon, armor, consumable, misc (defaults to misc if no type given)
- `parseItemTags(text)` + `applyItemGrants(gs, items)` — grants to all living non-NPC players
- Wired into `processGmResponse()` pipeline alongside faction/morality tags
- Toast notification on each grant: "Received: ⚔ Flame Sword"
- Both `processGmResponse` call sites in `combat.js` (story turn + combat turn) show toasts
- GM prompt instruction added to `getGmContextBlock()`: tells AI the tag syntax and when to use it

#### 18. GM Prompt — Inventory Awareness (`app/combat.js`)
- `getCharContext()` now includes `player.inventory[]` in the prompt context
- Format: `"Inventory: Flame Sword (+2 fire damage), Healing Potion (Restore 10 HP)"`
- Weapon display handles both kit format (`1d8 keen`) and loot format (`+2 fire damage`)
- Armor deflect uses `armor.deflect` with fallback to `p.deflect` (handles both kit and loot armor)
- GM can now reference looted/granted items narratively in future turns

#### 19. Old Character Sheet Removal (~150 lines dead code)
- `index.html` — removed old `▸ Character Sheet` button, duplicate `🎨 Edit Theme` button, `sheet-panel` div
- `app/combat.js` — gutted `renderSheet()` (~100 lines), `toggleSheet()` now just calls `openCharSheet()`
- `app/gameState.js` — removed `sheetOpen` variable
- `styles/components.css` — removed `.sheet-panel`, `.sheet-row`, `.sheet-lbl`, `.sheet-val`, `.sheet-toggle` rules
- `styles/base.css` — removed print media query references for old sheet classes

#### 20. renderAll Monkey-Patch Fix (`app/ui.js`)
- `updateWeatherIndicator()` and `updateRestButton()` moved directly into `renderAll()` function body
- Deleted the fragile monkey-patch wrapper that saved `_origRenderAll` and replaced `window.renderAll`
- No more risk of breakage if `renderAll` is reassigned or re-declared

#### 21. Sci-Fi vs Robots World — DB Update (SQL)
- Generated and ran SQL to update custom world config:
  - Era → Futuristic (Plasma Blasters, Rail Rifles, Vibro-Blades, Smart Pistols)
  - Climate → Void/Space, NPC Dialogue → Alien/strange syntax, Difficulty → Adaptive
  - Rest → Risky, Loot → Balanced, Win → Defeat Boss, Lose → TPK, Morality → None

#### Bug Confirmed Fixed
- `performRest()` already persists to DB — `onRest()` calls `saveAndBroadcast(gState)` at line 5249. Known issue was stale.

---

### Desktop Session — 2026-04-01 (Hardening & Polish)

#### 1. Pure Narrative Mode — Character Creation & Sheet (`app/systems/custom.js`, `app/ui.js`, `index.html`)
- When `combatFrequency` starts with "None", character creation now hides:
  - Weapon selection (`showWeapon: false`)
  - Starting Kit section (`showKit: false`, new `id="create-s4-kit"` on wrapper div)
- Character sheet modal (`renderCharSheetModal`) in pure narrative mode hides:
  - Paperdoll SVG + slot overlays (entire left column)
  - Equipment & Inventory section
  - HP and investiture from header subtitle
  - Defenses, Combat stats, Abilities, Surge Skills
- Still shows: name, class, level, Attributes, Bond, Ideals, Talent, Origins
- Detection via existing `_isCombatDisabled()` function

#### 2. System Tag Stripping — Clean Narrative Display (`app/combat.js`, `app/ui.js`)
- `cleanScene()` in combat.js now strips: `[ITEM:...]`, `[FACTION:...]`, `[MORALITY:...]`, `[CHECK:...]`, `[COMBAT]`, `[ATTACK]`
- `renderStory()` in ui.js also strips same tags when rendering stored log entries on reload
- Tags are still parsed for game effects (items granted, faction rep changed, etc.) before being stripped from display

#### 3. Chronicle Card Stability — Less Jank (`styles/components.css`)
- `.story-text`: `min-height: 280px`, `max-height: 52vh`, `overflow-y: auto` — content scrolls inside stable container instead of resizing the card
- `.bottom-zone`: `min-height: 80px` — state swaps don't collapse footer
- Mobile breakpoints: tuned min/max heights (200px/60vh at 640px)

#### 4. Bottom-Zone Transitions — Crisp State Machine (`app/ui.js`)
- New `_showBottomPanel(id)` helper — hides all 4 panels, shows target with 0.18s opacity fade
- Replaced all scattered manual `display:none/block` toggles in `setBottomLoading`, `setBottomReadGate`, `setBottomContinue`, `setBottomWaiting`, `onContinue`
- Eliminated redundant double-set hacks in `setBottomContinue`

#### 5. Wizard Readability & Scroll Fix (`styles/hub.css`, `app/hub.js`)
- `renderStep()` now calls `scrollIntoView({ behavior: 'smooth', block: 'start' })` on step change — every step snaps to top
- Font size reductions across all wizard elements:
  - `.wstep-eyebrow`: 18px → 11px
  - `.wstep-title`: 24px → 20px
  - `.wlabel`: 18px → 12px
  - `.winput`: 22px → 15px
  - `.wopt`: 18px → 12px
  - `.wiz-back` / `.wiz-next`: 18px → 13px
- Mobile overrides updated to match

#### 6. Custom World ID Detection — `startsWith('custom-')` Purge (4 files)
- **Root cause**: Custom worlds from wizard get `custom-{timestamp}` IDs, but DB-loaded worlds get UUID IDs. All `startsWith('custom-')` guards failed for DB worlds.
- **`gameState.js`** — `loadSystem()`: official systems load directly, everything else treated as custom
- **`hub.js`** — `onEnterGameWorld()` + `_loadWorldFromId()`: replaced `startsWith('custom-')` with `!_officialIds.includes(worldId)`
- **`ui.js`** — `showGameScreen()` isCustom check + `saveThemeColors()` guard: same pattern
- This fixed: world editor button not showing, class names/images lost, card images lost

#### 7. World Editor Button Moved to Audio Bar (`index.html`, `app/ui.js`)
- Removed `🎨 EDIT` button from chronicle header bar
- Added as first element inside `#audio-bar` with vertical separator
- Sits at z-index 200 with audio controls, not covered by logged-in pill

#### 8. Custom World Config Persistence Fix (`app/systems/custom.js`, `app/gameState.js`)
- **Classes preserved on DB reload**: `build()` now checks if `cfg.classes` has fully-built objects (with `.id` field) and uses them directly instead of always rebuilding from `wizClasses`. Fixes custom class names, images, abilities lost on reload.
- **Card image carried through**: `cardImage: cfg.cardImage || ''` added to `build()` output so round-trip saves don't lose it.
- **System ID preserved**: `loadSystem()` now stamps `cfg.id = cfg.id || systemId` before calling `build()`, preventing new ID generation on each reload. **This fixed the infinite hash-change loop** where refreshing on a game URL caused the screen to flash and the ID to climb thousands of times.

#### 9. Card Image Sync Fix (`app/hub.js`, `app/ui.js`)
- `saveThemeColors()` now calls `_saveWorld(sys)` after DB save to keep localStorage in sync
- `renderWorldsGrid()` merges DB config fields (cardImage, classes) into local copy before rendering, so DB-updated images show correctly even with stale localStorage

#### 10. Cleanup
- Deleted `CYOAhubfiles/` folder and all contents (duplicate of `GameCardImgs/`, nothing referenced it)

### Known Issues / Next Session
- [ ] Mobile layout + per-world fonts still untested
- [ ] World editor image management untested end-to-end (upload/remove cycle with R2)
- [ ] Consumable usage — potions/medkits exist as inventory items but no "Use" mechanic yet
- [ ] Kit extras (`kitExtras`) never populated during character creation — field is referenced in display but always empty
- [ ] Crafting system — fragments accumulate but have no use yet (pluginRegistry exists but not wired to inventory)
- [ ] Card image may need re-save from editor if DB stored a pre-fix config without `cardImage`

### File Counts (updated)
- **app/systems/**: 4 files — ~3,200 lines
- **app/*.js**: 18 files — ~21,000 lines
- **styles/*.css**: 4 files — ~4,550 lines
- **index.html**: ~1,580 lines
- **assets/paperdoll/**: 5 SVGs
- **db/migrations/**: 9 files (all applied)
- **Total JS**: ~24,200 lines

---

### Previous Session Summary (Desktop — 2026-03-31)

Items 1-21: Stat pool fix, era weapons, wizard expansions, paperdoll modal, world systems engine, equip/swap, GM item granting, inventory awareness, old sheet removal, renderAll fix, pure narrative mode, loot tables, DB migration 009, prompt slot architecture, spren images, bug squash. See above for details.

### Previous Session Summary (Desktop — 2026-03-30 AM)

Built: dnd5e.js, wretcheddeep.js, custom.js, enemyPatterns.js, 7-step wizard, world library, auth, campaign ownership, theme pipeline, full dynamic character creation, ambient audio, mobile responsive, spren images, routing fixes, combat heal fix, stale doc sweep. See git log for details.

---

> **Convention**: Update this file at the END of each session. The next Claude instance reads it at the START.
