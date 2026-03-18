# ⟁ Stormlight Chronicles

A browser-based multiplayer RPG set in Brandon Sanderson's **Way of Kings** universe — built for friends spread across cities to play together on their lunch breaks, one turn at a time.

**Live:** [rruss1.github.io/StormlightBRJ](https://rruss1.github.io/StormlightBRJ/)

---

## What It Is

Stormlight Chronicles is a shared narrative RPG powered by an AI Game Master (Claude Sonnet). Players each claim a slot, build a Knight Radiant character, and take turns making choices that shape a 180-turn epic saga across three acts — each set in a different, randomly selected location on Roshar.

The game lives at a single shareable URL. Each player opens it on their own device whenever they have a free moment. The story pauses between turns and waits. A **Continue →** button appears at the bottom of every GM scene — you have to read before you can act. When you come back, the full Chronicle is there waiting.

A full 180-turn saga takes roughly 2–3 months of daily lunch breaks and costs less than a dollar in API fees.

---

## Features

### AI Game Master
- **Claude Sonnet** narrates every consequence, generates location-specific story beats, and presents 4 choices each turn tailored to your character class, current scene, and party situation
- **Dramatic storytelling rules** enforced in every prompt — no repeated weapon draws, varied sentence structure, escalating stakes, location-specific sensory detail
- **Persistent World Memory** — tracks faction relationships, discovered secrets, met NPCs, and key choices across all 180 turns. Injected as a compact summary into every GM prompt so the story remembers that you saved that merchant in turn 12
- **Branching Act Consequences** — at act transitions, Haiku analyzes your choices and generates a consequence that flavors the next act's location
- **Phase-aware prompts** — the GM knows how many beats until combat and builds tension accordingly. Final pre-combat beat always reveals the enemy threat

### Characters — All 10 Knight Radiant Orders
**Windrunner · Lightweaver · Edgedancer · Stoneward · Elsecaller · Truthwatcher · Willshaper · Dustbringer · Bondsmith · Skybreaker**

- Full character sheets with stat rolls (4d6 drop lowest), class bonuses, unique surges and abilities
- He/Him and She/Her pronoun selection — consistent throughout all GM narration
- Custom character color shown throughout the UI

### Oath Progression System
- Each Radiant order has 5 distinct canonical Oaths
- The GM detects story moments that match your order's ideal and triggers oath progression
- **Oath 2:** Shardblade manifests · **Oath 3:** Surges strengthen · **Oath 4:** Shardplate begins forming · **Oath 5:** Full Radiant
- Oath level shown in party strip: *Syl Oath 2/5*

### Spren Bond & Companions
- **Named spren per order** — Syl, Pattern, Wyndle, Roksel, Ivory, Glys, Lunu'anaki, Spark, the Sibling, Highspren
- **5 evolution stages** — from distant whisper to living Shardblade
- **Spren memories** — your spren records critical moments and the GM weaves them into future narration
- **Animated SVG spren companions** — each character card has a paired companion card with a unique CSS-animated spren. Syl is a flowing silver ribbon, Pattern is a spinning tessellation, Wyndle a swaying vine, Spark flickering embers

### Combat System
- **3–8 exploration beats** before each combat (randomized) — the GM builds tension naturally toward each conflict
- **Simultaneous round resolution** — all human players pick at the same time, then the round resolves at once
- **Dynamic GM-generated combat choices** — Haiku generates 4 fresh, situationally specific options each round referencing class abilities, current enemies, location, and round number
- **Enemy scaling** — HP scales by act (×1.0 / ×1.5 / ×2.0) and average party blade tier
- **Environmental hazards** — Shattered Plains plateaus collapse, Shadesmar drains fragments, Braize disrupts actions, Urithiru's wards grant defense
- **Boss encounters** — once per act, a named boss with 3 HP phases spawns. Guaranteed equipment drop on defeat
- **Healing in combat** — 4th choice becomes heal when party is injured. Scales with oath stage. Edgedancer ×1.7, Bondsmith heals party
- **Downed mechanic** — 0HP players are downed for the fight, revived at 1HP after combat ends
- **Dice ticker** — shows last 3 rounds of rolls: gold for CRIT, teal for HIT/HEAL, grey for MISS, coral for damage taken

### Highstorm Events
- **8% chance per exploration beat** — a Highstorm strikes the current location
- Survive through class-specific choices for full HP restore + 2 bonus fragments for all

### Shardblade & Equipment
- **Shardblade crafting** — 3 Stormlight Fragments → class-specific named blade
- **5 upgrade tiers** (Nascent → Bonded → Ancient → Living → Divine) — 5 fragments each, +1 combat per tier
- **Shardplate drops** — critical victories can yield Shardplate, shown on all character cards

### Multiplayer
- **Party size 2–5** — configurable at campaign creation
- **Per-slot localStorage** — each device claims its slot; returning players auto-rejoin on any device
- **Lobby live polling** (5s) — slots update in real time; game auto-starts when host begins
- **NPC auto-fill** — empty slots become AI companions who D4-roll choices (zero AI tokens)
- **Combat polling** (8s) — pending actions sync across devices
- **⏭ Skip Turn** — host can skip any player's turn (Joe got a phone call — game doesn't freeze). Any player can also self-skip. Skipped exploration turns advance the beat; skipped combat turns auto-assign a defend action. A system note appears in the Chronicle

### Visual Design
- **Animated HP bars** — damage floats up as a number, bar drains smoothly, card shakes on damage, green shimmer on heal
- **Active player card** pulses gold during their turn
- **Turn transition animation** — ⟁ glyph flares gold, story text fades in on each new beat
- **Story card parallax** — subtle depth shift on the chronicle card as you scroll (desktop)
- **3-column game layout** — Action Log (left) | Chronicle (center) | TLDR Summary (right)
- **Action Log** — every player and NPC action with d20 roll, stat bonus, total, result badge, timestamp
- **TLDR Summary** — Haiku generates a 2-sentence summary after each GM beat

### Voice & Audio
- **Procedural storm synthesis** — Web Audio API generates wind, thunder, and Stormlight hum. Intensity shifts with scene type
- **Neural TTS voice** — Kokoro ONNX (82M parameter model) speaks the full story aloud when 🔈 is tapped. Falls back to Web Speech API
- **Voice selector** — ♂ Michael · ♂ Adam · ♂ Echo · ♀ Emma (British) · ♀ Heart · ♀ Nova
- Voice is stripped from mobile — no data usage

### Thai Language Support
- Toggle `🌐 EN / 🌐 ไทย` on any screen
- All UI labels, story text, and choice tiles translate via Haiku in one batch call
- GM always writes in English (best quality), Haiku translates before display
- Translations cached per session

---

## How to Play

1. Open the link — you land on the **Campaign Picker**
2. Click **+ New Campaign**, give it a name, press Enter
3. Choose **party size** (2–5) then click **Enter the Storm**
4. Build your **Knight Radiant** — pick your Order, choose a color, roll stats
5. Land in the **Lobby** — assign NPCs to empty slots or wait for friends to join
6. Click **Begin the Saga →**
7. The AI GM opens the story. Read it. Scroll down. Click **Continue →**
8. On your turn: pick from 4 choices (or type your own action) then click **Act →**
9. Check back at your next lunch break

---

## All 10 Radiant Orders

| Order | Ideal | Surges | Spren |
|---|---|---|---|
| Windrunner | I will protect those who cannot protect themselves | Gravitation + Pressure | Honorspren (Syl) |
| Lightweaver | I am who I needed when I was young | Illumination + Transformation | Cryptic (Pattern) |
| Edgedancer | I will remember those who have been forgotten | Abrasion + Progression | Cultivationspren (Wyndle) |
| Stoneward | I will be there when I am needed | Tension + Cohesion | Peakspren (Roksel) |
| Elsecaller | I will reach my potential so I may help others | Transportation + Transformation | Inkspren (Ivory) |
| Truthwatcher | I will seek truth, even when it is painful | Progression + Illumination | Mistspren (Glys) |
| Willshaper | I will seek freedom for those in bondage | Transportation + Cohesion | Lightspren (Lunu'anaki) |
| Dustbringer | I will seek self-mastery above all else | Division + Abrasion | Ashspren (Spark) |
| Bondsmith | I will unite instead of divide | Tension + Adhesion | Godspren (the Sibling) |
| Skybreaker | I will follow the law | Gravitation + Division | Highspren |

---

## Spren Bond Evolution

| Turns | Stage | Bonus |
|---|---|---|
| 0–19 | 1 — First Oath | Base class abilities |
| 20–49 | 2 — Shardblade Manifests | +1 combat rolls |
| 50–89 | 3 — Surges Strengthen | +1 combat, +1 heal |
| 90–139 | 4 — Shardplate Forming | +2 combat, +2 heal, partial armor |
| 140–180 | 5 — Full Radiant | +3 combat, +3 heal, full Shardplate |

---

## Locations

34 locations seeded randomly per campaign — a completely different 3-location arc every run:

| Category | Locations |
|---|---|
| Physical Roshar | Urithiru, Shattered Plains, Kholinar, Kharbranth, Thaylen City, Azimir, Purelake, Hearthstone, Rathalas, Reshi Isles, Aimia, Frostlands, Bavland, Herdaz, Jah Keved, Alethkar, Tukar, Triax, Liafor, Emul, Marat |
| Other Worlds | Braize (Damnation), Ashyn, Aimian Sea, Godforge |
| Shadesmar | Sea of Regret, Sea of Souls, Sea of Lost Lights, Nexus of Imagination, Nexus of Truth, Nexus of Transition, Honor's Perpendicularity, Cultivation's Perpendicularity |
| Story Sites | The Honor Chasm, Feverstone Keep, Stormseat (Narak) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Single-file HTML/CSS/JS, no framework, ~3,300 lines |
| Hosting | GitHub Pages |
| Shared state | Google Sheets API v4 |
| GM narration | Claude Sonnet 4 (claude-sonnet-4-20250514) |
| Summaries, translation, choices | Claude Haiku 4.5 (claude-haiku-4-5-20251001) |
| API proxy | Cloudflare Worker |
| Auth | Google Service Account JWT via Web Crypto API |
| Audio | Web Audio API — procedural synthesis, no files |
| Voice | Kokoro ONNX + Web Speech API fallback |
| Fonts | Cinzel + Crimson Pro via Google Fonts |

---

## Setup (Self-Hosting)

### 1. Google Sheets
- Create a new Google Sheet
- Enable **Google Sheets API** in Google Cloud Console
- Create a **Service Account** and download the JSON key
- Share the Sheet with the service account email (Editor access)
- Copy the Sheet ID from the URL

### 2. Cloudflare Worker
Create a free Cloudflare account, make a Worker, add your Anthropic API key as a secret called `ANTHROPIC_KEY`, then paste:

```javascript
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    const body = await request.json();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
```

### 3. Update index.html
Replace these constants near the top of the script:

```javascript
const SHEET_ID = 'your-sheet-id-here';
const PROXY_URL = 'https://your-worker.workers.dev';
const SA = {
  client_email: 'your-service-account@project.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
};
```

### 4. Deploy to GitHub Pages
Upload `index.html` to a public GitHub repo → Settings → Pages → Deploy from branch → main → / (root).

---

## API Costs

| Item | Cost |
|---|---|
| Google Sheets API | Free |
| Cloudflare Worker | Free (100k requests/day) |
| GitHub Pages | Free |
| Claude Sonnet per GM turn | ~$0.003 |
| Claude Haiku (TLDR + translation + combat choices) | ~$0.0002 per beat |
| Full 180-turn campaign | ~$0.54 total |

New Anthropic accounts get $5 free credit — enough for roughly 9 full campaigns.

---

## Contributing

This started as a lunch-break idea and grew into something genuinely deep. If you've played it, forked it, or have ideas — open an issue. The Cosmere is a big universe and we've barely scratched the surface.

---

## Support

If you enjoy the game, help keep the Stormfather awake:

**Venmo: [@goretusker](https://venmo.com/u/goretusker)**  
**Cash App: [$rurich31](https://cash.app/$rurich31)**

API costs run ~$0.003 per turn. Every campaign costs less than a dollar.

---

## License

MIT — fork it, mod it, run your own campaign. Just don't sell it.

---

*"The most important step a man can take. It's not the first one, is it? It's the next one."*  
*— The Way of Kings, Brandon Sanderson*
