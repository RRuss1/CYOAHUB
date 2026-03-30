# LAPTODESK — Session Handoff Notes
> Shared context between Desktop Claude and Laptop Claude.
> Update this at the end of every session with what was done and what's pending.

---

## Last Updated: 2026-03-30 (Desktop Session)

### What Was Done This Session (Desktop)

**New Systems Built:**
- `app/systems/dnd5e.js` — D&D 5e Basic Rules (4 classes, 4 races, 6 backgrounds, 23 spells, 21 weapons)
- `app/systems/wretcheddeep.js` — The Wretched Deep (dark horror, 4 classes, 4 ancestries, corruption mechanic)
- `app/systems/custom.js` — Custom world builder with `build(cfg)` that produces 57-field SystemData from wizard
- `app/enemyPatterns.js` — 15 categories, 57 patterns, 200+ enemy variants

**Architecture Changes:**
- **Const alias trap fixed** — all 47 `const X = _sys.field` replaced with `Object.defineProperties(window, {...})` getters that read `window.SystemData` live. System swap works now.
- **AI_DM_SYSTEM_PROMPT no longer cached** — rebuilt on each GM call via `_currentSystemPrompt()`
- **Full theme pipeline** — each system defines `themeVars` (25+ CSS variables). `_applyFullTheme()` in ui.js sets all vars on screen change. Hub screens reset to CYOAhub defaults.
- **Campaign ownership** — localStorage + DB auth hybrid. Delete button only on owned campaigns/worlds.
- **World Library** — publish to DB via `/db/worlds`, prefetch on landing, render community cards.
- **Per-world campaign hubs** — campaigns tagged with `system`/`worldId`, filtered on render.

**World Builder Wizard (7 steps):**
- 16 stat systems, 15 ambient audio presets, 15 enemy categories
- 8-color theme system, UI style presets, background effects, card/button styles
- World rules engine (physics, death, time, travel, dialogue)
- Playable races field → generates ancestries in custom.js
- Clickable wizard dots for back/forward navigation
- All form values captured in `finishWizard()` → worldConfig → `CustomSystem.build()`

**UI/UX:**
- Spren SVGs replaced with images from `CompanionOrIcon/Spren/` and `CompanionOrIcon/DnDClasses/`
- Ambient audio system — 15 procedural presets, system-aware
- Audio bar only shows in game/combat screens
- Shimmer + 3D tilt on all cards (hero + world)
- CYOAhub platform palette: teal `#28a8a0` for platform, gold only for Stormlight cards
- Cream backgrounds for modals (`--cream-off`, `--cream-light`)
- Bright glow palette for card edges (`--glow-mint`, `--glow-cerulean`)
- Mobile responsive layout
- FAQ/Feedback/Contribute modals (global, accessible from all screens)
- Hamburger menu on worlds page + campaign page
- Dynamic character creation (ancestries, classes, roles all from SystemData)
- Late join = seamless NPC takeover (no character creation needed)
- Absent player auto-pilot in combat and story mode
- Campaign invite link sharing (copy to clipboard)

**Routing Fixes (critical):**
- Deep link handling for `#create/world/campaign`, `#title/world/campaign`, etc.
- `hubBoot()` differentiates `#worlds` and `#wizard` from `#landing`
- `routeFromHash()` handles all 6 game screens with async state loading
- Removed duplicate boot IIFE from ui.js — main.js is single boot authority
- `loadSystem()` called in `onEnter()` before character creation

**Bug Fixes:**
- Combat heal always heals (min 1 HP, no backlash)
- Heal stat fallback chain (wil→wis→spirit→mind→int→obsession)
- Combat action regex expanded for D&D spells
- Boss templates, env hazards, atmosphere text all system-aware
- `[REVIVE]` tag now recognized in choice button parsing
- All hardcoded Stormlight strings replaced with dynamic gmContext references

**Stale Doc Sweep:**
- All MARKDOWNS/ and CYOAhubfiles/ docs updated: StormlightBRJ→CYOAHUB, stormlight-proxy→cyoahub-proxy
- FAQ updated to reflect current build

### What the Laptop Built (found on re-examine)

These files were added on the laptop and are now integrated:
- `app/auth.js` — JWT auth + Google OAuth + invite system
- `app/actionEngine.js` — Config-driven action resolution
- `app/storyEngine.js` — Narrative intelligence (NPCs, factions, threads, style modifiers)
- `app/formulaEngine.js` — Safe math parser
- `app/configDefaults.js` — Default config with `resolveWithDefaults()`
- `app/configResolver.js` — Universal rules facade
- `app/configValidator.js` — Schema validation + auto-repair
- `app/pluginRegistry.js` — Extension system
- `app/devMode.js` — Developer tools
- Persistence moved from Google Sheets to Neon DB via `_dbFetch('/db/...')`
- `stormlight.js` expanded with `charCreation`, `combatActions`, `rules` blocks

### Known Issues / Next Session

- [ ] Joe's character creation crash — need his console output. Try-catch + lobby fallback added. `loadSystem` ensured before `renderCreate`. But root cause may be DB auth or missing config.
- [ ] Visual identity options (UI Style, bg effects, card style) — CSS exists but not fully polished
- [ ] D&D rulesEngine integration — `dnd_*` functions added but `configResolver.js` may override them
- [ ] `actionEngine.js` vs legacy `getActionBucket()` — ActionEngine takes priority when loaded, legacy never runs
- [ ] Tailwind CDN warning in console — harmless, can purge later
- [ ] Chronicle export was nuked (user request)
- [ ] Per-world font loading — wired but untested
- [ ] Mobile layout — basic responsive added but untested on real devices

### File Counts (current)
- **app/systems/**: 4 files (stormlight, dnd5e, wretcheddeep, custom) — 2,770 lines
- **app/*.js**: 16 files — 16,156 lines
- **styles/*.css**: 4 files — 4,379 lines
- **index.html**: 1,477 lines
- **Total JS**: ~18,926 lines

---

> **Convention**: Update this file at the END of each session. The next Claude instance reads it at the START.
