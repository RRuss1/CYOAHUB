# ⚙ Narrative Enemy Patterns — Sci-Fi Expansion
**Genres:** Steampunk · Cyberpunk · Tech-Noir · Post-Apocalyptic · Mech Combat · Robot Uprising  
**Format:** Same as `ENEMY_PATTERNS_EXPANSION.md` — drops into `NARRATIVE_ENEMY_PATTERNS` in `app/combat.js`  
**New patterns:** 60+  
**New enemy variants:** 220+

---

## Priority Order Within the Array

Put **most specific** first — genre-defining enemies before generic machines.

1. Specific robot models (Terminator-class, combat chassis, etc.)
2. Specific steampunk constructs (automata, brass golems)
3. Specific cyber-enhanced humans (razorboys, netrunners)
4. Faction enemies (corp soldiers, raider gangs)
5. Mutants (specific types first)
6. Generic mechanical / generic apocalyptic last

---

## ROBOTS & MECHANICAL (10 patterns)

```js
// ── Combat Robots & War Machines
{ keywords: [/combat.robot|war.machine|battle.droid|killbot|terminator|hunter.killer/i],
  enemies: [
    { name: 'Scout Killbot',       type: 'Machine',   baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Combat Chassis',      type: 'Machine',   baseHP: 16, dmg: 6, attackBonus: 4 },
    { name: 'War Droid',           type: 'Machine',   baseHP: 20, dmg: 7, attackBonus: 5 },
    { name: 'Hunter-Killer Unit',  type: 'Elite',     baseHP: 28, dmg: 8, attackBonus: 6 },
  ]},

// ── Sentry Turrets & Defense Systems
{ keywords: [/sentry|turret|defense.system|automated.gun|perimeter.*alarm|laser.grid/i],
  enemies: [
    { name: 'Sentry Turret',       type: 'Machine',   baseHP: 8,  dmg: 5, attackBonus: 4 },
    { name: 'Auto-Cannon Nest',    type: 'Machine',   baseHP: 12, dmg: 6, attackBonus: 4 },
    { name: 'Mobile Sentry Unit',  type: 'Machine',   baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Defense Grid Node',   type: 'Elite',     baseHP: 18, dmg: 7, attackBonus: 5 },
  ]},

// ── Androids & Synthetic Humans
{ keywords: [/android|synthetic|replicant|artificial.human|skin.job|biomechanical.human/i],
  enemies: [
    { name: 'Android Worker',      type: 'Synthetic', baseHP: 10, dmg: 3, attackBonus: 3 },
    { name: 'Combat Android',      type: 'Synthetic', baseHP: 16, dmg: 5, attackBonus: 5 },
    { name: 'Infiltrator Model',   type: 'Elite',     baseHP: 18, dmg: 5, attackBonus: 6 },
    { name: 'Apex Synthetic',      type: 'Boss',      baseHP: 28, dmg: 8, attackBonus: 7 },
  ]},

// ── Drone Swarms
{ keywords: [/drone.swarm|aerial.drones|micro.drone|nanodrone|buzzing.*machines|swarm.*aerial/i],
  enemies: [
    { name: 'Micro Drone',         type: 'Drone',     baseHP: 3,  dmg: 2, attackBonus: 3 },
    { name: 'Assault Drone',       type: 'Drone',     baseHP: 7,  dmg: 3, attackBonus: 4 },
    { name: 'Drone Swarm Cluster', type: 'Swarm',     baseHP: 5,  dmg: 2, attackBonus: 3 },
    { name: 'Heavy Gunship Drone', type: 'Elite',     baseHP: 16, dmg: 6, attackBonus: 4 },
  ]},

// ── Mechs & Powered Armour
{ keywords: [/mech|exosuit|powered.armor|battle.suit|bipedal.*walker|giant.*robot/i],
  enemies: [
    { name: 'Scout Mech',          type: 'Mech',      baseHP: 18, dmg: 6, attackBonus: 4 },
    { name: 'Assault Mech',        type: 'Mech',      baseHP: 26, dmg: 8, attackBonus: 5 },
    { name: 'Titan Mech',          type: 'Boss',      baseHP: 38, dmg: 11,attackBonus: 7 },
    { name: 'Salvaged War Frame',  type: 'Mech',      baseHP: 20, dmg: 7, attackBonus: 4 },
  ]},

// ── Rogue AI Constructs
{ keywords: [/rogue.ai|artificial.intelligence|machine.uprising|gone.rogue|awakened.machine/i],
  enemies: [
    { name: 'Rogue Maintenance Bot',type:'Machine',   baseHP: 8,  dmg: 3, attackBonus: 2 },
    { name: 'Corrupted AI Frame',  type: 'Machine',   baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Hive Mind Node',      type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
    { name: 'Central Intelligence',type: 'Boss',      baseHP: 32, dmg: 9, attackBonus: 6 },
  ]},

// ── Industrial Automatons
{ keywords: [/automaton|clockwork|industrial.*machine|factory.*guard|assembly.*hostile/i],
  enemies: [
    { name: 'Factory Automaton',   type: 'Machine',   baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Industrial Crusher',  type: 'Machine',   baseHP: 18, dmg: 6, attackBonus: 3 },
    { name: 'Overseer Construct',  type: 'Elite',     baseHP: 22, dmg: 7, attackBonus: 4 },
    { name: 'Forge Sentinel',      type: 'Machine',   baseHP: 16, dmg: 5, attackBonus: 4 },
  ]},

// ── Spider Bots & Crawler Drones
{ keywords: [/spider.bot|crawler.drone|multi.legged.*machine|skitter.*metal|arachnid.*robot/i],
  enemies: [
    { name: 'Spider Bot',          type: 'Drone',     baseHP: 7,  dmg: 3, attackBonus: 3 },
    { name: 'Crawler Mine',        type: 'Drone',     baseHP: 4,  dmg: 4, attackBonus: 2 },
    { name: 'Arachnoid Sentinel',  type: 'Machine',   baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Heavy Crawler',       type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
  ]},

// ── Cyborg Soldiers
{ keywords: [/cyborg|half.machine|augmented.soldier|chrome.*flesh|metal.*limb|bionic.*soldier/i],
  enemies: [
    { name: 'Cyborg Grunt',        type: 'Cyborg',    baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Augmented Enforcer',  type: 'Cyborg',    baseHP: 16, dmg: 5, attackBonus: 4 },
    { name: 'Full-Chrome Soldier', type: 'Elite',     baseHP: 22, dmg: 7, attackBonus: 5 },
    { name: 'Cyborg Commander',    type: 'Boss',      baseHP: 30, dmg: 9, attackBonus: 6 },
  ]},

// ── Maintenance & Repair Bots Gone Hostile
{ keywords: [/maintenance.bot|repair.drone|medical.*hostile|nanobots.*attack|servitor.*hostile/i],
  enemies: [
    { name: 'Rogue Medbot',        type: 'Machine',   baseHP: 6,  dmg: 2, attackBonus: 2 },
    { name: 'Repair Drone',        type: 'Machine',   baseHP: 5,  dmg: 2, attackBonus: 2 },
    { name: 'Sanitation Unit',     type: 'Machine',   baseHP: 8,  dmg: 3, attackBonus: 2 },
    { name: 'Overseer Medunit',    type: 'Elite',     baseHP: 14, dmg: 4, attackBonus: 3 },
  ]},
```

---

## STEAMPUNK SPECIFIC (7 patterns)

```js
// ── Brass Automata & Clockwork Soldiers
{ keywords: [/brass.automaton|clockwork.soldier|steam.powered|cogwork|gear.*construct|tick.*gears/i],
  enemies: [
    { name: 'Clockwork Soldier',   type: 'Construct', baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Brass Automaton',     type: 'Construct', baseHP: 16, dmg: 5, attackBonus: 4 },
    { name: 'Steam Knight',        type: 'Elite',     baseHP: 22, dmg: 7, attackBonus: 5 },
    { name: 'Cogwork Colossus',    type: 'Boss',      baseHP: 32, dmg: 9, attackBonus: 5 },
  ]},

// ── Airship Pirates & Sky Raiders
{ keywords: [/airship.pirate|sky.raider|zeppelin.*crew|dirigible.*attack|aerial.*pirate/i],
  enemies: [
    { name: 'Airship Corsair',     type: 'Humanoid',  baseHP: 9,  dmg: 3, attackBonus: 3 },
    { name: 'Sky Raider',          type: 'Humanoid',  baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Aether Gunner',       type: 'Humanoid',  baseHP: 10, dmg: 5, attackBonus: 4 },
    { name: 'Corsair Captain',     type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
  ]},

// ── Steam Golems & Boiler Constructs
{ keywords: [/steam.golem|boiler.construct|iron.giant.*steam|pressure.*vessel.*hostile|furnace.creature/i],
  enemies: [
    { name: 'Boiler Golem',        type: 'Construct', baseHP: 20, dmg: 6, attackBonus: 4 },
    { name: 'Steam Juggernaut',    type: 'Elite',     baseHP: 28, dmg: 8, attackBonus: 4 },
    { name: 'Pressure Wraith',     type: 'Construct', baseHP: 14, dmg: 5, attackBonus: 3 },
    { name: 'Furnace Colossus',    type: 'Boss',      baseHP: 35, dmg: 10,attackBonus: 5 },
  ]},

// ── Alchemical Experiments & Mutated Lab Creatures
{ keywords: [/alchemical|experiment.*escaped|lab.*creature|vat.*grown|alchemy.*hostile/i],
  enemies: [
    { name: 'Vat Spawn',           type: 'Mutant',    baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Alchemical Horror',   type: 'Mutant',    baseHP: 16, dmg: 5, attackBonus: 3 },
    { name: 'Failed Experiment',   type: 'Mutant',    baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Perfected Specimen',  type: 'Boss',      baseHP: 26, dmg: 8, attackBonus: 5 },
  ]},

// ── Aether Wraiths & Electromantic Entities
{ keywords: [/aether.*hostile|aetheric.entity|lightning.elemental|electromancer|galvanic.spirit/i],
  enemies: [
    { name: 'Aether Wraith',       type: 'Elemental', baseHP: 10, dmg: 4, attackBonus: 4 },
    { name: 'Galvanic Specter',    type: 'Elemental', baseHP: 8,  dmg: 5, attackBonus: 4 },
    { name: 'Storm Engine',        type: 'Elite',     baseHP: 18, dmg: 6, attackBonus: 5 },
    { name: 'Electromantic Lich',  type: 'Boss',      baseHP: 28, dmg: 8, attackBonus: 6 },
  ]},

// ── Guild Enforcers & Aristocratic Guards
{ keywords: [/guild.enforcer|factory.*guard|aristocrat.*soldier|noble.*hired|company.man/i],
  enemies: [
    { name: 'Guild Enforcer',      type: 'Humanoid',  baseHP: 10, dmg: 3, attackBonus: 3 },
    { name: 'Ironclad Constable',  type: 'Humanoid',  baseHP: 14, dmg: 4, attackBonus: 4 },
    { name: 'Pneumatic Knight',    type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
    { name: 'Guild Commander',     type: 'Boss',      baseHP: 26, dmg: 7, attackBonus: 5 },
  ]},

// ── Mechanical Beasts & Steam-Powered Animals
{ keywords: [/mechanical.beast|clockwork.animal|steam.horse|iron.*hound|bronze.*bird/i],
  enemies: [
    { name: 'Clockwork Hound',     type: 'Construct', baseHP: 10, dmg: 4, attackBonus: 4 },
    { name: 'Brass Hawk',          type: 'Construct', baseHP: 7,  dmg: 3, attackBonus: 4 },
    { name: 'Iron Stag',           type: 'Construct', baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Steam Leviathan',     type: 'Boss',      baseHP: 30, dmg: 9, attackBonus: 5 },
  ]},
```

---

## CYBERPUNK & TECH-NOIR (8 patterns)

```js
// ── Corporate Soldiers & PMC
{ keywords: [/corp.*soldier|corporate.*security|PMC|megacorp.*troops|company.enforcers/i],
  enemies: [
    { name: 'Corp Security Guard', type: 'Humanoid',  baseHP: 9,  dmg: 3, attackBonus: 3 },
    { name: 'PMC Operator',        type: 'Humanoid',  baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Tactical Response Unit',type:'Humanoid', baseHP: 18, dmg: 5, attackBonus: 5 },
    { name: 'Black Ops Commander', type: 'Elite',     baseHP: 22, dmg: 6, attackBonus: 6 },
  ]},

// ── Street Gang & Razerboys
{ keywords: [/street.gang|razorboy|gang.*cyber|chrome.gang|blade.punk|street.samurai/i],
  enemies: [
    { name: 'Gang Punk',           type: 'Humanoid',  baseHP: 7,  dmg: 3, attackBonus: 2 },
    { name: 'Razorboy',            type: 'Cyborg',    baseHP: 12, dmg: 5, attackBonus: 4 },
    { name: 'Chrome Enforcer',     type: 'Cyborg',    baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Gang Lieutenant',     type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
  ]},

// ── Netrunners & Hackers (physical combat)
{ keywords: [/netrunner|hacker.*physical|ICE.*hostile|black.ICE|neural.attack|data.spike/i],
  enemies: [
    { name: 'Rogue Netrunner',     type: 'Humanoid',  baseHP: 8,  dmg: 3, attackBonus: 5 },
    { name: 'Black ICE Construct', type: 'Machine',   baseHP: 12, dmg: 6, attackBonus: 5 },
    { name: 'Data Wraith',         type: 'Synthetic', baseHP: 10, dmg: 5, attackBonus: 5 },
    { name: 'Neural Assassin',     type: 'Elite',     baseHP: 18, dmg: 6, attackBonus: 6 },
  ]},

// ── Bioengineered Organisms & Splice Freaks
{ keywords: [/bioengineered|splice|gene.mod|transgenic|chimera.*lab|flesh.*machine/i],
  enemies: [
    { name: 'Splice Brute',        type: 'Mutant',    baseHP: 14, dmg: 5, attackBonus: 3 },
    { name: 'Gene-Mod Enforcer',   type: 'Mutant',    baseHP: 16, dmg: 6, attackBonus: 4 },
    { name: 'Transgenic Beast',    type: 'Mutant',    baseHP: 20, dmg: 7, attackBonus: 4 },
    { name: 'Apex Chimera',        type: 'Boss',      baseHP: 30, dmg: 9, attackBonus: 5 },
  ]},

// ── Police & Law Enforcement Turned Hostile
{ keywords: [/police.*hostile|corrupt.cop|rogue.*officer|law.*enforcer.*corrupt|badge.*enemy/i],
  enemies: [
    { name: 'Corrupt Officer',     type: 'Humanoid',  baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Riot Control Unit',   type: 'Humanoid',  baseHP: 14, dmg: 4, attackBonus: 3 },
    { name: 'SWAT Breacher',       type: 'Humanoid',  baseHP: 16, dmg: 5, attackBonus: 4 },
    { name: 'Armored Mech-Cop',    type: 'Cyborg',    baseHP: 22, dmg: 6, attackBonus: 5 },
  ]},

// ── Yakuza & Crime Syndicate
{ keywords: [/yakuza|triad|syndicate.*goon|crime.boss|mafia.*cyber|cartel.*augmented/i],
  enemies: [
    { name: 'Syndicate Foot Soldier',type:'Humanoid', baseHP: 9,  dmg: 3, attackBonus: 3 },
    { name: 'Yakuza Cyber-Samurai', type: 'Cyborg',   baseHP: 16, dmg: 6, attackBonus: 5 },
    { name: 'Triad Enforcer',      type: 'Humanoid',  baseHP: 12, dmg: 4, attackBonus: 4 },
    { name: 'Crime Boss',          type: 'Boss',      baseHP: 24, dmg: 7, attackBonus: 6 },
  ]},

// ── Nano-Infested & Tech Possessed
{ keywords: [/nano.*infest|nanobot.*hostile|tech.possessed|machine.*plague|gray.goo|nanite/i],
  enemies: [
    { name: 'Nanite Thrall',       type: 'Synthetic', baseHP: 8,  dmg: 3, attackBonus: 3 },
    { name: 'Nano-Swarm',          type: 'Swarm',     baseHP: 6,  dmg: 2, attackBonus: 3 },
    { name: 'Nanite Hulk',         type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 4 },
    { name: 'Gray Goo Titan',      type: 'Boss',      baseHP: 30, dmg: 8, attackBonus: 5 },
  ]},

// ── Holographic & Digital Enemies
{ keywords: [/hologram.*attack|hard.light|digital.construct|program.*physical|solid.light/i],
  enemies: [
    { name: 'Hard-Light Sentinel', type: 'Synthetic', baseHP: 8,  dmg: 4, attackBonus: 4 },
    { name: 'Digital Assassin',    type: 'Synthetic', baseHP: 12, dmg: 5, attackBonus: 5 },
    { name: 'Holo-Construct',      type: 'Elite',     baseHP: 16, dmg: 5, attackBonus: 5 },
    { name: 'Reality Engine',      type: 'Boss',      baseHP: 26, dmg: 8, attackBonus: 6 },
  ]},
```

---

## POST-APOCALYPTIC (10 patterns)

```js
// ── Raiders & Scavengers
{ keywords: [/raider|scavenger|wasteland.gang|marauder|road.warrior|bandit.*wasteland/i],
  enemies: [
    { name: 'Wasteland Raider',    type: 'Humanoid',  baseHP: 8,  dmg: 3, attackBonus: 2 },
    { name: 'Scav Bruiser',        type: 'Humanoid',  baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Road Warrior',        type: 'Humanoid',  baseHP: 14, dmg: 5, attackBonus: 3 },
    { name: 'Raider War Boss',     type: 'Elite',     baseHP: 22, dmg: 6, attackBonus: 5 },
  ]},

// ── Mutants & Irradiated
{ keywords: [/mutant|irradiat|ghoul.*rad|two.headed|feral.*human|exposed.*radiation/i],
  enemies: [
    { name: 'Feral Mutant',        type: 'Mutant',    baseHP: 10, dmg: 4, attackBonus: 2 },
    { name: 'Irradiated Ghoul',    type: 'Mutant',    baseHP: 8,  dmg: 3, attackBonus: 2 },
    { name: 'Brute Mutant',        type: 'Mutant',    baseHP: 18, dmg: 6, attackBonus: 3 },
    { name: 'Apex Mutant',         type: 'Boss',      baseHP: 30, dmg: 9, attackBonus: 5 },
  ]},

// ── Plague Carriers & Bio-Hazards
{ keywords: [/plague.carrier|bio.hazard|infected.*hostile|virus.*spread|contagion|outbreak/i],
  enemies: [
    { name: 'Plague Carrier',      type: 'Mutant',    baseHP: 7,  dmg: 2, attackBonus: 1 },
    { name: 'Infected Brute',      type: 'Mutant',    baseHP: 14, dmg: 4, attackBonus: 2 },
    { name: 'Contagion Hulk',      type: 'Elite',     baseHP: 22, dmg: 6, attackBonus: 3 },
    { name: 'Plague Mother',       type: 'Boss',      baseHP: 28, dmg: 7, attackBonus: 4 },
  ]},

// ── Cannibal Cults & Wasteland Tribes
{ keywords: [/cannibal|wasteland.cult|death.cult|tribal.*hostile|blood.tribe|savage.clan/i],
  enemies: [
    { name: 'Cannibal Scout',      type: 'Humanoid',  baseHP: 7,  dmg: 3, attackBonus: 3 },
    { name: 'Cult Berserker',      type: 'Humanoid',  baseHP: 12, dmg: 5, attackBonus: 3 },
    { name: 'Tribal Shaman',       type: 'Humanoid',  baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Cannibal Warchief',   type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
  ]},

// ── Zombie Apocalypse (modern-setting)
{ keywords: [/zombie.*modern|undead.*outbreak|infected.*horde|walking.*dead|bitten.*turned/i],
  enemies: [
    { name: 'Common Infected',     type: 'Undead',    baseHP: 7,  dmg: 2, attackBonus: 1 },
    { name: 'Runner Infected',     type: 'Undead',    baseHP: 6,  dmg: 3, attackBonus: 3 },
    { name: 'Bloater',             type: 'Undead',    baseHP: 14, dmg: 4, attackBonus: 1 },
    { name: 'Tank Infected',       type: 'Boss',      baseHP: 30, dmg: 8, attackBonus: 3 },
  ]},

// ── Warlord Armies & Faction Soldiers
{ keywords: [/warlord.*army|faction.soldier|military.remnant|old.world.soldier|fort.*hostile/i],
  enemies: [
    { name: 'Faction Soldier',     type: 'Humanoid',  baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Warlord Guard',       type: 'Humanoid',  baseHP: 14, dmg: 4, attackBonus: 4 },
    { name: 'Military Remnant',    type: 'Humanoid',  baseHP: 12, dmg: 5, attackBonus: 4 },
    { name: 'Warlord Champion',    type: 'Boss',      baseHP: 26, dmg: 8, attackBonus: 6 },
  ]},

// ── Feral Animals & Mutated Wildlife
{ keywords: [/feral.animal|mutated.wolf|wasteland.creature|giant.*rat|irradiated.*beast/i],
  enemies: [
    { name: 'Feral Hound',         type: 'Beast',     baseHP: 8,  dmg: 3, attackBonus: 3 },
    { name: 'Mutated Rat',         type: 'Beast',     baseHP: 5,  dmg: 2, attackBonus: 2 },
    { name: 'Radscorpion',         type: 'Beast',     baseHP: 14, dmg: 5, attackBonus: 3 },
    { name: 'Deathclaw',           type: 'Boss',      baseHP: 32, dmg: 10,attackBonus: 6 },
  ]},

// ── Sentient Machine Hordes (Skynet-type)
{ keywords: [/machine.horde|mechanical.army|robot.uprising|machine.*judgment|silicon.*war/i],
  enemies: [
    { name: 'T-Type Scout',        type: 'Machine',   baseHP: 12, dmg: 4, attackBonus: 4 },
    { name: 'Endoskeleton',        type: 'Machine',   baseHP: 18, dmg: 6, attackBonus: 5 },
    { name: 'Heavy Terminator',    type: 'Elite',     baseHP: 26, dmg: 8, attackBonus: 6 },
    { name: 'Skynet Commander',    type: 'Boss',      baseHP: 36, dmg: 10,attackBonus: 7 },
  ]},

// ── Survivors Gone Hostile & Desperate Refugees
{ keywords: [/survivor.*hostile|desperate.*refugee|cornered.*human|starving.*attack|vault.*hostile/i],
  enemies: [
    { name: 'Desperate Survivor',  type: 'Humanoid',  baseHP: 6,  dmg: 2, attackBonus: 2 },
    { name: 'Armed Refugee',       type: 'Humanoid',  baseHP: 8,  dmg: 3, attackBonus: 2 },
    { name: 'Survivor Pack',       type: 'Humanoid',  baseHP: 10, dmg: 3, attackBonus: 3 },
    { name: 'Vault Enforcer',      type: 'Elite',     baseHP: 18, dmg: 5, attackBonus: 4 },
  ]},

// ── Environmental Hazard Creatures
{ keywords: [/acid.creature|toxic.elemental|radiation.*entity|waste.*alive|sludge.*hostile/i],
  enemies: [
    { name: 'Toxic Slime',         type: 'Elemental', baseHP: 6,  dmg: 3, attackBonus: 1 },
    { name: 'Acid Crawler',        type: 'Mutant',    baseHP: 10, dmg: 4, attackBonus: 2 },
    { name: 'Radiation Elemental', type: 'Elemental', baseHP: 14, dmg: 5, attackBonus: 3 },
    { name: 'Sludge Titan',        type: 'Elite',     baseHP: 22, dmg: 6, attackBonus: 3 },
  ]},
```

---

## ALIEN & XENOMORPH (6 patterns)

```js
// ── Classic Xenomorph-Type
{ keywords: [/xenomorph|alien.*hive|acid.blood|facehugger|chest.*burst|hive.*alien/i],
  enemies: [
    { name: 'Xenomorph Drone',     type: 'Alien',     baseHP: 12, dmg: 5, attackBonus: 4 },
    { name: 'Xenomorph Warrior',   type: 'Alien',     baseHP: 16, dmg: 6, attackBonus: 5 },
    { name: 'Praetorian',          type: 'Elite',     baseHP: 24, dmg: 8, attackBonus: 6 },
    { name: 'Alien Queen',         type: 'Boss',      baseHP: 40, dmg: 12,attackBonus: 7 },
  ]},

// ── Greys & Abductors
{ keywords: [/grey.*alien|grey.*hostile|abductor|little.*grey|alien.*probe|abduction/i],
  enemies: [
    { name: 'Grey Scout',          type: 'Alien',     baseHP: 7,  dmg: 3, attackBonus: 4 },
    { name: 'Grey Abductor',       type: 'Alien',     baseHP: 10, dmg: 4, attackBonus: 4 },
    { name: 'Grey Commander',      type: 'Elite',     baseHP: 16, dmg: 5, attackBonus: 5 },
  ]},

// ── Insectoid Swarms
{ keywords: [/insectoid|bug.*alien|zerg.*type|hive.mind.*insect|carapace.*alien/i],
  enemies: [
    { name: 'Insectoid Skirmisher',type: 'Alien',     baseHP: 6,  dmg: 3, attackBonus: 3 },
    { name: 'Carapace Warrior',    type: 'Alien',     baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Hive Guard',          type: 'Elite',     baseHP: 18, dmg: 6, attackBonus: 4 },
    { name: 'Brood Mother',        type: 'Boss',      baseHP: 32, dmg: 9, attackBonus: 5 },
  ]},

// ── Shapeshifting Aliens
{ keywords: [/shapeshifting.alien|thing.*creature|mimicry.*alien|alien.*disguise|flesh.*wrong/i],
  enemies: [
    { name: 'Mimic Alien',         type: 'Alien',     baseHP: 14, dmg: 5, attackBonus: 5 },
    { name: 'Assimilator',         type: 'Alien',     baseHP: 18, dmg: 6, attackBonus: 5 },
    { name: 'The Thing',           type: 'Boss',      baseHP: 28, dmg: 8, attackBonus: 6 },
  ]},

// ── Predator-Type Hunters
{ keywords: [/predator.*alien|hunter.*cloak|plasma.*shoulder|trophy.*hunter|invisible.*killer/i],
  enemies: [
    { name: 'Yautja Scout',        type: 'Alien',     baseHP: 16, dmg: 6, attackBonus: 6 },
    { name: 'Yautja Warrior',      type: 'Elite',     baseHP: 22, dmg: 8, attackBonus: 7 },
    { name: 'Yautja Elder',        type: 'Boss',      baseHP: 30, dmg: 9, attackBonus: 7 },
  ]},

// ── Cosmic Parasites
{ keywords: [/parasite.*alien|body.snatcher|infected.*host|taken.*over|organism.*infects/i],
  enemies: [
    { name: 'Parasite Thrall',     type: 'Alien',     baseHP: 9,  dmg: 3, attackBonus: 3 },
    { name: 'Infected Host',       type: 'Alien',     baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Parasite Broodling',  type: 'Swarm',     baseHP: 4,  dmg: 2, attackBonus: 2 },
    { name: 'Apex Parasite',       type: 'Boss',      baseHP: 26, dmg: 8, attackBonus: 5 },
  ]},
```

---

## MILITARY & SPEC-OPS (5 patterns)

```js
// ── Modern Military Soldiers
{ keywords: [/soldier|infantry|troops|military.*enemy|special.forces|black.ops/i],
  enemies: [
    { name: 'Infantry Soldier',    type: 'Humanoid',  baseHP: 9,  dmg: 4, attackBonus: 3 },
    { name: 'Special Forces Op',   type: 'Humanoid',  baseHP: 14, dmg: 5, attackBonus: 5 },
    { name: 'Heavy Weapons Trooper',type:'Humanoid',  baseHP: 16, dmg: 6, attackBonus: 4 },
    { name: 'Black Ops Commander', type: 'Elite',     baseHP: 22, dmg: 6, attackBonus: 6 },
  ]},

// ── Snipers & Marksmen
{ keywords: [/sniper|marksman|long.range.*fire|shot.*distance|rifleman.*hidden/i],
  enemies: [
    { name: 'Sniper',              type: 'Humanoid',  baseHP: 8,  dmg: 7, attackBonus: 6 },
    { name: 'Designated Marksman', type: 'Humanoid',  baseHP: 10, dmg: 6, attackBonus: 5 },
    { name: 'Ghost Sniper',        type: 'Elite',     baseHP: 12, dmg: 8, attackBonus: 7 },
  ]},

// ── Tanks & Armoured Vehicles
{ keywords: [/tank|armored.vehicle|APC|IFV|battle.*vehicle|tracked.*weapon/i],
  enemies: [
    { name: 'APC Crew',            type: 'Humanoid',  baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Scout Tank',          type: 'Machine',   baseHP: 22, dmg: 8, attackBonus: 4 },
    { name: 'Main Battle Tank',    type: 'Boss',      baseHP: 36, dmg: 11,attackBonus: 5 },
  ]},

// ── Elite Commandos & Super Soldiers
{ keywords: [/commando|super.soldier|enhanced.*operative|augmented.*spec.ops|elite.*unit/i],
  enemies: [
    { name: 'Enhanced Commando',   type: 'Cyborg',    baseHP: 16, dmg: 6, attackBonus: 5 },
    { name: 'Super Soldier',       type: 'Cyborg',    baseHP: 22, dmg: 7, attackBonus: 6 },
    { name: 'Apex Operative',      type: 'Elite',     baseHP: 26, dmg: 8, attackBonus: 7 },
  ]},

// ── Mercenaries & PMC
{ keywords: [/mercenary|hired.gun|freelance.soldier|private.army|merc.*squad/i],
  enemies: [
    { name: 'Merc Grunt',          type: 'Humanoid',  baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'PMC Operator',        type: 'Humanoid',  baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Merc Heavy',          type: 'Humanoid',  baseHP: 16, dmg: 6, attackBonus: 4 },
    { name: 'Mercenary Commander', type: 'Elite',     baseHP: 22, dmg: 7, attackBonus: 5 },
  ]},
```

---

## SUPERNATURAL TECH-HORROR (4 patterns)

```js
// ── Haunted Technology & Ghost in the Machine
{ keywords: [/haunted.machine|ghost.*machine|spirit.*tech|possessed.*computer|digital.ghost/i],
  enemies: [
    { name: 'Digital Poltergeist', type: 'Undead',    baseHP: 8,  dmg: 4, attackBonus: 4 },
    { name: 'Machine Specter',     type: 'Undead',    baseHP: 12, dmg: 5, attackBonus: 4 },
    { name: 'Ghost Protocol',      type: 'Elite',     baseHP: 18, dmg: 6, attackBonus: 5 },
    { name: 'System Haunt',        type: 'Boss',      baseHP: 26, dmg: 7, attackBonus: 6 },
  ]},

// ── Biomechanical Horrors (Borg-type)
{ keywords: [/biomechanical|borg|assimilated|flesh.*machine.*horror|organic.*circuit/i],
  enemies: [
    { name: 'Assimilated Drone',   type: 'Cyborg',    baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Biomech Horror',      type: 'Cyborg',    baseHP: 18, dmg: 6, attackBonus: 4 },
    { name: 'Borg Collective Node',type: 'Elite',     baseHP: 24, dmg: 7, attackBonus: 5 },
    { name: 'Hive Queen Unit',     type: 'Boss',      baseHP: 34, dmg: 9, attackBonus: 6 },
  ]},

// ── Cursed Technology & Dark Relics
{ keywords: [/cursed.tech|dark.relic|forbidden.machine|artifact.*hostile|ancient.*device.*attacks/i],
  enemies: [
    { name: 'Cursed Drone',        type: 'Construct', baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Dark Relic Guardian', type: 'Construct', baseHP: 16, dmg: 5, attackBonus: 4 },
    { name: 'Forbidden Engine',    type: 'Elite',     baseHP: 22, dmg: 7, attackBonus: 5 },
  ]},

// ── Infected AI & Virus Entities (digital made flesh)
{ keywords: [/virus.entity|malware.*hostile|corrupted.code|worm.*physical|digital.*virus.*flesh/i],
  enemies: [
    { name: 'Virus Thrall',        type: 'Synthetic', baseHP: 8,  dmg: 3, attackBonus: 3 },
    { name: 'Malware Construct',   type: 'Synthetic', baseHP: 12, dmg: 5, attackBonus: 4 },
    { name: 'Worm Entity',         type: 'Elite',     baseHP: 18, dmg: 6, attackBonus: 5 },
    { name: 'Zero-Day Titan',      type: 'Boss',      baseHP: 28, dmg: 8, attackBonus: 6 },
  ]},
```

---

## SPACE & COSMIC (5 patterns)

```js
// ── Space Pirates & Void Raiders
{ keywords: [/space.pirate|void.raider|stellar.corsair|asteroid.*crew|ship.*boarded/i],
  enemies: [
    { name: 'Void Raider',         type: 'Humanoid',  baseHP: 9,  dmg: 3, attackBonus: 3 },
    { name: 'Space Corsair',       type: 'Humanoid',  baseHP: 12, dmg: 4, attackBonus: 4 },
    { name: 'Stellar Buccaneer',   type: 'Humanoid',  baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Void Captain',        type: 'Elite',     baseHP: 22, dmg: 6, attackBonus: 5 },
  ]},

// ── Space Marines & Stellar Military
{ keywords: [/space.marine|stellar.soldier|galactic.trooper|star.*infantry|orbital.*drop/i],
  enemies: [
    { name: 'Stellar Trooper',     type: 'Humanoid',  baseHP: 12, dmg: 4, attackBonus: 4 },
    { name: 'Space Marine',        type: 'Humanoid',  baseHP: 16, dmg: 5, attackBonus: 5 },
    { name: 'Drop Trooper',        type: 'Elite',     baseHP: 20, dmg: 6, attackBonus: 5 },
    { name: 'Orbital Commander',   type: 'Boss',      baseHP: 28, dmg: 8, attackBonus: 6 },
  ]},

// ── Void Entities & Space Horrors
{ keywords: [/void.entity|space.horror|between.stars|dark.matter.being|stellar.parasite/i],
  enemies: [
    { name: 'Void Tendril',        type: 'Aberration',baseHP: 8,  dmg: 4, attackBonus: 3 },
    { name: 'Dark Matter Wraith',  type: 'Aberration',baseHP: 12, dmg: 5, attackBonus: 4 },
    { name: 'Stellar Horror',      type: 'Elite',     baseHP: 20, dmg: 7, attackBonus: 5 },
    { name: 'Void Leviathan',      type: 'Boss',      baseHP: 36, dmg: 10,attackBonus: 6 },
  ]},

// ── Rogue Terraformers & Planet Crackers
{ keywords: [/terraformer|planet.*machine|geo.former|atmosphere.*hostile|world.engine/i],
  enemies: [
    { name: 'Terraformer Drone',   type: 'Machine',   baseHP: 10, dmg: 4, attackBonus: 3 },
    { name: 'Geo-Former Unit',     type: 'Machine',   baseHP: 16, dmg: 5, attackBonus: 3 },
    { name: 'Planet Cracker',      type: 'Boss',      baseHP: 38, dmg: 11,attackBonus: 5 },
  ]},

// ── Corrupted Colony Ships & Generation Ship Horrors
{ keywords: [/colony.ship|generation.ship|ship.*gone.wrong|crew.*turned|long.voyage.*hostile/i],
  enemies: [
    { name: 'Derelict Crew',       type: 'Undead',    baseHP: 8,  dmg: 3, attackBonus: 2 },
    { name: 'Colony Berserker',    type: 'Mutant',    baseHP: 12, dmg: 4, attackBonus: 3 },
    { name: 'Ship AI Fragment',    type: 'Machine',   baseHP: 14, dmg: 5, attackBonus: 4 },
    { name: 'Generational Horror', type: 'Boss',      baseHP: 28, dmg: 8, attackBonus: 5 },
  ]},
```

---

## Pattern Count Summary

| Category | Patterns | Enemy Variants |
|----------|----------|----------------|
| Robots & Mechanical | 10 | 38 |
| Steampunk Specific | 7 | 27 |
| Cyberpunk & Tech-Noir | 8 | 31 |
| Post-Apocalyptic | 10 | 38 |
| Alien & Xenomorph | 6 | 23 |
| Military & Spec-Ops | 5 | 19 |
| Supernatural Tech-Horror | 4 | 15 |
| Space & Cosmic | 5 | 19 |
| **TOTAL — this file** | **55** | **210** |
| **Fantasy expansion** | **~57** | **~244** |
| **Existing Stormlight** | **12** | **~40** |
| **GRAND TOTAL** | **~124** | **~494** |

---

## Notes

- All `baseHP` values are **Act 1 baselines** — `calcEnemyHP()` scales up per act
- `dmgCap` prevents one-shots regardless of `dmg` value
- These patterns are **system-agnostic** — they work for any world using the same GM narration detection system
- When D&D 5e and Custom Worlds are implemented in Phase 3/4, these fire automatically for any world where the GM narrates sci-fi/tech combat
- Specific patterns (xenomorph, predator-type) go BEFORE generic patterns (alien, machine) in the array
- The `type` field is used by combat narration — keep it evocative: `Machine`, `Cyborg`, `Alien`, `Mutant`, `Synthetic`, `Drone`, `Mech`

---

## Implementation

Same as fantasy patterns — drop inside `enterCombat()` in `app/combat.js`, merged with existing `NARRATIVE_ENEMY_PATTERNS`. Sci-fi specific patterns go AFTER the Stormlight-specific ones (Chasmfiends, Fused, Parshendi) but BEFORE the generic fantasy fallbacks.

```bash
node --check app/combat.js
git add app/combat.js
git commit -m "feat: add 55 sci-fi/steampunk/cyberpunk enemy patterns to NARRATIVE_ENEMY_PATTERNS"
git push
```
