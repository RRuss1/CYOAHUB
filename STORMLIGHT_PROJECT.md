# ⟁ Stormlight Chronicles — Project Overview & Trajectory

**Live URL:** https://rruss1.github.io/StormlightBRJ/  
**Repo:** github.com/rruss1/StormlightBRJ  
**Stack:** Single-file HTML/CSS/JS · Google Sheets API · Anthropic Claude API · Cloudflare Worker

---

## What It Is

A browser-based async multiplayer RPG set in Brandon Sanderson's Stormlight Archive universe. Players build Knight Radiant or Hero of Roshar characters and take turns making choices that shape a 180-turn epic saga across three acts, each set in a different location on Roshar. An AI Game Master (Claude Sonnet) narrates every consequence and generates contextual choices. The game lives at a single URL — players open it whenever they have a free moment, act, and close it. No app install, no accounts, no server to maintain.

---

## Architecture

```
Browser (index.html)
    │
    ├── Google Sheets API v4  →  Persistent state + log storage
    │       JWT auth via Web Crypto API (SA private key in-file)
    │
    ├── Cloudflare Worker     →  Anthropic API proxy (hides key)
    │       stormlight-proxy.goretusk55.workers.dev
    │
    └── Anthropic Claude API
            GM narration:     claude-sonnet-4-20250514
            Summaries/tools:  claude-haiku-4-5-20251001
```

**Google Sheet ID:** `1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw`  
**Service Account:** `stormlightbrj@stormlight-rpg.iam.gserviceaccount.com`  
**Worker URL:** `https://stormlight-proxy.goretusk55.workers.dev`

Per campaign: two Sheet tabs — `Campaign_xyz_State` (JSON blob in A1) and `Campaign_xyz_Log` (one entry per row).

---

## Current Feature Set

### Characters
- **4-step creator:** Type selection → Class/Role → Backstory → Weapon/Stats
- **Knight Radiant** — all 10 orders (Windrunner through Skybreaker), spren bond, 5 oath stages, Shardblade progression
- **Hero of Roshar** — 8 roles (Alethi Soldier, Kharbranth Scholar, Thaylen Merchant, Horneater, Herdazian Fighter, Shin Farmer, Worldsinger, Custom), weapon proficiency (8 weapons, 5 upgrade tiers)
- **Backstory injection** — origin, motivation, 200-char backstory, 80-char appearance all fed into every GM prompt
- **Animated SVG spren companions** — each order has a unique organic animation (Syl flows like water, Spark burns like fire, Wyndle grows like a vine, etc.)
- **Hero role icons** — zoom + pulse animation in the spren card slot

### Gameplay
- 180-turn saga, 3 acts, 34 randomized Roshar locations (different arc every campaign)
- d20 skill checks with stat bonuses, flavor stat names (Blade Strength / Swiftness / Scholar Mind / Scout Eyes / Voice of Command / Endurance)
- **Persistent World Memory** — faction relationships, secrets, met NPCs, key choices tracked across all 180 turns, injected into every GM prompt
- **Branching Act Consequences** — Haiku analyzes choices at act transitions, writes flavor that affects the next act
- **Dramatic storytelling rules** enforced in every prompt — no repeating player actions, start with consequence, vary sentence structure, location-specific sensory detail
- **Phase-aware GM** — knows how many beats until combat, builds tension naturally

### Combat System
- 3–8 exploration beats before each combat (randomized)
- Pre-combat beat reveals the enemy threat dramatically
- **Simultaneous resolution** — all humans pick actions at once, round resolves together
- **Dynamic GM-generated choices** — Haiku generates 4 fresh situational combat options per player per round based on class, enemies, location, round number
- Enemy pools: 5–6 enemies per region, shuffled each combat (never the same pair twice)
- Environmental hazards (location-specific effects)
- Boss encounters (once per act, 3 HP phases, guaranteed drop)
- Healing scales with oath stage; Edgedancer ×1.8, Bondsmith party heals
- Downed mechanic, revive with fragments
- Full dice ticker with CRIT/HIT/MISS/FUMBLE/HEAL color coding
- try/catch error recovery on enterCombat, resolveRound, exitCombat

### Oath Progression
- 5 oaths per order with canonical text
- GM detects story moments matching order ideals and triggers progression
- Mechanical bonuses at each stage
- Oath 4 = Shardplate forming, Oath 5 = Full Radiant

### Multiplayer
- Party size 2–5 configurable at campaign creation
- **Simplified join flow** — any player clicks Create Character, auto-assigned next open slot
- **Slot reservation** — placeholder written to sheet immediately to prevent collision
- 5s lobby polling with live slot updates
- **Skip Turn system** — host can skip any player, any player can self-skip, pre-armed "Away Next" mode arms during someone else's turn and auto-fires when yours arrives
- NPC auto-fill with 60+ Rosharan names
- Late joiner NPC claim — join a game in progress by claiming an NPC's slot

### Voice & Audio
- Procedural storm synthesis (Web Audio API, no files)
- **AUTO button** — continuous TTS toggle, off by default
- Manual 🔈 button always available
- Web Speech API with voice selector (6 profiles mapping to preferred voices)
- Kokoro neural TTS fully removed (was causing 1GB+ RAM in Chrome)
- TTS stripped of `[CHOICES FOR XYZ]`, option labels, and other UI noise

### Thai Language Support
- Full DOM TreeWalker translation — every visible text node in the document
- Fires after every dynamic render (campaign cards, party strip, combat screen, GM narrative)
- Batch translation via Haiku in one API call
- Cached per session

### UI/UX
- 3-column game layout: Action Log | Chronicle | TLDR Summary
- Action Log — every action with d20 roll, stat bonus, total, result badge (`CRIT!` / `SUCCESS` / `PARTIAL` / `FAILED` / `FUMBLE`), timestamp
- TLDR Summary — Haiku generates 2-sentence summary after each GM beat
- Animated HP bars — damage floats, card shake, green shimmer on heal
- Active player card pulses gold during their turn
- Step indicator dots on character creator
- cardSelPulse glow animation on selected cards
- Audio bar fades to 15% opacity when not in use
- Skip button in top bar next to turn pill, context-aware labels

### Export
- Export Chronicle to print/PDF
- Venmo + Cash App donation links with `(XXX) XXX - 6991`

---

## Known Architecture Decisions & Trade-offs

| Decision | Reason | Trade-off |
|---|---|---|
| Single HTML file | Zero build step, GitHub Pages deploy | File is 230KB, harder to maintain long-term |
| Google Sheets for state | Free, persistent, no server | 5-15s polling latency, write collisions possible |
| Cloudflare Worker as proxy | Keeps API key off client | Adds one network hop |
| No WebSocket yet | Not built yet | Multiplayer feels slow between turns |
| Kokoro removed | 1GB+ RAM on Chrome | Neural voice gone, Web Speech only |

---

## Roadmap

### Next Session — Cloudflare Durable Objects (Real-Time Sync)
Replace Google Sheets polling with WebSocket-based real-time sync. One DO per active campaign. Turn transitions drop from 5-15s to under 500ms. See `CLOUDFLARE_SETUP.md` for full implementation plan.

### Near Term
- [ ] Streaming GM responses (token-by-token typewriter effect)
- [ ] Push notifications ("It's your turn" browser notification)
- [ ] PWA manifest (Add to Home Screen, offline caching)
- [ ] Presence indicators (🟢 Online / 🟡 Away / ⚫ Offline)
- [ ] Typing indicators ("Slac is deciding...")
- [ ] View Transitions API for screen changes

### Medium Term
- [ ] CSS Scroll-Driven Animations on chronicle
- [ ] Voice input (Web Speech Recognition)
- [ ] Session replays
- [ ] Consequence board UI (surface worldMemory to players)
- [ ] Shardblade Duels (PvP combat mode)
- [ ] The Hoid System (2% chance he appears, cryptic, never helpful)

### Long Term
- [ ] Illustrated story cards (text-to-image on dramatic moments)
- [ ] Collaborative world map
- [ ] AI-generated campaign covers/titles
- [ ] Cross-campaign shared world memory

---

## File State

| File | Purpose |
|---|---|
| `index.html` | The entire game (~230KB, ~3820 lines) |
| `README.md` | Player-facing documentation |
| `STORMLIGHT_PROJECT.md` | This file — project overview for developers |
| `CLOUDFLARE_SETUP.md` | Step-by-step Durable Objects implementation |

---

## Cost Per Session

| Service | Cost |
|---|---|
| GitHub Pages | Free |
| Google Sheets API | Free |
| Cloudflare Worker | Free |
| Claude Sonnet per GM turn | ~$0.003 |
| Claude Haiku (TLDR + choices + translation) | ~$0.0002/beat |
| **Full 180-turn campaign** | **~$0.54 total** |

---

## Moving to VS Code + Claude Code

The project has outgrown browser-based Claude sessions. Context window fills up, conversation history is lost between sessions, and we can't run local tests or use the filesystem properly.

**Next steps for migration:**
1. Install Claude Code CLI: `npm install -g @anthropic-ai/claude-code`
2. Open the repo folder in VS Code: `code ~/path/to/StormlightBRJ`
3. Run `claude` in the VS Code terminal
4. Drop this `STORMLIGHT_PROJECT.md` and `CLOUDFLARE_SETUP.md` as context at the start of every session
5. Claude Code can read/write files directly, run commands, check git history — no more copy-paste cycles

The project summary files (this file + the Cloudflare guide) serve as the persistent brain between sessions. Start every new Claude Code conversation with: *"Read STORMLIGHT_PROJECT.md and CLOUDFLARE_SETUP.md before we begin."*
