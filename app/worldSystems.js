/**
 * app/worldSystems.js — World Gameplay Systems
 * CYOAhub
 *
 * Houses all configurable gameplay systems that flow from the world builder:
 *   - Skill Checks (parse [CHECK:stat:dc] in GM choices)
 *   - Faction Reputation Tracker
 *   - Loot Engine (era-based drop tables)
 *   - Dynamic Difficulty Scaling
 *   - Win/Loss Condition Checker
 *   - Rest & Recovery
 *   - Weather & Environmental Hazards
 *   - NPC Generator Templates
 *
 * All systems read config from window.SystemData and store runtime
 * state on window.gState (the shared game state object).
 */

window.WorldSystems = (() => {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // 1. SKILL CHECKS
  // ══════════════════════════════════════════════════════════════
  // GM choices can include [CHECK:stat:dc] tags.
  // e.g. "I pick the lock [CHECK:dex:15]"
  // The engine rolls d20 + stat vs DC, returns pass/fail result.

  const CHECK_REGEX = /\[CHECK:(\w+):(\d+)\]/i;

  function parseSkillCheck(choiceText) {
    const m = choiceText.match(CHECK_REGEX);
    if (!m) return null;
    return { stat: m[1].toLowerCase(), dc: parseInt(m[2]) };
  }

  function rollSkillCheck(player, stat, dc) {
    const statVal = (player.stats && player.stats[stat]) || 0;
    const roll = Math.ceil(Math.random() * 20);
    const total = roll + statVal;
    const pass = total >= dc;
    const crit = roll === 20;
    const fumble = roll === 1;
    return { roll, statVal, total, dc, pass, crit, fumble, stat };
  }

  function formatCheckResult(result) {
    const emoji = result.crit ? '🎯 CRITICAL SUCCESS' : result.fumble ? '💀 CRITICAL FAILURE' : result.pass ? '✓ SUCCESS' : '✗ FAILURE';
    return `${emoji} — d20(${result.roll}) + ${result.stat.toUpperCase()}(${result.statVal}) = ${result.total} vs DC ${result.dc}`;
  }

  // Strip the [CHECK:...] tag from choice text for display
  function cleanCheckTag(text) {
    return text.replace(CHECK_REGEX, '').trim();
  }

  // Get display label for a check tag
  function getCheckLabel(text) {
    const check = parseSkillCheck(text);
    if (!check) return '';
    return `[${check.stat.toUpperCase()} DC ${check.dc}]`;
  }

  // ══════════════════════════════════════════════════════════════
  // 2. FACTION REPUTATION TRACKER
  // ══════════════════════════════════════════════════════════════
  // Factions are defined in worldConfig.factions (comma string) or
  // SystemData.factions (array). Runtime rep stored on gState.factionRep.

  const FACTION_TAG_REGEX = /\[FACTION:([^:]+):([+-]?\d+)\]/gi;

  function initFactions(gs) {
    if (gs.factionRep) return; // already initialized
    const sys = window.SystemData || {};
    const raw = sys.factions || sys._factions || '';
    const names = typeof raw === 'string'
      ? raw.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(raw) ? raw.map(f => typeof f === 'string' ? f : f.name) : []);
    if (!names.length) return;
    gs.factionRep = {};
    names.forEach(name => { gs.factionRep[name] = 0; });
  }

  function parseFactionTags(text) {
    const changes = [];
    let m;
    while ((m = FACTION_TAG_REGEX.exec(text)) !== null) {
      changes.push({ faction: m[1], delta: parseInt(m[2]) });
    }
    FACTION_TAG_REGEX.lastIndex = 0;
    return changes;
  }

  function applyFactionChanges(gs, changes) {
    if (!gs.factionRep) return;
    changes.forEach(({ faction, delta }) => {
      // Fuzzy match faction name
      const key = Object.keys(gs.factionRep).find(k => k.toLowerCase() === faction.toLowerCase());
      if (key) {
        gs.factionRep[key] = Math.max(-100, Math.min(100, (gs.factionRep[key] || 0) + delta));
      }
    });
  }

  function getFactionSummary(gs) {
    if (!gs.factionRep || !Object.keys(gs.factionRep).length) return '';
    const lines = Object.entries(gs.factionRep).map(([name, rep]) => {
      const label = rep >= 50 ? 'Allied' : rep >= 20 ? 'Friendly' : rep >= -20 ? 'Neutral' : rep >= -50 ? 'Hostile' : 'Enemy';
      return `${name}: ${rep} (${label})`;
    });
    return '\nFACTION STANDING:\n' + lines.join('\n');
  }

  // ══════════════════════════════════════════════════════════════
  // 3. LOOT ENGINE
  // ══════════════════════════════════════════════════════════════
  // Post-combat drop rolls. Loot style from worldConfig controls frequency.
  // Items go into player.inventory array.

  const RARITY_TIERS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const RARITY_COLORS = ['#aaa', '#2E8B57', '#4169E1', '#800080', '#DAA520'];

  // Loot style → drop chance per combat (0-1)
  const LOOT_CHANCES = {
    'Sparse & Meaningful — Every item matters': 0.25,
    'Balanced — Regular rewards': 0.50,
    'Generous — Loot rains from the sky': 0.80,
    'Crafting Only — Build your own gear': 0.15,
  };

  // Era-specific loot tables — each era has weapon, armor, consumable, misc categories
  const _ERA_LOOT = {
    Ancient: {
      weapon: [
        { name: 'Bronze Spearhead', detail: '+1 hit', rarity: 0 },
        { name: 'Obsidian Dagger', detail: '+1 crit, armor-piercing', rarity: 1 },
        { name: 'Blessed Khopesh', detail: '+2 hit, holy damage', rarity: 2 },
        { name: 'Pharaoh\'s War Scepter', detail: '+2 crit, +1 hit, command aura', rarity: 3 },
        { name: 'Godslayer Blade', detail: '+3 crit, ignores divine armor', rarity: 4 },
      ],
      armor: [
        { name: 'Hardened Hide', detail: '+1 deflect', rarity: 0 },
        { name: 'Bronze Breastplate', detail: '+2 deflect', rarity: 1 },
        { name: 'Sacred Wrappings', detail: '+1 deflect, resist corruption', rarity: 2 },
        { name: 'Golden War Mask', detail: '+2 deflect, intimidation aura', rarity: 3 },
      ],
      consumable: [
        { name: 'Herb Bundle', detail: 'Restore 4 HP', rarity: 0, icon: '🌿' },
        { name: 'Sacred Oil', detail: 'Weapon deals holy damage for 1 combat', rarity: 1, icon: '🏺' },
        { name: 'Oracle Bones', detail: 'Reveal enemy weakness', rarity: 1, icon: '🦴' },
        { name: 'Resurrection Incense', detail: 'Revive downed ally at 1 HP', rarity: 3, icon: '✦' },
      ],
      misc: [
        { name: 'Clay Tablets', detail: 'Ancient knowledge, +1 lore skill', rarity: 1, icon: '📜' },
        { name: 'Gold Idols x2', detail: 'Worth 15 gold', rarity: 0, icon: '💰' },
        { name: 'Star Map Fragment', detail: 'Reveals a hidden location', rarity: 2, icon: '🗺' },
        { name: 'Amber Scarab', detail: 'Ward against undead for 1 encounter', rarity: 1, icon: '🪲' },
      ],
    },
    Medieval: {
      weapon: [
        { name: 'Fine Steel Blade', detail: '+1 hit', rarity: 1 },
        { name: 'Enchanted Longsword', detail: '+2 crit, glows faintly', rarity: 2 },
        { name: 'Masterwork Warhammer', detail: '+1 hit, +1 crit, sunder shields', rarity: 2 },
        { name: 'Holy Avenger', detail: '+2 hit, +2 crit vs undead', rarity: 3 },
        { name: 'Dragon-Forged Greatsword', detail: '+3 crit, fire damage, unique ability', rarity: 4 },
      ],
      armor: [
        { name: 'Reinforced Leather', detail: '+1 deflect', rarity: 0 },
        { name: 'Chainmail Shirt', detail: '+2 deflect', rarity: 1 },
        { name: 'Enchanted Plate', detail: '+3 deflect, resist magic', rarity: 3 },
        { name: 'Dragonscale Armor', detail: '+4 deflect, fire immunity', rarity: 4 },
      ],
      consumable: [
        { name: 'Healing Potion', detail: 'Restore 5 HP', rarity: 0, icon: '🧪' },
        { name: 'Focus Tonic', detail: 'Restore 2 Focus', rarity: 0, icon: '🧪' },
        { name: 'Antidote', detail: 'Cure poison', rarity: 0, icon: '🧪' },
        { name: 'Fire Bomb', detail: 'AoE 2d6 fire, single-use', rarity: 1, icon: '💣' },
        { name: 'Revival Salts', detail: 'Revive downed ally at 1 HP', rarity: 2, icon: '✦' },
        { name: 'Elixir of Giants', detail: '+2 STR for 1 combat', rarity: 2, icon: '🧪' },
      ],
      misc: [
        { name: 'Crafting Fragments x3', detail: 'Crafting material', rarity: 0, icon: '✦' },
        { name: 'Gold Coins', detail: 'Worth 20 gold', rarity: 0, icon: '💰' },
        { name: 'Dungeon Map', detail: 'Reveals a hidden location', rarity: 1, icon: '🗺' },
        { name: 'Spell Scroll', detail: 'One-use spell, random school', rarity: 2, icon: '📜' },
        { name: 'Gemstone', detail: 'Worth 50 gold, fits weapon socket', rarity: 2, icon: '💎' },
      ],
    },
    Renaissance: {
      weapon: [
        { name: 'Fine Rapier', detail: '+1 hit, finesse', rarity: 1 },
        { name: 'Clockwork Pistol', detail: '+1 crit, faster reload', rarity: 2 },
        { name: 'Alchemical Blade', detail: '+2 hit, poison coating', rarity: 2 },
        { name: 'Da Vinci Repeater', detail: '+2 crit, 3-shot burst', rarity: 3 },
        { name: 'Philosopher\'s Saber', detail: '+3 crit, transmute on hit', rarity: 4 },
      ],
      armor: [
        { name: 'Padded Doublet', detail: '+1 deflect', rarity: 0 },
        { name: 'Steel Cuirass', detail: '+2 deflect', rarity: 1 },
        { name: 'Alchemist\'s Coat', detail: '+2 deflect, resist acid/poison', rarity: 2 },
        { name: 'Automaton Plate', detail: '+3 deflect, clockwork repair', rarity: 4 },
      ],
      consumable: [
        { name: 'Healing Tincture', detail: 'Restore 5 HP', rarity: 0, icon: '🧪' },
        { name: 'Gunpowder Flask', detail: 'Refill 10 shots', rarity: 0, icon: '🏺' },
        { name: 'Alchemist\'s Fire', detail: 'AoE 2d6 fire, single-use', rarity: 1, icon: '🔥' },
        { name: 'Smoke Bomb', detail: 'Escape combat or gain advantage', rarity: 1, icon: '💨' },
        { name: 'Elixir Vitae', detail: 'Revive downed ally at full HP', rarity: 3, icon: '✦' },
      ],
      misc: [
        { name: 'Silver Florins', detail: 'Worth 25 gold', rarity: 0, icon: '💰' },
        { name: 'Inventor\'s Blueprint', detail: 'Upgrade one weapon tier', rarity: 2, icon: '📐' },
        { name: 'Coded Letter', detail: 'Reveals faction secrets', rarity: 1, icon: '📜' },
        { name: 'Telescope Lens', detail: '+1 perception', rarity: 1, icon: '🔭' },
      ],
    },
    Colonial: {
      weapon: [
        { name: 'Officer\'s Pistol', detail: '+1 hit, ornate', rarity: 1 },
        { name: 'Rifled Musket', detail: '+1 hit, +1 crit at range', rarity: 2 },
        { name: 'Boarding Axe', detail: '+2 crit, sunders wood', rarity: 1 },
        { name: 'Cannon Pistol', detail: '+3 crit, heavy recoil', rarity: 3 },
        { name: 'General\'s Sabre', detail: '+2 hit, +2 crit, rally aura', rarity: 4 },
      ],
      armor: [
        { name: 'Thick Wool Coat', detail: '+1 deflect', rarity: 0 },
        { name: 'Reinforced Leather', detail: '+2 deflect', rarity: 1 },
        { name: 'Naval Officer\'s Plate', detail: '+3 deflect', rarity: 3 },
      ],
      consumable: [
        { name: 'Field Bandage', detail: 'Restore 4 HP', rarity: 0, icon: '🩹' },
        { name: 'Powder Keg', detail: 'AoE 3d6, destroys cover', rarity: 2, icon: '💣' },
        { name: 'Rum Ration', detail: '+1 to next roll, -1 perception', rarity: 0, icon: '🍶' },
        { name: 'Smelling Salts', detail: 'Revive downed ally at 1 HP', rarity: 1, icon: '✦' },
        { name: 'Bayonet Whetstone', detail: '+1 melee damage for 1 combat', rarity: 0, icon: '🪨' },
      ],
      misc: [
        { name: 'Gold Doubloons', detail: 'Worth 30 gold', rarity: 0, icon: '💰' },
        { name: 'Treasure Map', detail: 'Reveals hidden cache', rarity: 2, icon: '🗺' },
        { name: 'Naval Commission', detail: 'Gain faction standing with Crown', rarity: 2, icon: '📜' },
        { name: 'Spyglass', detail: '+1 perception at range', rarity: 1, icon: '🔭' },
      ],
    },
    Modern: {
      weapon: [
        { name: 'Custom Grip Pistol', detail: '+1 hit', rarity: 1 },
        { name: 'Suppressed SMG', detail: '+1 hit, silent', rarity: 2 },
        { name: 'Armor-Piercing Rounds', detail: '+2 crit, ignore 2 deflect', rarity: 2 },
        { name: 'Prototype Railpistol', detail: '+2 hit, +2 crit', rarity: 3 },
        { name: 'Experimental Smart Rifle', detail: '+3 hit, auto-aim, unique ability', rarity: 4 },
      ],
      armor: [
        { name: 'Kevlar Insert', detail: '+1 deflect', rarity: 0 },
        { name: 'Tactical Plate Carrier', detail: '+2 deflect', rarity: 1 },
        { name: 'Nano-Weave Vest', detail: '+3 deflect, self-repair', rarity: 3 },
        { name: 'Exo-Skeleton Frame', detail: '+4 deflect, +1 STR', rarity: 4 },
      ],
      consumable: [
        { name: 'Medkit', detail: 'Restore 6 HP', rarity: 0, icon: '🩹' },
        { name: 'Adrenaline Shot', detail: '+2 to next roll', rarity: 1, icon: '💉' },
        { name: 'Flashbang', detail: 'Stun all enemies 1 round', rarity: 1, icon: '💥' },
        { name: 'C4 Charge', detail: 'AoE 4d6, destroys structures', rarity: 2, icon: '💣' },
        { name: 'Combat Stim', detail: 'Extra action this turn', rarity: 3, icon: '💉' },
        { name: 'Defibrillator', detail: 'Revive downed ally at 3 HP', rarity: 2, icon: '✦' },
      ],
      misc: [
        { name: 'Cash Bundle', detail: 'Worth $500', rarity: 0, icon: '💰' },
        { name: 'Intel Drive', detail: 'Reveals enemy positions or faction secrets', rarity: 2, icon: '💾' },
        { name: 'Forged Documents', detail: 'Bypass one security checkpoint', rarity: 1, icon: '📋' },
        { name: 'Burner Phone', detail: 'Call in one favor from a contact', rarity: 1, icon: '📱' },
        { name: 'Crafting Components x5', detail: 'Weapon/armor upgrade material', rarity: 0, icon: '🔧' },
      ],
    },
    'Post-Apocalyptic': {
      weapon: [
        { name: 'Sharpened Rebar', detail: '+1 hit, crude', rarity: 0 },
        { name: 'Jury-rigged Shotgun', detail: '+2 crit, scatter', rarity: 1 },
        { name: 'Electrified Bat', detail: '+1 hit, stun chance', rarity: 2 },
        { name: 'Mutant Bone Blade', detail: '+2 crit, poisons on hit', rarity: 2 },
        { name: 'Pre-War Military Rifle', detail: '+2 hit, +2 crit, pristine', rarity: 3 },
        { name: 'Nuclear Fist', detail: '+4 crit, radiation damage, unique', rarity: 4 },
      ],
      armor: [
        { name: 'Scrap Plates', detail: '+1 deflect', rarity: 0 },
        { name: 'Tire Armor', detail: '+2 deflect, fire resist', rarity: 1 },
        { name: 'Rad Suit', detail: '+1 deflect, radiation immune', rarity: 2 },
        { name: 'Pre-War Power Armor', detail: '+4 deflect, +1 STR', rarity: 4 },
      ],
      consumable: [
        { name: 'Dirty Bandage', detail: 'Restore 3 HP (infection risk)', rarity: 0, icon: '🩹' },
        { name: 'Purified Water', detail: 'Restore 5 HP, cure radiation', rarity: 1, icon: '💧' },
        { name: 'Rad-Away', detail: 'Remove radiation poisoning', rarity: 1, icon: '🧪' },
        { name: 'Molotov', detail: 'AoE 2d6 fire', rarity: 0, icon: '🔥' },
        { name: 'Stimpak', detail: 'Restore 8 HP instantly', rarity: 2, icon: '💉' },
        { name: 'Adrenaline Needle', detail: 'Revive downed ally at 2 HP', rarity: 2, icon: '✦' },
      ],
      misc: [
        { name: 'Bottle Caps x20', detail: 'Currency', rarity: 0, icon: '💰' },
        { name: 'Scrap Metal x5', detail: 'Crafting material', rarity: 0, icon: '🔧' },
        { name: 'Pre-War Map', detail: 'Reveals intact bunker', rarity: 2, icon: '🗺' },
        { name: 'Circuit Board', detail: 'Repair or upgrade one device', rarity: 1, icon: '🔌' },
        { name: 'Mutant Gland', detail: 'Alchemical ingredient, rare', rarity: 2, icon: '🫀' },
      ],
    },
    Futuristic: {
      weapon: [
        { name: 'Overclocked Blaster', detail: '+1 hit, faster charge', rarity: 1 },
        { name: 'Cryo Pistol', detail: '+1 crit, slow on hit', rarity: 1 },
        { name: 'Plasma Cell Upgrade', detail: '+2 crit to any energy weapon', rarity: 2 },
        { name: 'Prototype Rail Attachment', detail: '+2 hit, piercing', rarity: 2 },
        { name: 'Nanoblade Edge', detail: '+2 crit, self-sharpening', rarity: 3 },
        { name: 'Singularity Cannon', detail: '+4 crit, AoE black hole, unique', rarity: 4 },
      ],
      armor: [
        { name: 'Shield Capacitor', detail: '+1 deflect (energy)', rarity: 0 },
        { name: 'Ablative Plating', detail: '+2 deflect, absorbs first hit', rarity: 1 },
        { name: 'Adaptive Nano-Mesh', detail: '+3 deflect, resists last damage type', rarity: 3 },
        { name: 'Void Walker Suit', detail: '+4 deflect, vacuum sealed, stealth field', rarity: 4 },
      ],
      consumable: [
        { name: 'Medpatch', detail: 'Restore 5 HP', rarity: 0, icon: '🩹' },
        { name: 'Shield Recharge Cell', detail: 'Restore 3 deflect for 1 combat', rarity: 1, icon: '🔋' },
        { name: 'EMP Grenade', detail: 'Disable all robot/mech enemies 1 round', rarity: 1, icon: '💥' },
        { name: 'Neural Stim', detail: '+2 to next skill check', rarity: 1, icon: '💉' },
        { name: 'Nanite Swarm Injector', detail: 'Restore 10 HP over 3 rounds', rarity: 2, icon: '🧬' },
        { name: 'Plasma Grenade', detail: 'AoE 3d8 energy damage', rarity: 2, icon: '💣' },
        { name: 'Emergency Teleport Beacon', detail: 'Escape combat instantly', rarity: 3, icon: '✦' },
        { name: 'Revival Drone', detail: 'Revive downed ally at 5 HP', rarity: 3, icon: '🤖' },
      ],
      misc: [
        { name: 'Credits x200', detail: 'Digital currency', rarity: 0, icon: '💰' },
        { name: 'Data Core', detail: 'Intel on enemy base or faction', rarity: 2, icon: '💾' },
        { name: 'Alien Artifact', detail: 'Unknown tech, needs analysis', rarity: 3, icon: '🔮' },
        { name: 'Salvage Components x5', detail: 'Crafting/upgrade material', rarity: 0, icon: '🔧' },
        { name: 'AI Chip Fragment', detail: 'Upgrade smart weapon targeting', rarity: 2, icon: '🧠' },
        { name: 'Star Chart', detail: 'Reveals hidden sector', rarity: 2, icon: '🗺' },
      ],
    },
  };
  // Aliases
  _ERA_LOOT.Timeless = _ERA_LOOT.Medieval;
  _ERA_LOOT.Renaissance = _ERA_LOOT.Renaissance; // self (already defined)

  function _getLootTable() {
    const sys = window.SystemData || {};
    const era = sys._era || 'Medieval';
    return _ERA_LOOT[era] || _ERA_LOOT.Medieval;
  }

  function rollLoot(gs) {
    const sys = window.SystemData || {};
    const rules = sys.rules || {};
    const style = rules.lootStyle || 'Balanced — Regular rewards';
    const chance = LOOT_CHANCES[style] || 0.5;

    if (Math.random() > chance) return null; // no drop

    // Pick category from era-specific table
    const eraLoot = _getLootTable();
    const categories = Object.keys(eraLoot);
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const table = eraLoot[cat];

    // Pick item, weighted toward lower rarity
    const maxRarity = Math.random() < 0.05 ? 4 : Math.random() < 0.15 ? 3 : Math.random() < 0.40 ? 2 : Math.random() < 0.70 ? 1 : 0;
    const eligible = table.filter(i => i.rarity <= maxRarity);
    const item = eligible[Math.floor(Math.random() * eligible.length)] || table[0];

    return {
      name: item.name,
      detail: item.detail,
      rarity: item.rarity,
      rarityName: RARITY_TIERS[item.rarity] || 'Common',
      rarityColor: RARITY_COLORS[item.rarity] || '#aaa',
      icon: item.icon || (cat === 'weapon' ? '⚔' : cat === 'armor' ? '🛡' : '📦'),
      type: cat,
    };
  }

  function addLootToPlayer(player, loot) {
    if (!player.inventory) player.inventory = [];
    player.inventory.push(loot);
  }

  // ══════════════════════════════════════════════════════════════
  // 4. DYNAMIC DIFFICULTY
  // ══════════════════════════════════════════════════════════════
  // Track party performance. Adjust enemy scaling.

  function initDifficulty(gs) {
    if (gs.difficultyState) return;
    gs.difficultyState = {
      combatsWon: 0,
      combatsLost: 0,
      totalDeaths: 0,
      avgHpPercent: 100,
      scalingFactor: 1.0, // multiplier for enemy HP/damage
    };
  }

  function updateDifficulty(gs, combatResult) {
    const sys = window.SystemData || {};
    const rules = sys.rules || {};
    const mode = rules.difficulty || 'Balanced — Fair challenge';
    const ds = gs.difficultyState;
    if (!ds) return;

    if (combatResult === 'win') ds.combatsWon++;
    if (combatResult === 'loss') ds.combatsLost++;

    // Calculate avg party HP
    const players = (gs.players || []).filter(p => p && !p.isNPC);
    if (players.length) {
      ds.avgHpPercent = Math.round(players.reduce((s, p) => s + (p.hp / p.maxHp) * 100, 0) / players.length);
    }

    // Adjust scaling based on mode
    if (mode.startsWith('Adaptive')) {
      const winRate = ds.combatsWon / Math.max(1, ds.combatsWon + ds.combatsLost);
      if (winRate > 0.8 && ds.avgHpPercent > 70) {
        ds.scalingFactor = Math.min(2.0, ds.scalingFactor + 0.1);
      } else if (winRate < 0.4 || ds.avgHpPercent < 30) {
        ds.scalingFactor = Math.max(0.5, ds.scalingFactor - 0.1);
      }
    } else if (mode.startsWith('Punishing')) {
      ds.scalingFactor = 1.2 + (ds.combatsWon * 0.05);
    } else if (mode.startsWith('Cinematic')) {
      ds.scalingFactor = Math.max(0.6, 1.0 - (ds.combatsLost * 0.1));
    }
    // Balanced stays at 1.0
  }

  function getDifficultyMultiplier(gs) {
    return (gs.difficultyState && gs.difficultyState.scalingFactor) || 1.0;
  }

  function getDifficultySummary(gs) {
    const ds = gs.difficultyState;
    if (!ds) return '';
    return `\nDIFFICULTY: Scale ${ds.scalingFactor.toFixed(1)}x | Won ${ds.combatsWon} Lost ${ds.combatsLost} | Party HP ${ds.avgHpPercent}%`;
  }

  // ══════════════════════════════════════════════════════════════
  // 5. WIN / LOSS CONDITION CHECKER
  // ══════════════════════════════════════════════════════════════

  function checkWinCondition(gs) {
    const sys = window.SystemData || {};
    const rules = sys.rules || {};
    const win = rules.winCondition || 'Open-Ended — No fixed ending';

    if (win.startsWith('Open-Ended')) return null;

    if (win.startsWith('Survive') && gs.combatRound) {
      const target = parseInt(win.match(/\d+/)?.[0]) || 10;
      if ((gs.totalCombatRounds || 0) >= target) return 'VICTORY — You survived!';
    }

    if (win.startsWith('Defeat') && gs.bossDefeated) {
      return 'VICTORY — The final boss has fallen!';
    }

    if (win.startsWith('Collect') && gs.artifactsCollected) {
      const target = gs.artifactsRequired || 5;
      if (gs.artifactsCollected >= target) return 'VICTORY — All artifacts collected!';
    }

    if (win.startsWith('Escape') && gs.escaped) {
      return 'VICTORY — You escaped!';
    }

    return null;
  }

  function checkLoseCondition(gs) {
    const sys = window.SystemData || {};
    const rules = sys.rules || {};
    const lose = rules.loseCondition || 'Total Party Kill';

    // TPK check
    if (lose.startsWith('Total Party Kill')) {
      const alive = (gs.players || []).filter(p => p && p.hp > 0);
      if (gs.players && gs.players.length > 0 && alive.length === 0) return 'DEFEAT — Total Party Kill.';
    }

    // Corruption check
    if (lose.startsWith('Corruption')) {
      const maxCorruption = (gs.players || []).some(p => p && (p.corruption || 0) >= 100);
      if (maxCorruption) return 'DEFEAT — Corruption has consumed you.';
    }

    // Time check
    if (lose.startsWith('Time') && gs.turnsRemaining !== undefined) {
      if (gs.turnsRemaining <= 0) return 'DEFEAT — Time has run out.';
    }

    return null;
  }

  // ══════════════════════════════════════════════════════════════
  // 6. REST & RECOVERY
  // ══════════════════════════════════════════════════════════════

  function performRest(gs) {
    const sys = window.SystemData || {};
    const rules = sys.rules || {};
    const mode = rules.restRules || 'Safe Rests — Always heal fully';
    const players = (gs.players || []).filter(p => p && !p.isNPC);
    const results = [];

    // Check for interruption on risky rests
    if (mode.startsWith('Risky')) {
      const interrupted = Math.random() < 0.3;
      if (interrupted) {
        results.push({ type: 'interrupt', text: 'Rest interrupted! Something stirs in the darkness...' });
        // Partial heal only
        players.forEach(p => {
          const heal = Math.ceil(p.maxHp * 0.25);
          p.hp = Math.min(p.maxHp, p.hp + heal);
          results.push({ type: 'heal', name: p.name, amount: heal, partial: true });
        });
        return results;
      }
    }

    if (mode.startsWith('No Rests')) {
      results.push({ type: 'denied', text: 'There is no time to rest. Press on.' });
      return results;
    }

    if (mode.startsWith('Time-Limited')) {
      if (gs.turnsRemaining !== undefined) gs.turnsRemaining -= 3;
      results.push({ type: 'time', text: 'Rest costs 3 turns of game time.' });
    }

    // Full heal
    players.forEach(p => {
      const healed = p.maxHp - p.hp;
      p.hp = p.maxHp;
      if (p.maxFocus) p.focus = p.maxFocus;
      if (p.maxInvestiture) p.investiture = p.maxInvestiture;
      results.push({ type: 'heal', name: p.name, amount: healed, partial: false });
    });

    return results;
  }

  // ══════════════════════════════════════════════════════════════
  // 7. WEATHER & ENVIRONMENTAL HAZARDS
  // ══════════════════════════════════════════════════════════════

  const WEATHER_TABLES = {
    'Temperate — Mild seasons': ['Clear skies', 'Light rain', 'Overcast', 'Gentle breeze', 'Morning fog', 'Warm sunshine'],
    'Harsh Desert — Heat, sandstorms': ['Blazing heat', 'Sandstorm', 'Dry wind', 'Mirages shimmer', 'Cool night', 'Dust devils'],
    'Frozen Wasteland — Blizzards, frostbite': ['Blizzard', 'Driving snow', 'Clear but freezing', 'Ice fog', 'Aurora borealis', 'Whiteout'],
    'Tropical — Humid, monsoons, disease': ['Monsoon downpour', 'Oppressive humidity', 'Brief sunshine', 'Thunderstorm', 'Thick mist', 'Insect swarms'],
    'Toxic / Irradiated — Hazmat survival': ['Acid rain', 'Toxic fog', 'Radiation spike', 'Ash fall', 'Clear (rare)', 'Electromagnetic storm'],
    'Void / Space — No atmosphere': ['Solar flare warning', 'Micrometeorite shower', 'Calm vacuum', 'Radiation belt', 'Nebula interference', 'Gravity anomaly'],
    'Mixed — Varies by region': ['Unpredictable', 'Sudden storm', 'Eerie calm', 'Temperature shift', 'Strange aurora', 'Fog rolls in'],
  };

  const WEATHER_EFFECTS = {
    'Sandstorm': { effect: 'Visibility reduced. Ranged attacks disadvantaged.', hpCost: 1 },
    'Blizzard': { effect: 'Movement halved. Stamina drains faster.', hpCost: 2 },
    'Whiteout': { effect: 'Cannot see. Navigation checks required.', hpCost: 1 },
    'Monsoon downpour': { effect: 'Footing treacherous. Fire-based abilities fail.', hpCost: 0 },
    'Acid rain': { effect: 'Exposed skin burns. Seek shelter or take damage.', hpCost: 3 },
    'Toxic fog': { effect: 'Breathing hurts. Constitution saves each round.', hpCost: 2 },
    'Radiation spike': { effect: 'Rad exposure. Long-term effects accumulate.', hpCost: 2 },
    'Solar flare warning': { effect: 'Electronics disrupted. Shields offline.', hpCost: 0 },
    'Micrometeorite shower': { effect: 'Hull/suit integrity threatened.', hpCost: 1 },
    'Blazing heat': { effect: 'Water consumption doubled. Exhaustion risk.', hpCost: 1 },
    'Driving snow': { effect: 'Cold seeps in. Movement slowed.', hpCost: 1 },
    'Insect swarms': { effect: 'Disease risk. Concentration broken.', hpCost: 0 },
  };

  function rollWeather(gs) {
    const sys = window.SystemData || {};
    const climate = sys.climate || sys._climate || 'Temperate — Mild seasons';
    const table = WEATHER_TABLES[climate] || WEATHER_TABLES['Temperate — Mild seasons'];
    const weather = table[Math.floor(Math.random() * table.length)];
    const effects = WEATHER_EFFECTS[weather] || null;
    gs.currentWeather = { name: weather, effects };
    return { name: weather, effects };
  }

  function getWeatherSummary(gs) {
    if (!gs.currentWeather) return '';
    const w = gs.currentWeather;
    return `\nWEATHER: ${w.name}${w.effects ? ' — ' + w.effects.effect : ''}`;
  }

  // ══════════════════════════════════════════════════════════════
  // 8. NPC GENERATOR TEMPLATES
  // ══════════════════════════════════════════════════════════════
  // Feed NPC archetype instructions into the GM prompt so generated
  // NPCs match the world's tone and faction structure.

  function getNpcPromptBlock(gs) {
    const sys = window.SystemData || {};
    const npcStyle = sys.npcDialogue || sys._npcDialogue || '';
    const factions = gs.factionRep ? Object.keys(gs.factionRep) : [];

    let block = '';
    if (npcStyle) {
      block += `\nNPC DIALOGUE STYLE: ${npcStyle}. All NPCs speak this way unless they have a specific reason not to.`;
    }
    if (factions.length) {
      block += `\nNPC FACTION AWARENESS: NPCs belong to or are affected by these factions: ${factions.join(', ')}. Their attitude toward the party reflects faction standing.`;
    }
    return block;
  }

  // ══════════════════════════════════════════════════════════════
  // 9. MORALITY TRACKER
  // ══════════════════════════════════════════════════════════════

  const MORALITY_TAG_REGEX = /\[MORALITY:([+-]?\d+)\]/gi;

  // ── ITEM GRANTING TAG ──
  // GM can grant items via narrative: [ITEM:Flame Sword] or [ITEM:weapon:Flame Sword] or [ITEM:armor:Dragon Plate:+3 deflect]
  const ITEM_TAG_REGEX = /\[ITEM:([^\]]+)\]/gi;

  function parseItemTags(text) {
    const items = [];
    let m;
    while ((m = ITEM_TAG_REGEX.exec(text)) !== null) {
      const parts = m[1].split(':').map(s => s.trim());
      const TYPES = ['weapon', 'armor', 'consumable', 'misc'];
      let type = 'misc', name, detail = '';
      if (parts.length >= 2 && TYPES.includes(parts[0].toLowerCase())) {
        type = parts[0].toLowerCase();
        name = parts[1];
        detail = parts.slice(2).join(': ');
      } else {
        name = parts[0];
        detail = parts.slice(1).join(': ');
      }
      const icon = type === 'weapon' ? '⚔' : type === 'armor' ? '🛡' : type === 'consumable' ? '🧪' : '📦';
      items.push({ name, detail, type, icon, rarity: 1, rarityName: 'Uncommon', rarityColor: '#2E8B57', granted: true });
    }
    ITEM_TAG_REGEX.lastIndex = 0;
    return items;
  }

  function applyItemGrants(gs, items) {
    if (!items.length) return;
    // Grant to all non-NPC living players
    const players = (gs.players || []).filter(p => p && !p.isNPC && p.hp > 0);
    items.forEach(item => {
      players.forEach(p => addLootToPlayer(p, item));
    });
  }

  function initMorality(gs) {
    if (gs.morality !== undefined) return;
    const sys = window.SystemData || {};
    const axis = sys.moralityAxis || '';
    if (axis.startsWith('None')) return;
    gs.morality = 0; // -100 (evil/shame/corrupted) to +100 (good/honor/pure)
    gs.moralityAxis = axis;
  }

  function parseMoralityTags(text) {
    const changes = [];
    let m;
    while ((m = MORALITY_TAG_REGEX.exec(text)) !== null) {
      changes.push(parseInt(m[1]));
    }
    MORALITY_TAG_REGEX.lastIndex = 0;
    return changes;
  }

  function applyMoralityChanges(gs, deltas) {
    if (gs.morality === undefined) return;
    deltas.forEach(d => {
      gs.morality = Math.max(-100, Math.min(100, gs.morality + d));
    });
  }

  function getMoralitySummary(gs) {
    if (gs.morality === undefined) return '';
    const axis = gs.moralityAxis || 'Morality';
    const val = gs.morality;
    let label;
    if (axis.startsWith('Good')) {
      label = val >= 50 ? 'Righteous' : val >= 10 ? 'Good' : val >= -10 ? 'Neutral' : val >= -50 ? 'Wicked' : 'Evil';
    } else if (axis.startsWith('Honor')) {
      label = val >= 50 ? 'Honorable' : val >= 10 ? 'Respected' : val >= -10 ? 'Neutral' : val >= -50 ? 'Shamed' : 'Disgraced';
    } else if (axis.startsWith('Corruption')) {
      label = val <= -50 ? 'Consumed' : val <= -10 ? 'Tainted' : val <= 10 ? 'Resisting' : val <= 50 ? 'Pure' : 'Incorruptible';
    } else if (axis.startsWith('Karma')) {
      label = val >= 50 ? 'Blessed' : val >= 10 ? 'Fortunate' : val >= -10 ? 'Balanced' : val >= -50 ? 'Cursed' : 'Damned';
    } else {
      label = `${val}`;
    }
    return `\n${axis.split(' —')[0].toUpperCase()}: ${val} (${label})`;
  }

  // ══════════════════════════════════════════════════════════════
  // PUBLIC API — called by combat.js, ui.js, storyEngine.js
  // ══════════════════════════════════════════════════════════════

  // Initialize all systems for a new game
  function initAll(gs) {
    initFactions(gs);
    initDifficulty(gs);
    initMorality(gs);
    rollWeather(gs);
  }

  // Get full context block for GM prompt injection
  function getGmContextBlock(gs) {
    let block = '';
    block += getFactionSummary(gs);
    block += getMoralitySummary(gs);
    block += getDifficultySummary(gs);
    block += getWeatherSummary(gs);
    block += getNpcPromptBlock(gs);

    const sys = window.SystemData || {};
    const rules = sys.rules || {};
    // Skill check instruction for GM
    block += '\n\nSKILL CHECKS: You may include [CHECK:stat:dc] in choices to trigger dice rolls. Example: "I pick the lock [CHECK:dex:15]". The engine handles the roll — just tag the choice.';
    // Faction instruction
    if (gs.factionRep) {
      block += '\nFACTION TAGS: Include [FACTION:name:+N] or [FACTION:name:-N] in your narrative when player actions affect faction reputation.';
    }
    // Morality instruction
    if (gs.morality !== undefined) {
      block += `\nMORALITY TAGS: Include [MORALITY:+N] or [MORALITY:-N] when choices have moral weight. Axis: ${gs.moralityAxis || 'Good vs Evil'}.`;
    }
    // Win condition hint
    if (rules.winCondition && !rules.winCondition.startsWith('Open-Ended')) {
      block += `\nWIN CONDITION: ${rules.winCondition}. Guide the story toward this goal.`;
    }
    // Rest rules hint
    if (rules.restRules) {
      block += `\nREST RULES: ${rules.restRules}. Factor this into pacing — if rests are risky or forbidden, the party is always under pressure.`;
    }
    // Item granting instruction
    block += '\nITEM GRANTS: When NPCs give, sell, or the party discovers items, use [ITEM:name] or [ITEM:type:name] (type = weapon, armor, consumable, misc). Examples: [ITEM:weapon:Flame Sword], [ITEM:consumable:Healing Elixir], [ITEM:Ancient Map]. Items are auto-added to player inventory.';

    return block;
  }

  // Process a GM response — parse tags, apply changes, check conditions
  function processGmResponse(gs, text) {
    const results = { factionChanges: [], moralityChanges: [], itemGrants: [], winResult: null, loseResult: null };

    // Faction tags
    const fc = parseFactionTags(text);
    if (fc.length) {
      applyFactionChanges(gs, fc);
      results.factionChanges = fc;
    }

    // Morality tags
    const mc = parseMoralityTags(text);
    if (mc.length) {
      applyMoralityChanges(gs, mc);
      results.moralityChanges = mc;
    }

    // Item grants
    const ig = parseItemTags(text);
    if (ig.length) {
      applyItemGrants(gs, ig);
      results.itemGrants = ig;
    }

    // Win/loss check
    results.winResult = checkWinCondition(gs);
    results.loseResult = checkLoseCondition(gs);

    return results;
  }

  // Process post-combat results
  function processPostCombat(gs, result) {
    updateDifficulty(gs, result);

    // Roll loot for each surviving player
    const lootDrops = [];
    const players = (gs.players || []).filter(p => p && p.hp > 0 && !p.isNPC);
    players.forEach(p => {
      const loot = rollLoot(gs);
      if (loot) {
        addLootToPlayer(p, loot);
        lootDrops.push({ player: p.name, item: loot });
      }
    });

    // Roll new weather
    rollWeather(gs);

    return { lootDrops, weather: gs.currentWeather };
  }

  return {
    // Init
    initAll,
    // Skill checks
    parseSkillCheck, rollSkillCheck, formatCheckResult, cleanCheckTag, getCheckLabel,
    // Factions
    initFactions, parseFactionTags, applyFactionChanges, getFactionSummary,
    // Loot & Items
    rollLoot, addLootToPlayer, parseItemTags, applyItemGrants,
    // Difficulty
    initDifficulty, updateDifficulty, getDifficultyMultiplier, getDifficultySummary,
    // Win/Loss
    checkWinCondition, checkLoseCondition,
    // Rest
    performRest,
    // Weather
    rollWeather, getWeatherSummary,
    // NPC
    getNpcPromptBlock,
    // Morality
    initMorality, getMoralitySummary,
    // GM integration
    getGmContextBlock, processGmResponse, processPostCombat,
  };
})();
