# CYOAhub

**Multiplayer AI-powered RPGs** -- choose a world, build a party, and let the AI Game Master take you on an adventure.

## What Is CYOAhub?

A system-agnostic multiplayer RPG platform. The AI GM, async multiplayer engine, combat system, and UI are shared infrastructure. Worlds are pluggable config files that define everything -- stats, classes, combat, progression, theme, lore, enemies, and GM personality. Change the world, change the entire game.

### Official Worlds

| World | Description |
|-------|-------------|
| **Stormlight Chronicles** | Cosmere RPG -- 10 Radiant Orders, Surgebinding, Shardblades, 5-Oath progression |
| **D&D 5e** | Official Basic Rules -- 4 classes, 4 races, 6 backgrounds, spells, monsters |
| **The Wretched Deep** | Dark obsession-driven RPG -- 5 archetypes, Corruption mechanics, the Hollow Crown |

### Build Your Own

The 7-step World Builder wizard lets anyone create a fully custom world -- name, lore, magic system, stat system (16 presets), enemy types (24 categories spanning fantasy and sci-fi), ambient audio (21 soundscapes), GM personality, visual theme, and more. Publish to the Community Hub for anyone to play.

## Quick Start

1. Open `index.html` in a browser (or visit the GitHub Pages URL)
2. Pick **Enter a World** or **Create a World**
3. Choose a world, create your character, invite friends, and play

## Architecture

```
cyoahub/
  index.html                    -- 9 screens: 3 hub + 6 game (hash routing)
  app/
    systems/
      stormlight.js             -- Stormlight Chronicles system data
      dnd5e.js                  -- D&D 5e system data (Basic Rules)
      wretcheddeep.js           -- The Wretched Deep system data
      custom.js                 -- Builds SystemData from wizard worldConfig
    enemyPatterns.js            -- Shared enemy library (24 categories, 100+ patterns)
    configDefaults.js           -- Default world config template + deep-merge
    configValidator.js          -- Schema validation engine
    formulaEngine.js            -- Safe formula parser (no eval)
    configResolver.js           -- Universal config helpers (20+ functions)
    pluginRegistry.js           -- Extension system for new modules
    actionEngine.js             -- Config-driven action resolution
    gameState.js                -- System loader, state, game mechanics
    rulesEngine.js              -- window.Rules API (dice, combat, conditions)
    hub.js                      -- Landing, wizard, router, world picker
    ui.js                       -- UI rendering, Sheets API, WebSocket, audio
    combat.js                   -- 5-phase combat, AI GM narration, bosses
    main.js                     -- GSAP animations, Lenis scroll, effects
    devMode.js                  -- Dev tools (activated via ?dev=1)
  api/
    client.js                   -- Network layer, SSE streaming
  styles/
    base.css                    -- Design tokens + reset
    hub.css                     -- Hub screens + themes
    animations.css              -- Keyframes
    components.css              -- Game UI components
  MARKDOWNS/                    -- Documentation, rulebooks, session notes
  GameCardImgs/                 -- Card art for worlds
  CompanionOrIcon/              -- Companion/class images
```

### How Worlds Work

Every world is a single config object that defines:

- **`rules`** -- defenses, HP formula, focus, magic pool, recovery, currency, progression, equipment
- **`charCreation`** -- creation paths, labels, origins, stat allocation, submit text
- **`combatActions`** -- action types with tags, keywords, costs, phases
- **`gmContext`** -- world name, lore, tone, magic rules, NPC flavor, choice tags
- **`theme` / `themeVars`** -- full visual identity (colors, fonts, effects)
- **`classes`, `ancestries`, `weapons`, `enemies`, `locations`** -- all game content

The engine reads from config at every decision point. Nothing is hardcoded.

### Script Load Order

```
systems/*.js -> enemyPatterns.js -> configDefaults.js -> configValidator.js ->
formulaEngine.js -> configResolver.js -> pluginRegistry.js -> actionEngine.js ->
gameState.js -> rulesEngine.js -> hub.js -> ui.js -> combat.js -> main.js -> devMode.js
```

## Tech Stack

- **Frontend**: Vanilla JS, Tailwind CSS, GSAP, Lenis
- **AI**: Claude API via Cloudflare Worker proxy (Sonnet for narrative, Haiku for choices)
- **Multiplayer**: Cloudflare Durable Objects + WebSockets
- **Persistence**: Google Sheets API (campaigns, world library)
- **Audio**: Procedural synthesis via Web Audio API (21 ambient presets)
- **Hosting**: GitHub Pages

## Infrastructure

| Service | URL |
|---------|-----|
| Live Site | `rruss1.github.io/CYOAHUB` |
| Worker Proxy | `cyoahub-proxy.rruss7997.workers.dev` |

## Adding a New World (Code)

1. Create `app/systems/yourworld.js` with `window.YourSystem = { ... }`
2. Include `rules`, `charCreation`, `combatActions`, `gmContext`, `theme`, and character data
3. Add entry to `loadSystem()` in `gameState.js`
4. Add a world card to `#worlds-grid` in `index.html`
5. Set `enemyCategories` to pick from the shared library (fantasy + sci-fi)

Or skip all that and use the World Builder wizard -- no code needed.

## Dev Mode

Add `?dev=1` to the URL to activate developer tools:
- **Ctrl+Shift+D** -- live config editor panel
- Console: fallback usage report, validation warnings
- Export current world config as JSON

## License

Game content is original. D&D 5e Basic Rules content used under Wizards of the Coast OGL/Creative Commons. Stormlight Archive setting inspired by Brandon Sanderson's Cosmere.
