/**
 * app/systems/custom.js — Custom World Builder
 * CYOAhub
 *
 * Takes a worldConfig from the wizard and constructs a full
 * SystemData-compatible object so the game engine works with any custom world.
 */

// Stat system presets — maps wizard selection to keys/names/full
const _STAT_PRESETS = {
  classic:    { keys:['str','dex','con','int','wis','cha'], names:['STR','DEX','CON','INT','WIS','CHA'], full:['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'] },
  cosmere:    { keys:['str','spd','int','wil','awa','pre'], names:['STR','SPD','INT','WIL','AWA','PRE'], full:['Strength','Speed','Intellect','Willpower','Awareness','Presence'] },
  simple:     { keys:['body','mind','spirit'], names:['BODY','MIND','SPIRIT'], full:['Body','Mind','Spirit'] },
  physical:   { keys:['str','agi','end','int','wil','cha'], names:['STR','AGI','END','INT','WIL','CHA'], full:['Strength','Agility','Endurance','Intelligence','Willpower','Charisma'] },
  combat:     { keys:['atk','def','spd','hp','crit'], names:['ATK','DEF','SPD','HP','CRIT'], full:['Attack','Defense','Speed','Hit Points','Critical'] },
  skillhybrid:{ keys:['str','dex','int','per','luck'], names:['STR','DEX','INT','PER','LUCK'], full:['Strength','Dexterity','Intelligence','Perception','Luck'] },
  tactical:   { keys:['power','precision','control','resolve','speed'], names:['POW','PRE','CTR','RES','SPD'], full:['Power','Precision','Control','Resolve','Speed'] },
  arcane:     { keys:['arc','vit','focus','will','essence'], names:['ARC','VIT','FOC','WIL','ESS'], full:['Arcana','Vitality','Focus','Will','Essence'] },
  dark:       { keys:['flesh','will','soul','blood','shadow'], names:['FLESH','WILL','SOUL','BLOOD','SHADOW'], full:['Flesh','Will','Soul','Blood','Shadow'] },
  narrative:  { keys:['charm','cunning','courage','wisdom','instinct'], names:['CHM','CUN','COU','WIS','INS'], full:['Charm','Cunning','Courage','Wisdom','Instinct'] },
  emotional:  { keys:['hope','fear','anger','love','ambition'], names:['HOPE','FEAR','ANGER','LOVE','AMB'], full:['Hope','Fear','Anger','Love','Ambition'] },
  cosmic:     { keys:['fate','chaos','order','will'], names:['FATE','CHAOS','ORDER','WILL'], full:['Fate','Chaos','Order','Will'] },
  survival:   { keys:['health','stamina','sanity','luck'], names:['HP','STA','SAN','LUCK'], full:['Health','Stamina','Sanity','Luck'] },
  cyberpunk:  { keys:['body','reflex','tech','intel','cool'], names:['BODY','REF','TECH','INT','COOL'], full:['Body','Reflex','Tech','Intelligence','Cool'] },
  mythic:     { keys:['might','legend','dominion','spirit'], names:['MIGHT','LEG','DOM','SPIRIT'], full:['Might','Legend','Dominion','Spirit'] },
  minimal:    { keys:['edge','flaw','drive'], names:['EDGE','FLAW','DRIVE'], full:['Edge','Flaw','Drive'] },
};

// ── Era-based weapon / kit / armor pools ──────────────────────────────────
// Each era defines heroWeapons (character creation picks), weapons (full stat
// blocks), startingKits (equipment packages), and armors.
const _ERA_WEAPON_POOLS = {
  // ─── ANCIENT ───
  Ancient: {
    heroWeapons: [
      {id:'spear',name:'Spear',type:'Polearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'The weapon of armies since the dawn of war.',tiers:['Crude','Bronze','Iron','Blessed','Mythic']},
      {id:'khopesh',name:'Khopesh',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Curved sickle-sword of ancient empires.',tiers:['Crude','Bronze','Iron','Blessed','Mythic']},
      {id:'sling',name:'Sling',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'Simple but deadly at range. David knew.',tiers:['Crude','Woven','Lead-shot','Blessed','Mythic']},
      {id:'club',name:'War Club',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Stone or hardwood — crushes bone.',tiers:['Crude','Stone-head','Iron-bound','Blessed','Mythic']},
      {id:'javelin',name:'Javelin',type:'Thrown',dmgBonus:{crit:3,hit:2,miss:0},desc:'Thrown before the charge. One shot, one kill.',tiers:['Crude','Bronze','Iron','Blessed','Mythic']},
      {id:'staff',name:'Ritual Staff',type:'Staff',dmgBonus:{crit:2,hit:2,miss:1},desc:'A channel for ancient power.',tiers:['Carved','Bound','Runed','Blessed','Mythic']},
    ],
    weapons: {
      spear:    {name:'Spear',    skill:'heavyWeapon',attr:'str',dmg:'1d8',dmgType:'keen',traits:['Reach','Thrown [20/60]']},
      khopesh:  {name:'Khopesh',  skill:'heavyWeapon',attr:'str',dmg:'1d8',dmgType:'keen',traits:['Disarm']},
      sling:    {name:'Sling',    skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'impact',traits:['Ranged [30/120]']},
      club:     {name:'War Club', skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Versatile']},
      javelin:  {name:'Javelin',  skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'keen',traits:['Thrown [30/120]']},
      staff:    {name:'Ritual Staff',skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Versatile','Arcane Focus']},
      dagger:   {name:'Flint Dagger',skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'keen',traits:['Light','Thrown [20/60]']},
      unarmed:  {name:'Unarmed',  skill:'athletics',attr:'str',dmg:'1d4',dmgType:'impact',traits:[]},
    },
    startingKits: [
      {id:'warrior',name:'Warrior',weapons:['spear','dagger'],armor:'hide',spheres:'5gp',extras:['Waterskin','Dried meat x5','Flint','Rope'],expertise:'Warfare',desc:'Armed for battle.'},
      {id:'priest',name:'Priest',weapons:['staff'],armor:'none',spheres:'10gp',extras:['Incense','Sacred oil','Clay tablets','Herbs'],expertise:'Lore',desc:'Servant of the gods.'},
      {id:'hunter',name:'Hunter',weapons:['javelin','sling'],armor:'hide',spheres:'3gp',extras:['Trap x3','Skinning knife','Waterskin','Dried meat x5'],expertise:'Survival',desc:'Tracker and provider.'},
      {id:'scout',name:'Scout',weapons:['dagger','dagger'],armor:'leather',spheres:'6gp',extras:['Rope','Signal horn','Chalk','Torches x3'],expertise:'Pathfinding',desc:'Eyes and ears of the tribe.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},hide:{name:'Hide',deflect:1,traits:['Light']},leather:{name:'Leather',deflect:1,traits:['Light']},bronze:{name:'Bronze',deflect:3,traits:['Medium','Heavy']},shield:{name:'Shield',deflect:2,traits:['Shield']}},
  },

  // ─── MEDIEVAL (default) ───
  Medieval: {
    heroWeapons: [
      {id:'sword',name:'Sword',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'A versatile blade for any warrior.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'axe',name:'Battle Axe',type:'Heavy',dmgBonus:{crit:4,hit:2,miss:0},desc:'Cleaves armor and bone.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'bow',name:'Longbow',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'Strike from a distance.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'staff',name:'Magic Staff',type:'Arcane',dmgBonus:{crit:2,hit:2,miss:1},desc:'Channel arcane power.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'daggers',name:'Twin Daggers',type:'Dual',dmgBonus:{crit:3,hit:2,miss:0},desc:'Quick and concealable.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'spear',name:'Spear',type:'Polearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'Reach and versatility.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'hammer',name:'Warhammer',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Crushes armor and shields.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'crossbow',name:'Crossbow',type:'Ranged',dmgBonus:{crit:3,hit:2,miss:0},desc:'Mechanical power, no training needed.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
    ],
    weapons: {
      dagger:     {name:'Dagger',     skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'keen',traits:['Light','Thrown']},
      shortsword: {name:'Short Sword',skill:'lightWeapon',attr:'dex',dmg:'1d6',dmgType:'keen',traits:['Light','Finesse']},
      longsword:  {name:'Long Sword', skill:'heavyWeapon',attr:'str',dmg:'1d8',dmgType:'keen',traits:['Versatile']},
      greatsword: {name:'Greatsword', skill:'heavyWeapon',attr:'str',dmg:'2d6',dmgType:'keen',traits:['Two-Handed','Heavy']},
      mace:       {name:'Mace',       skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:[]},
      staff:      {name:'Staff',      skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Versatile','Arcane Focus']},
      shortbow:   {name:'Shortbow',   skill:'lightWeapon',attr:'dex',dmg:'1d6',dmgType:'keen',traits:['Ranged [80/320]','Two-Handed']},
      longbow:    {name:'Longbow',    skill:'heavyWeapon',attr:'dex',dmg:'1d8',dmgType:'keen',traits:['Ranged [150/600]','Two-Handed','Heavy']},
      unarmed:    {name:'Unarmed',    skill:'athletics',  attr:'str',dmg:'1d4',dmgType:'impact',traits:[]},
    },
    startingKits: [
      {id:'adventurer',name:'Adventurer',weapons:['sword','dagger'],armor:'leather',spheres:'10gp',extras:['Backpack','Rope','Torch x5','Rations x5'],expertise:'Survival',desc:'Basic gear for any adventurer.'},
      {id:'scholar',name:'Scholar',weapons:['staff'],armor:'none',spheres:'15gp',extras:['Books','Ink','Parchment','Spell components'],expertise:'Lore',desc:'Tools of the learned.'},
      {id:'soldier',name:'Soldier',weapons:['sword','shield'],armor:'chain',spheres:'5gp',extras:['Rations x5','Whetstone','Bedroll'],expertise:'Military',desc:'Standard military issue.'},
      {id:'rogue',name:'Rogue',weapons:['dagger','dagger'],armor:'leather',spheres:'8gp',extras:['Lockpicks','Rope','Grappling hook','Smoke bomb'],expertise:'Underworld',desc:'Tools of the trade.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},leather:{name:'Leather',deflect:1,traits:['Light']},chain:{name:'Chain',deflect:3,traits:['Medium']},plate:{name:'Plate',deflect:5,traits:['Heavy']},shield:{name:'Shield',deflect:2,traits:['Shield']}},
  },

  // ─── RENAISSANCE ───
  Renaissance: {
    heroWeapons: [
      {id:'rapier',name:'Rapier',type:'Finesse',dmgBonus:{crit:3,hit:2,miss:0},desc:'Elegant thrusting blade of duelists.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'musket',name:'Musket',type:'Firearm',dmgBonus:{crit:4,hit:2,miss:0},desc:'Black powder and lead. Slow to reload, devastating on impact.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'cutlass',name:'Cutlass',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Short, curved, and vicious. A sailor\'s companion.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'pistol',name:'Flintlock Pistol',type:'Firearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'One shot. Make it count.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'halberd',name:'Halberd',type:'Polearm',dmgBonus:{crit:4,hit:2,miss:0},desc:'Axe, spear, and hook in one. The infantry\'s answer to cavalry.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      {id:'crossbow',name:'Crossbow',type:'Ranged',dmgBonus:{crit:3,hit:2,miss:0},desc:'Mechanical precision from a distance.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
    ],
    weapons: {
      rapier:   {name:'Rapier',   skill:'lightWeapon',attr:'dex',dmg:'1d8',dmgType:'keen',traits:['Finesse']},
      musket:   {name:'Musket',   skill:'heavyWeapon',attr:'dex',dmg:'2d6',dmgType:'impact',traits:['Ranged [80/320]','Loading','Two-Handed']},
      cutlass:  {name:'Cutlass',  skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'keen',traits:['Light']},
      pistol:   {name:'Flintlock Pistol',skill:'lightWeapon',attr:'dex',dmg:'1d10',dmgType:'impact',traits:['Ranged [30/90]','Loading']},
      halberd:  {name:'Halberd',  skill:'heavyWeapon',attr:'str',dmg:'1d10',dmgType:'keen',traits:['Reach','Two-Handed','Heavy']},
      crossbow: {name:'Crossbow', skill:'heavyWeapon',attr:'dex',dmg:'1d8',dmgType:'keen',traits:['Ranged [100/400]','Loading']},
      dagger:   {name:'Stiletto', skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'keen',traits:['Light','Thrown','Finesse']},
      unarmed:  {name:'Unarmed',  skill:'athletics',attr:'str',dmg:'1d4',dmgType:'impact',traits:[]},
    },
    startingKits: [
      {id:'duelist',name:'Duelist',weapons:['rapier','pistol'],armor:'leather',spheres:'12gp',extras:['Powder horn','Lead shot x10','Fine clothes','Perfume'],expertise:'High Society',desc:'Style and steel.'},
      {id:'scholar',name:'Scholar',weapons:['dagger'],armor:'none',spheres:'20gp',extras:['Books','Ink','Parchment','Telescope','Compass'],expertise:'Lore',desc:'Enlightenment pursuer.'},
      {id:'soldier',name:'Musketeer',weapons:['musket','cutlass'],armor:'chain',spheres:'8gp',extras:['Powder horn','Lead shot x20','Bedroll','Rations x5'],expertise:'Military',desc:'Crown\'s finest.'},
      {id:'rogue',name:'Privateer',weapons:['cutlass','pistol'],armor:'leather',spheres:'15gp',extras:['Lockpicks','Rope','Grappling hook','Spyglass'],expertise:'Underworld',desc:'Licensed scoundrel.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},leather:{name:'Leather',deflect:1,traits:['Light']},chain:{name:'Chain',deflect:3,traits:['Medium']},breastplate:{name:'Breastplate',deflect:4,traits:['Heavy']},shield:{name:'Buckler',deflect:1,traits:['Shield']}},
  },

  // ─── COLONIAL ───
  Colonial: {
    heroWeapons: [
      {id:'musket',name:'Brown Bess Musket',type:'Firearm',dmgBonus:{crit:4,hit:2,miss:0},desc:'Standard military musket. Bayonet-ready.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
      {id:'blunderbuss',name:'Blunderbuss',type:'Firearm',dmgBonus:{crit:4,hit:3,miss:1},desc:'Scattershot devastation at close range.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
      {id:'handcannon',name:'Hand Cannon',type:'Firearm',dmgBonus:{crit:4,hit:2,miss:0},desc:'Heavy single-shot pistol. Kicks like a mule.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
      {id:'rapier',name:'Officer\'s Rapier',type:'Finesse',dmgBonus:{crit:3,hit:2,miss:0},desc:'The mark of rank and breeding.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
      {id:'tomahawk',name:'Tomahawk',type:'Thrown',dmgBonus:{crit:3,hit:2,miss:0},desc:'Balanced for throwing or close combat.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
      {id:'sabre',name:'Cavalry Sabre',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Curved slashing blade for mounted and foot combat.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
      {id:'bayonet',name:'Bayonet',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'When the powder runs out, the steel speaks.',tiers:['Standard','Military','Officer\'s','Masterwork','Legendary']},
    ],
    weapons: {
      musket:      {name:'Musket',      skill:'heavyWeapon',attr:'dex',dmg:'2d6',dmgType:'impact',traits:['Ranged [80/320]','Loading','Two-Handed']},
      blunderbuss: {name:'Blunderbuss', skill:'heavyWeapon',attr:'str',dmg:'2d8',dmgType:'impact',traits:['Ranged [15/30]','Loading','Scatter']},
      handcannon:  {name:'Hand Cannon', skill:'lightWeapon',attr:'dex',dmg:'1d10',dmgType:'impact',traits:['Ranged [30/90]','Loading']},
      rapier:      {name:'Rapier',      skill:'lightWeapon',attr:'dex',dmg:'1d8',dmgType:'keen',traits:['Finesse']},
      tomahawk:    {name:'Tomahawk',    skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'keen',traits:['Light','Thrown [20/60]']},
      sabre:       {name:'Sabre',       skill:'heavyWeapon',attr:'str',dmg:'1d8',dmgType:'keen',traits:['Versatile']},
      bayonet:     {name:'Bayonet',     skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'keen',traits:['Reach']},
      dagger:      {name:'Knife',       skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'keen',traits:['Light','Thrown','Finesse']},
      unarmed:     {name:'Unarmed',     skill:'athletics',attr:'str',dmg:'1d4',dmgType:'impact',traits:[]},
    },
    startingKits: [
      {id:'soldier',name:'Soldier',weapons:['musket','bayonet'],armor:'leather',spheres:'5gp',extras:['Powder horn','Lead shot x20','Bedroll','Rations x5'],expertise:'Military',desc:'Line infantry standard issue.'},
      {id:'officer',name:'Officer',weapons:['rapier','handcannon'],armor:'leather',spheres:'15gp',extras:['Compass','Map case','Writing kit','Fine coat'],expertise:'Leadership',desc:'Rank has its privileges.'},
      {id:'frontiersman',name:'Frontiersman',weapons:['musket','tomahawk'],armor:'hide',spheres:'8gp',extras:['Trap x3','Waterskin','Flint','Fur cloak'],expertise:'Survival',desc:'Born on the frontier.'},
      {id:'privateer',name:'Privateer',weapons:['blunderbuss','sabre'],armor:'leather',spheres:'12gp',extras:['Rope','Spyglass','Grappling hook','Rum'],expertise:'Underworld',desc:'Letters of marque included.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},hide:{name:'Hide Coat',deflect:1,traits:['Light']},leather:{name:'Leather',deflect:1,traits:['Light']},chain:{name:'Chain Shirt',deflect:2,traits:['Medium']},breastplate:{name:'Breastplate',deflect:3,traits:['Heavy']},shield:{name:'Buckler',deflect:1,traits:['Shield']}},
  },

  // ─── MODERN ───
  Modern: {
    heroWeapons: [
      {id:'pistol',name:'.45 Handgun',type:'Firearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'Reliable sidearm. One in the chamber.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'shotgun',name:'Tactical Shotgun',type:'Firearm',dmgBonus:{crit:4,hit:3,miss:1},desc:'Room-clearing devastation.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'rifle',name:'Assault Rifle',type:'Firearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'Full-auto or burst. The modern soldier\'s tool.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'smg',name:'Submachine Gun',type:'Firearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'Compact, fast-firing, close-quarters king.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'sniper',name:'Sniper Rifle',type:'Firearm',dmgBonus:{crit:5,hit:2,miss:0},desc:'One shot, one kill. From half a mile.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'stunstick',name:'Stun Baton',type:'Melee',dmgBonus:{crit:2,hit:2,miss:1},desc:'Non-lethal. Usually.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'combatknife',name:'Combat Knife',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Last resort or first choice. Depends who you ask.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
      {id:'dualglocks',name:'Twin Glocks',type:'Dual Firearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'Twice the firepower. Twice the style.',tiers:['Standard','Custom','Military','Prototype','Legendary']},
    ],
    weapons: {
      pistol:      {name:'.45 Handgun',    skill:'lightWeapon',attr:'dex',dmg:'2d6',dmgType:'impact',traits:['Ranged [50/150]','Semi-Auto']},
      shotgun:     {name:'Tactical Shotgun',skill:'heavyWeapon',attr:'str',dmg:'2d8',dmgType:'impact',traits:['Ranged [30/90]','Scatter']},
      rifle:       {name:'Assault Rifle',   skill:'heavyWeapon',attr:'dex',dmg:'2d6',dmgType:'impact',traits:['Ranged [100/400]','Auto','Two-Handed']},
      smg:         {name:'SMG',             skill:'lightWeapon',attr:'dex',dmg:'2d4',dmgType:'impact',traits:['Ranged [50/150]','Auto']},
      sniper:      {name:'Sniper Rifle',    skill:'heavyWeapon',attr:'dex',dmg:'2d10',dmgType:'impact',traits:['Ranged [300/1200]','Two-Handed','Scope']},
      stunstick:   {name:'Stun Baton',      skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'energy',traits:['Stun']},
      combatknife: {name:'Combat Knife',    skill:'lightWeapon',attr:'dex',dmg:'1d6',dmgType:'keen',traits:['Light','Thrown [20/60]','Finesse']},
      dualglocks:  {name:'Twin Glocks',     skill:'lightWeapon',attr:'dex',dmg:'2d6',dmgType:'impact',traits:['Ranged [50/150]','Dual Wield','Semi-Auto']},
      unarmed:     {name:'Hand-to-Hand',    skill:'athletics',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Martial Arts']},
    },
    startingKits: [
      {id:'soldier',name:'Soldier',weapons:['rifle','combatknife'],armor:'vest',spheres:'$200',extras:['Medkit','MRE x3','Radio','Flashlight'],expertise:'Military',desc:'Standard military loadout.'},
      {id:'detective',name:'Detective',weapons:['pistol','stunstick'],armor:'concealed',spheres:'$500',extras:['Badge','Handcuffs','Flashlight','Notepad'],expertise:'Investigation',desc:'Carry the law.'},
      {id:'operative',name:'Operative',weapons:['smg','combatknife'],armor:'concealed',spheres:'$300',extras:['Lockpick set','Burner phone','Disguise kit','Zip ties'],expertise:'Underworld',desc:'Off the books.'},
      {id:'enforcer',name:'Enforcer',weapons:['shotgun','dualglocks'],armor:'vest',spheres:'$150',extras:['Brass knuckles','Bandages','Intimidating coat','Whiskey'],expertise:'Intimidation',desc:'Heavy artillery.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},concealed:{name:'Concealed Vest',deflect:1,traits:['Light','Concealable']},vest:{name:'Tactical Vest',deflect:3,traits:['Medium']},heavy:{name:'Heavy Body Armor',deflect:5,traits:['Heavy']},riot:{name:'Riot Shield',deflect:2,traits:['Shield']}},
  },

  // ─── POST-APOCALYPTIC ───
  'Post-Apocalyptic': {
    heroWeapons: [
      {id:'pipe',name:'Lead Pipe',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Ripped from the ruins. Gets the job done.',tiers:['Scrap','Reinforced','Spiked','Electrified','Masterwork']},
      {id:'machete',name:'Machete',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Clears brush and skulls alike.',tiers:['Rusty','Sharpened','Serrated','Hardened','Masterwork']},
      {id:'shotgun',name:'Salvaged Shotgun',type:'Firearm',dmgBonus:{crit:4,hit:3,miss:1},desc:'Duct tape and prayers hold it together.',tiers:['Scrap','Patched','Reliable','Custom','Masterwork']},
      {id:'crossbow',name:'Makeshift Crossbow',type:'Ranged',dmgBonus:{crit:3,hit:2,miss:0},desc:'Silent. Reusable bolts. Smart.',tiers:['Scrap','Reinforced','Compound','Precision','Masterwork']},
      {id:'knuckles',name:'Spiked Knuckles',type:'Unarmed',dmgBonus:{crit:3,hit:2,miss:0},desc:'For when it gets personal.',tiers:['Scrap','Reinforced','Bladed','Powered','Masterwork']},
      {id:'molotov',name:'Molotov Cocktail',type:'Thrown',dmgBonus:{crit:3,hit:2,miss:1},desc:'Gasoline and rage in a bottle.',tiers:['Crude','Standard','Incendiary','Napalm','Masterwork']},
      {id:'revolver',name:'Rusty Revolver',type:'Firearm',dmgBonus:{crit:3,hit:2,miss:0},desc:'Six shots. Count them.',tiers:['Scrap','Cleaned','Tuned','Custom','Masterwork']},
    ],
    weapons: {
      pipe:     {name:'Lead Pipe',    skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Versatile']},
      machete:  {name:'Machete',      skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'keen',traits:['Light']},
      shotgun:  {name:'Salvaged Shotgun',skill:'heavyWeapon',attr:'str',dmg:'2d6',dmgType:'impact',traits:['Ranged [20/60]','Loading','Scatter']},
      crossbow: {name:'Makeshift Crossbow',skill:'heavyWeapon',attr:'dex',dmg:'1d8',dmgType:'keen',traits:['Ranged [80/320]','Loading']},
      knuckles: {name:'Spiked Knuckles',skill:'athletics',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Light']},
      molotov:  {name:'Molotov',      skill:'lightWeapon',attr:'dex',dmg:'2d4',dmgType:'energy',traits:['Thrown [20/60]','Fire','Single-use']},
      revolver: {name:'Revolver',     skill:'lightWeapon',attr:'dex',dmg:'1d10',dmgType:'impact',traits:['Ranged [40/120]']},
      dagger:   {name:'Shiv',         skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'keen',traits:['Light','Thrown','Finesse']},
      unarmed:  {name:'Bare Fists',   skill:'athletics',attr:'str',dmg:'1d4',dmgType:'impact',traits:[]},
    },
    startingKits: [
      {id:'scavenger',name:'Scavenger',weapons:['machete','revolver'],armor:'scrap',spheres:'3 caps',extras:['Backpack','Water bottle','Canned food x3','Duct tape'],expertise:'Survival',desc:'Everything you own fits in one bag.'},
      {id:'raider',name:'Raider',weapons:['pipe','shotgun'],armor:'scrap',spheres:'5 caps',extras:['Chains','War paint','Intimidating mask','Moonshine'],expertise:'Intimidation',desc:'Take what you want.'},
      {id:'wastelander',name:'Wastelander',weapons:['crossbow','machete'],armor:'leather',spheres:'4 caps',extras:['Trap x2','Rope','Binoculars','Dried meat x3'],expertise:'Pathfinding',desc:'Born in the wastes.'},
      {id:'tinker',name:'Tinker',weapons:['revolver','molotov'],armor:'leather',spheres:'8 caps',extras:['Tool kit','Scrap metal x5','Wire','Batteries'],expertise:'Lore',desc:'If it\'s broken, you fix it.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},scrap:{name:'Scrap Armor',deflect:1,traits:['Light','Jury-rigged']},leather:{name:'Leather',deflect:1,traits:['Light']},plated:{name:'Plated Vest',deflect:3,traits:['Medium','Heavy']},shield:{name:'Car Door Shield',deflect:2,traits:['Shield','Improvised']}},
  },

  // ─── FUTURISTIC / SCI-FI ───
  Futuristic: {
    heroWeapons: [
      {id:'blaster',name:'Plasma Blaster',type:'Energy',dmgBonus:{crit:4,hit:2,miss:0},desc:'Superheated plasma bolt. Melts through cover.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'laserPistol',name:'Laser Pistol',type:'Energy',dmgBonus:{crit:3,hit:2,miss:0},desc:'Precision beam weapon. Silent, accurate, lethal.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'railgun',name:'Rail Rifle',type:'Firearm',dmgBonus:{crit:5,hit:2,miss:0},desc:'Magnetically accelerated slugs. Penetrates anything.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'vibroblade',name:'Vibro-Blade',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Molecularly sharp edge, vibrating at ultrasonic frequency.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'stunstick',name:'Shock Baton',type:'Melee',dmgBonus:{crit:2,hit:2,miss:1},desc:'Neural disruption on contact. Non-lethal setting available.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'grenades',name:'Pulse Grenades',type:'Explosive',dmgBonus:{crit:4,hit:3,miss:1},desc:'EMP burst shreds shields and circuits.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'smartgun',name:'Smart Pistol',type:'Energy',dmgBonus:{crit:3,hit:3,miss:0},desc:'AI-assisted targeting. The gun aims for you.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
      {id:'plasmasword',name:'Plasma Sword',type:'Energy Melee',dmgBonus:{crit:4,hit:2,miss:0},desc:'Contained plasma edge. Cuts through bulkheads.',tiers:['Standard','Advanced','Military','Prototype','Legendary']},
    ],
    weapons: {
      blaster:     {name:'Plasma Blaster',  skill:'heavyWeapon',attr:'dex',dmg:'2d8',dmgType:'energy',traits:['Ranged [100/400]','Two-Handed','Overheat']},
      laserPistol: {name:'Laser Pistol',    skill:'lightWeapon',attr:'dex',dmg:'2d4',dmgType:'energy',traits:['Ranged [60/240]','Silent']},
      railgun:     {name:'Rail Rifle',       skill:'heavyWeapon',attr:'dex',dmg:'2d10',dmgType:'impact',traits:['Ranged [200/800]','Two-Handed','Piercing']},
      vibroblade:  {name:'Vibro-Blade',      skill:'lightWeapon',attr:'dex',dmg:'2d6',dmgType:'keen',traits:['Finesse','Armor Piercing']},
      stunstick:   {name:'Shock Baton',      skill:'lightWeapon',attr:'str',dmg:'1d8',dmgType:'energy',traits:['Stun','Non-lethal']},
      grenades:    {name:'Pulse Grenade',    skill:'lightWeapon',attr:'dex',dmg:'3d6',dmgType:'energy',traits:['Thrown [40/120]','AoE','Single-use']},
      smartgun:    {name:'Smart Pistol',     skill:'lightWeapon',attr:'dex',dmg:'2d6',dmgType:'energy',traits:['Ranged [60/240]','Smart-targeting']},
      plasmasword: {name:'Plasma Sword',     skill:'heavyWeapon',attr:'str',dmg:'2d8',dmgType:'energy',traits:['Two-Handed']},
      unarmed:     {name:'Cybernetic Strike',skill:'athletics',attr:'str',dmg:'1d8',dmgType:'impact',traits:['Augmented']},
    },
    startingKits: [
      {id:'trooper',name:'Trooper',weapons:['blaster','vibroblade'],armor:'tactical',spheres:'200cr',extras:['Medpatch x3','Ration pack x5','Comm unit','Flashlight'],expertise:'Military',desc:'Standard colonial trooper gear.'},
      {id:'tech',name:'Technician',weapons:['laserPistol','stunstick'],armor:'light',spheres:'350cr',extras:['Datapad','Tool kit','Hacking module','Scanner'],expertise:'Lore',desc:'Brains over brawn.'},
      {id:'bounty',name:'Bounty Hunter',weapons:['smartgun','grenades'],armor:'tactical',spheres:'150cr',extras:['Tracking beacon','Binders','Bioscanner','Stim x2'],expertise:'Tracking',desc:'Dead or alive.'},
      {id:'smuggler',name:'Smuggler',weapons:['laserPistol','vibroblade'],armor:'light',spheres:'400cr',extras:['Hidden compartment','Forgery kit','Comm jammer','Stim x2'],expertise:'Underworld',desc:'What cargo? I don\'t see any cargo.'},
    ],
    armors: {none:{name:'No Armor',deflect:0,traits:[]},light:{name:'Light Shielding',deflect:1,traits:['Light','Energy Shield']},tactical:{name:'Tactical Armor',deflect:3,traits:['Medium','Powered']},heavy:{name:'Power Armor',deflect:5,traits:['Heavy','Powered','Sealed']},shield:{name:'Energy Buckler',deflect:2,traits:['Shield','Energy']}},
  },

  // ─── TIMELESS (fallback — uses Medieval) ───
  Timeless: null, // resolved at runtime to Medieval
};
// Timeless resolves to Medieval
_ERA_WEAPON_POOLS.Timeless = _ERA_WEAPON_POOLS.Medieval;

function _resolveStats(statsOverride, systemId) {
  if (statsOverride && statsOverride.keys) return { statKeys: statsOverride.keys, statNames: statsOverride.names, statFull: statsOverride.full };
  const preset = _STAT_PRESETS[systemId] || _STAT_PRESETS.classic;
  return { statKeys: preset.keys, statNames: preset.names, statFull: preset.full };
}

// ── Helper: build rules block from wizard config ──
function _buildRules(cfg) {
  const magic = cfg.magic || {};
  const stats = _resolveStats(null, cfg.statSystem);
  const keys = stats.statKeys || ['str','dex','con','int','wis','cha'];

  // Build defense pairs from stat keys
  const defenses = [];
  if (keys.length >= 6) {
    defenses.push({ id: 'physDef', label: 'Physical Defense', base: 10, stats: [keys[0], keys[1]] });
    defenses.push({ id: 'cogDef',  label: 'Mental Defense',   base: 10, stats: [keys[2], keys[3]] });
    defenses.push({ id: 'spirDef', label: 'Spirit Defense',   base: 10, stats: [keys[4], keys[5]] });
  } else if (keys.length >= 4) {
    defenses.push({ id: 'physDef', label: 'Physical Defense', base: 10, stats: [keys[0], keys[1]] });
    defenses.push({ id: 'cogDef',  label: 'Mental Defense',   base: 10, stats: [keys[2], keys[3]] });
  } else if (keys.length >= 2) {
    defenses.push({ id: 'physDef', label: 'Defense', base: 10, stats: [keys[0], keys[1]] });
  } else {
    defenses.push({ id: 'physDef', label: 'Defense', base: 10, stats: [keys[0] || 'str'] });
  }

  return {
    defenses,
    hp: { base: 10, stat: keys[0] || 'str', perLevel: 5 },
    focus: { base: 2, stat: keys.length >= 4 ? keys[3] : keys[0] },
    magicPool: {
      enabled: magic.exists !== false,
      label: magic.resource || magic.name || 'Mana',
      formula: 'max',
      base: 2,
      stats: keys.length >= 6 ? [keys[4], keys[5]] : [keys[keys.length - 1]],
      classGated: true,
    },
    recoveryDie: {
      stat: keys.length >= 4 ? keys[3] : keys[0],
      table: [
        { maxStat:0, die:4 }, { maxStat:2, die:6 }, { maxStat:4, die:8 },
        { maxStat:6, die:10 }, { maxStat:8, die:12 }, { maxStat:999, die:20 },
      ],
    },
    skillAttrMap: _buildSkillMap(keys),
    deflectableTypes: ['energy','impact','keen'],
    currency: { name: cfg.currencyName || 'gold', symbol: cfg.currencySymbol || 'gp', tiers: null },
    statGenMethod: cfg.statGenMethod || 'pointbuy',
    progressionType: magic.exists !== false ? 'oaths' : 'milestones',
    progressionLabel: magic.exists !== false ? 'Oath' : 'Milestone',
    maxProgression: 5,
    turnOrder: 'fast-slow',
    healClassMultipliers: {},
    equipmentDrops: {
      enabled: true, fragmentName: 'fragment', craftCost: 3, upgradeCost: 5,
      legendaryName: 'Legendary Weapon', armorName: 'Legendary Armor',
    },
  };
}

function _buildSkillMap(keys) {
  const base = {};
  const skillDefaults = ['athletics','stealth','arcana','insight','persuasion','survival','perception','intimidation','medicine','deception','lightWeapon','heavyWeapon'];
  skillDefaults.forEach((sk, i) => { base[sk] = keys[i % keys.length]; });
  return base;
}

// ── Helper: build charCreation block from wizard config ──
function _buildCharCreation(cfg) {
  const magic = cfg.magic || {};
  return {
    paths: [
      { id: 'class', label: 'Class', icon: '⚔',
        desc: '"Choose your combat role."',
        sublabel: 'Primary path · Abilities · Progression' },
      { id: 'background', label: 'Background', icon: '✦',
        desc: '"Your past defines your skills."',
        sublabel: 'Explorer · Scholar · Outlaw · Noble · Soldier · Mystic' },
    ],
    classLabel: 'Class', backgroundLabel: 'Background',
    classHeading: 'Your Class', backgroundHeading: 'Your Background',
    classFlavor: 'Choose your path in ' + (cfg.name || 'this world') + '.',
    backgroundFlavor: 'What shaped you?',
    ancestryLabel: (cfg.races && cfg.races.length) ? 'Race' : 'Ancestry',
    partyLabel: 'Adventuring Party',
    submitText: { class: 'Create Character →', background: 'Create Character →' },
    origins: cfg.locations || null,
    startMessage: 'The party forms. The adventure begins in {location}.',
    actNames: ['The {loc}', 'Secrets of {loc}', 'The Reckoning of {loc}'],
    attributePoints: cfg.pointBuyPool || 27, maxPerAttribute: Math.ceil((cfg.pointBuyPool || 27) / ((_STAT_PRESETS[cfg.statSystem] || _STAT_PRESETS.classic).keys.length || 6)),
    showBlade: false, showWeapon: !(cfg.combatFrequency || '').startsWith('None'), showCompanion: false,
    showKit: !(cfg.combatFrequency || '').startsWith('None'),
    namePlaceholder: 'What do they call you?',
  };
}

// ── Helper: build classes from wizard class rows ──
function _buildClasses(cfg) {
  // If wizard provided custom classes, use them
  const wizClasses = cfg.wizClasses || [];
  const stats = _resolveStats(null, cfg.statSystem);
  const keys = stats.statKeys || ['str','dex','con','int','wis','cha'];
  const magic = cfg.magic || {};
  const hasMagic = magic.exists !== false;

  // Default archetypes if no wizard classes provided
  const defaults = [
    { name: 'Warrior', desc: 'A master of martial combat.', color: '#9B2335',
      abilities: ['Power Strike','Battle Cry','Defensive Stance','Whirlwind Attack','Undying Resolve'] },
    { name: 'Mage', desc: 'A wielder of arcane power.', color: '#4169E1',
      abilities: ['Arcane Blast','Mystic Shield','Elemental Surge','Teleport','Time Stop'] },
    { name: 'Rogue', desc: 'A cunning operative of stealth and precision.', color: '#4A4A4A',
      abilities: ['Sneak Attack','Evasion','Smoke Bomb','Assassinate','Vanish'] },
    { name: 'Healer', desc: 'A devoted healer and protector.', color: '#2E8B57',
      abilities: ['Healing Touch','Purify','Divine Shield','Resurrect','Holy Nova'] },
  ];

  const source = wizClasses.length >= 2 ? wizClasses : defaults;

  return source.map((cls, i) => {
    const name = cls.name || defaults[i % defaults.length].name;
    const id = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const fallback = defaults[i % defaults.length];

    // Distribute stat bonuses across classes (rotate through stat keys)
    const bonus = {};
    keys.forEach(k => { bonus[k] = 0; });
    if (keys.length >= 2) {
      bonus[keys[i % keys.length]] = 2;
      bonus[keys[(i + 1) % keys.length]] = 1;
    }

    return {
      id,
      name,
      philosophy: fallback.desc || ('The way of the ' + name + '.'),
      surges: hasMagic && i % 2 === 1 ? ['arcaneBlast','ward','heal'] : [],
      ideal1: 'I walk the path of the ' + name + '.',
      ideal2: 'My skills grow sharper every day.',
      ideal3: 'None can match me in my domain.',
      ideal4: 'I have become the legend.',
      spren: cls.name + ' Training',
      sprenDesc: 'Deep training in the ways of the ' + name + '.',
      sprenAssist: 'Class-specific skills and instincts',
      desc: fallback.desc || ('A ' + name.toLowerCase() + ' of great skill.'),
      bonus,
      abilities: fallback.abilities || ['Strike','Defend','Focus','Special','Ultimate'],
      dmgBonus: { crit: 3, hit: 2, miss: 0 },
      color: fallback.color || '#' + Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0'),
      imgUrl: cls.imgUrl || '',
    };
  });
}

window.CustomSystem = {
  /**
   * Build a complete SystemData object from wizard worldConfig.
   * @param {Object} cfg - worldConfig from the wizard form
   * @returns {Object} A full SystemData-compatible object
   */
  build(cfg) {
    const id = cfg.id || 'custom-' + Date.now();
    const name = cfg.name || 'Custom World';
    const theme = cfg.theme || {};
    const magic = cfg.magic || {};
    const gm = cfg.gm || {};
    const enemies = cfg.enemies || {};

    // Derive a darken/lighten helper for generating themeVars from primary color
    const _hex = (h) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return [r,g,b]; };
    const _toHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
    const _mix = (c,factor) => { const [r,g,b]=_hex(c||'#28a8a0'); return _toHex(r*factor,g*factor,b*factor); };
    const pri = theme.primary || '#28a8a0';
    const sec = theme.secondary || '#8ab4d4';

    return {
      id,
      name,
      _era: cfg.era || 'Medieval',
      statSystem: cfg.statSystem || null,
      pointBuyPool: cfg.pointBuyPool || null,
      _combatFrequency: cfg.combatFrequency || 'Moderate',
      _factions: cfg.factions || '',
      _climate: cfg.climate || 'Temperate — Mild seasons',
      _npcDialogue: cfg.npcDialogue || '',
      moralityAxis: cfg.moralityAxis || 'None — Moral ambiguity',
      climate: cfg.climate || 'Temperate — Mild seasons',
      npcDialogue: cfg.npcDialogue || '',
      subtitle: cfg.tagline || 'A Custom Adventure',
      tagline: cfg.tagline || '',
      cardImage: cfg.cardImage || '',
      glyph: '🌍',
      ambientAudio: cfg.ambientAudio || 'forest',

      theme: {
        primary:     theme.primary     || '#C9A84C',
        secondary:   theme.secondary   || '#28A87A',
        danger:      theme.danger      || '#B03828',
        bg:          theme.bg          || '#0F0D08',
        surface:     theme.surface     || '#141109',
        text:        theme.text        || '#F8F3E8',
        muted:       theme.muted       || '#A07830',
        glow:        theme.glow        || '#C9A84C',
        bgTone:      theme.bgTone      || 'dark',
        titleFont:   theme.titleFont   || 'Cinzel',
        bodyFont:    theme.bodyFont    || 'Crimson Pro',
        uiStyle:     theme.uiStyle     || 'Glassmorphism',
        buttonStyle: theme.buttonStyle || 'Rounded',
        bgEffect:    theme.bgEffect    || 'Floating Particles',
        cardStyle:   theme.cardStyle   || 'Glass',
      },

      // Full CSS variable palette — derived from wizard color picks
      themeVars: {
        bg:    theme.bg    || '#0A0C10',
        bg2:   theme.surface || _mix(pri, 0.08),
        bg3:   _mix(pri, 0.12),
        bg4:   _mix(pri, 0.16),
        border:  _mix(pri, 0.15),
        border2: _mix(pri, 0.22),
        border3: _mix(pri, 0.35),
        primary:    pri,
        goldMid:    _mix(pri, 1.3),
        goldBright: _mix(pri, 1.6),
        goldDim:    _mix(pri, 0.4),
        secondary: sec,
        teal:  _mix(sec, 0.7),
        teal2: sec,
        danger:    theme.danger || '#B03828',
        coral2:    _mix(theme.danger || '#B03828', 1.2),
        text:  theme.text  || '#E8E4E0',
        text2: theme.text  ? _mix(theme.text, 0.92) : '#D8D4D0',
        text3: theme.muted ? _mix(theme.muted, 1.2) : '#A0A0A8',
        text4: theme.muted || '#707078',
        text5: theme.muted ? _mix(theme.muted, 0.6) : '#404048',
      },

      gmContext: {
        worldName:       gm.worldName       || name,
        systemName:      name,
        magicName:       magic.name          || 'Magic',
        magicResource:   magic.resource      || 'Mana',
        combatFlavor:    name,
        healFlavor:      magic.healFlavor    || (magic.name ? magic.name + ' healing' : 'Healing magic'),
        errorFlavor:     'Something went wrong in ' + name + '.',
        worldLore:       gm.worldLore        || 'A world of adventure and mystery.',
        toneInstruction: gm.tone             || 'Epic fantasy — mythic stakes, personal cost.',
        magicRules:      magic.rules          || 'Magic costs ' + (magic.resource || 'Mana') + '. Casters must rest to recover.',
        npcFlavor:       gm.npcFlavor        || 'Fantasy names and cultures. Tavern keepers, guild masters, mysterious travelers.',
        choiceTagRules:  '[COMBAT] [DISCOVERY] [DECISION] [MAGIC] — tag every player choice.',
      },

      // ── Rules Config (generated from wizard) ──
      rules: _buildRules(cfg),

      // ── Character Creation Config — use saved if present (DB reload), else build from wizard ──
      charCreation: (cfg.charCreation && cfg.charCreation.attributePoints) ? cfg.charCreation : _buildCharCreation(cfg),

      // ── Combat Actions ──
      combatActions: (magic.exists !== false) ? [
        { id: 'attack', tag: 'ATTACK', label: 'Attack', icon: '⚔', cost: null },
        { id: 'defend', tag: 'DEFEND', label: 'Defend', icon: '🛡', cost: null },
        { id: 'heal',   tag: 'HEAL',   label: 'Heal',   icon: '✦', cost: null },
        { id: 'magic',  tag: 'MAGIC',  label: magic.name || 'Cast', icon: '✨', cost: 'magicPool:1' },
      ] : [
        { id: 'attack', tag: 'ATTACK', label: 'Attack', icon: '⚔', cost: null },
        { id: 'defend', tag: 'DEFEND', label: 'Defend', icon: '🛡', cost: null },
        { id: 'heal',   tag: 'HEAL',   label: 'Heal',   icon: '✦', cost: null },
        { id: 'flee',   tag: 'FLEE',   label: 'Flee',   icon: '🏃', cost: null },
      ],

      // ── Story Actions ──
      storyActions: [
        { id: 'combat',    tag: 'COMBAT',    label: 'Combat' },
        { id: 'discovery', tag: 'DISCOVERY', label: 'Discovery' },
        { id: 'decision',  tag: 'DECISION',  label: 'Decision' },
        { id: 'magic',     tag: 'MAGIC',     label: magic.name || 'Magic' },
      ],

      // Use generic fantasy defaults for all data tables
      // These provide a playable baseline for any custom world

      ..._resolveStats(null, cfg.statSystem),

      // Classes — use saved classes if present (DB reload), else build from wizard rows
      classes: (cfg.classes && cfg.classes.length && cfg.classes[0].id) ? cfg.classes : _buildClasses(cfg),

      sprenBonds: cfg.sprenBonds || {
        warrior:{name:'Battle Spirit',nick:'Spirit',stages:['A fire kindles within you...','Your instincts sharpen — you see openings others miss.','Your body moves before your mind — reflexes perfected.','In combat, time slows. Every move is deliberate.','You are the weapon itself. Unstoppable.'],color:'#9B2335'},
        mage:{name:'Arcane Echo',nick:'Echo',stages:['Whispers of power tickle the edge of your mind...','The words of power come more easily now.','Magic flows through you like a river through a canyon.','Reality bends at your mere thought.','You see the fabric of existence — and you hold the thread.'],color:'#4169E1'},
        rogue:{name:'Shadow Instinct',nick:'Shadow',stages:['You notice things others overlook...','Shadows bend toward you, offering concealment.','Your reflexes defy explanation.','You slip through danger like smoke through fingers.','You are the darkness between heartbeats.'],color:'#4A4A4A'},
        healer:{name:'Life Force',nick:'Life',stages:['A warmth settles in your hands...','Your touch soothes pain — you sense injuries.','Life energy flows through you visibly now.','Plants grow where you walk. Wounds close at your glance.','You are the heartbeat of the world.'],color:'#2E8B57'},
      },

      heroRoles: cfg.heroRoles || [
        {id:'explorer',name:'Explorer',icon:'🧭',keyTalent:'Pathfinder',keyTalentDesc:'You can always find your way and cannot be lost.',startingSkill:'survival',specialties:['Scout','Cartographer','Ranger'],buildAttrs:['dex','wis'],buildSkills:['Survival','Perception'],multiPath:['Scholar','Outlaw'],desc:'A seasoned traveler and wayfinder.',bonus:{str:0,dex:1,con:0,int:0,wis:1,cha:0},ideal:'The horizon always calls.',color:'#6B8E23'},
        {id:'scholar',name:'Scholar',icon:'📖',keyTalent:'Lorekeeper',keyTalentDesc:'You can recall obscure facts and know where to find information.',startingSkill:'arcana',specialties:['Sage','Alchemist','Historian'],buildAttrs:['int','wis'],buildSkills:['Arcana','History'],multiPath:['Explorer','Noble'],desc:'A keeper of knowledge.',bonus:{str:0,dex:0,con:0,int:2,wis:0,cha:0},ideal:'Knowledge is the only treasure that grows when shared.',color:'#4169E1'},
        {id:'outlaw',name:'Outlaw',icon:'🗡',keyTalent:'Underground Contacts',keyTalentDesc:'You have connections in the criminal underworld.',startingSkill:'stealth',specialties:['Thief','Smuggler','Spy'],buildAttrs:['dex','cha'],buildSkills:['Deception','Stealth'],multiPath:['Explorer','Soldier'],desc:'Someone who lives outside the law.',bonus:{str:0,dex:1,con:0,int:0,wis:0,cha:1},ideal:'Freedom is worth any price.',color:'#4A4A4A'},
        {id:'noble',name:'Noble',icon:'👑',keyTalent:'Privilege',keyTalentDesc:'Common folk defer to you and nobles recognize your status.',startingSkill:'persuasion',specialties:['Courtier','Knight','Heir'],buildAttrs:['cha','int'],buildSkills:['History','Persuasion'],multiPath:['Scholar','Soldier'],desc:'Born to wealth and power.',bonus:{str:0,dex:0,con:0,int:1,wis:0,cha:1},ideal:'With power comes responsibility.',color:'#800080'},
        {id:'soldier',name:'Soldier',icon:'🛡',keyTalent:'Military Rank',keyTalentDesc:'Former soldiers recognize your authority and will assist you.',startingSkill:'athletics',specialties:['Officer','Mercenary','Guard'],buildAttrs:['str','con'],buildSkills:['Athletics','Intimidation'],multiPath:['Outlaw','Noble'],desc:'A trained warrior.',bonus:{str:1,dex:0,con:1,int:0,wis:0,cha:0},ideal:'Those who fight beside me are worth dying for.',color:'#9B2335'},
        {id:'mystic',name:'Mystic',icon:'🔮',keyTalent:'Spirit Sight',keyTalentDesc:'You can sense magical auras and supernatural presences.',startingSkill:'insight',specialties:['Oracle','Shaman','Monk'],buildAttrs:['wis','cha'],buildSkills:['Insight','Religion'],multiPath:['Scholar','Explorer'],desc:'One who walks between worlds.',bonus:{str:0,dex:0,con:0,int:0,wis:1,cha:1},ideal:'The unseen world shapes the seen.',color:'#9370DB'},
      ],

      heroWeapons: cfg.heroWeapons || (_ERA_WEAPON_POOLS[cfg.era] || _ERA_WEAPON_POOLS.Medieval).heroWeapons,

      ancestries: (cfg.races && cfg.races.length >= 2)
        ? cfg.races.map((name, i) => ({
            id: name.toLowerCase().replace(/\s+/g,''),
            name,
            desc: name + ' — a playable race in ' + (cfg.name || 'this world') + '.',
            size: 'Medium',
            bonusTalentSource: 'heritage',
            bonusTalentTiers: [1,5,10,15,20],
            color: pri, // use world primary color
          }))
        : cfg.ancestries || [
          {id:'human',name:'Human',desc:'Adaptable and ambitious.',size:'Medium',bonusTalentSource:'background',bonusTalentTiers:[1,4,8,12,16,19],color:pri},
          {id:'other',name:'Other',desc:'A unique heritage.',size:'Medium',bonusTalentSource:'heritage',bonusTalentTiers:[1,5,10,15,20],color:sec},
        ],

      cultures: cfg.cultures || [
        {id:'urban',name:'City-Born',region:'Major Cities',lang:'Common',desc:'Raised in a bustling city among trade and politics.',expertise:'City navigation, guild knowledge, social etiquette.',color:'#9B2335'},
        {id:'rural',name:'Rural',region:'Farmlands',lang:'Common',desc:'Raised among fields and forests, close to the land.',expertise:'Farming, animal care, weather reading, folk remedies.',color:'#6B8E23'},
        {id:'frontier',name:'Frontier',region:'Borderlands',lang:'Common / tribal',desc:'Raised on the edge of civilization, between law and wildness.',expertise:'Survival, hunting, danger sense, frontier justice.',color:'#8B4513'},
        {id:'nomad',name:'Nomad',region:'Traveling',lang:'Various',desc:'No fixed home — caravan, tribe, or wanderer.',expertise:'Travel routes, camp craft, cultural adaptability, trade.',color:'#909090'},
      ],

      singerForms: {},

      startingKits: cfg.startingKits || (_ERA_WEAPON_POOLS[cfg.era] || _ERA_WEAPON_POOLS.Medieval).startingKits,

      weapons: cfg.weapons || (_ERA_WEAPON_POOLS[cfg.era] || _ERA_WEAPON_POOLS.Medieval).weapons,

      armors: cfg.armors || (_ERA_WEAPON_POOLS[cfg.era] || _ERA_WEAPON_POOLS.Medieval).armors,

      surges: cfg.surges || [
        {id:'arcaneBlast',name:'Arcane Blast',attr:'int',orders:['mage'],desc:'A bolt of raw magical energy.',dmgType:'energy',targetDef:'physDef'},
        {id:'ward',name:'Mystic Ward',attr:'wis',orders:['mage','healer'],desc:'A shield of magical force.',dmgType:null,targetDef:null},
        {id:'heal',name:'Healing Touch',attr:'wis',orders:['healer'],desc:'Channel life energy to mend wounds.',dmgType:null,targetDef:null},
        {id:'smite',name:'Holy Smite',attr:'cha',orders:['healer'],desc:'Strike with divine radiance.',dmgType:'energy',targetDef:'spirDef'},
      ],

      surgeScale: [{rank:1,die:'d4',size:'Minor'},{rank:2,die:'d6',size:'Standard'},{rank:3,die:'d8',size:'Greater'},{rank:4,die:'d10',size:'Superior'},{rank:5,die:'d12',size:'Supreme'}],

      orderSurges: cfg.orderSurges || {warrior:[],mage:['arcaneBlast','ward'],rogue:[],healer:['heal','smite','ward']},

      conditions: {
        poisoned:{name:'Poisoned',desc:'Disadvantage on attacks and ability checks.'},
        stunned:{name:'Stunned',desc:'Cannot take actions. Attacks against have advantage.'},
        prone:{name:'Prone',desc:'Melee attacks against have advantage. Must use movement to stand.'},
        restrained:{name:'Restrained',desc:'Speed 0. Attacks have disadvantage.'},
        frightened:{name:'Frightened',desc:'Disadvantage on checks while source of fear is visible.'},
        unconscious:{name:'Unconscious',desc:'Cannot take actions. Prone. Attacks are auto-crits in melee.'},
        burning:{name:'Burning',desc:'Take damage at start of each turn until extinguished.'},
        frozen:{name:'Frozen',desc:'Speed halved. Disadvantage on DEX checks.'},
      },

      injuryEffects: [
        'Exhausted (general stamina loss)',
        'Exhausted (general stamina loss)',
        'Prone (knocked down)',
        'Stunned (dazed by blow)',
        'Frightened (shaken)',
        'Restrained (pinned)',
        'Poisoned (infected wound)',
        'One arm injured — single-handed only',
      ],

      adversaryRoles: {
        minion:{name:'Minion',healthMult:0.5,threat:0.5,noCrit:true,rule:'Defeated on any critical hit'},
        rival:{name:'Rival',healthMult:1,threat:1,noCrit:false,rule:'Standard adversary'},
        boss:{name:'Boss',healthMult:2,threat:4,noCrit:false,rule:'Extra actions and legendary resistances'},
      },

      combatOpps: ['Reinforcements arrive','Enemy flees','Discover useful item','Environmental advantage','Enemy drops weapon','Brief respite — recover resources','Spot hidden path','Enemy reveals weakness','Ally arrives','Gain high ground','Find cover','Enemy infighting'],
      combatComps: ['Enemy reinforcements','Ally falls','Position compromised','Equipment damaged','Environmental hazard','Trap triggered','Spell fizzles','Light goes out','Enemy escapes','Time pressure increases','Ground gives way'],

      npcMale: ['Aldric','Bram','Cedric','Darian','Eldon','Falk','Gareth','Hadric','Iver','Jorin','Kael','Lucan','Magnus','Nolan','Osric','Petyr','Quinn','Rowan','Soren','Theron'],
      npcFemale: ['Alara','Bryn','Celia','Dahlia','Elara','Freya','Gwen','Helena','Iris','Joanna','Kira','Luna','Mira','Nessa','Ophelia','Petra','Roslyn','Sera','Thalia','Una'],
      colors: [{name:'Red',hex:'#c44a28'},{name:'Blue',hex:'#4169E1'},{name:'Green',hex:'#2E8B57'},{name:'Gold',hex:'#C4972F'},{name:'Purple',hex:'#800080'},{name:'Silver',hex:'#C0C0C0'},{name:'Amber',hex:'#DAA520'},{name:'Teal',hex:'#008B8B'}],
      npcColors: ['#c44a28','#4169E1','#2E8B57','#C4972F','#800080','#C0C0C0','#DAA520','#008B8B','#9B2335','#4A4A4A'],

      skills: [
        {id:'acrobatics',name:'Acrobatics',attr:'dex',group:'physical'},
        {id:'athletics',name:'Athletics',attr:'str',group:'physical'},
        {id:'stealth',name:'Stealth',attr:'dex',group:'physical'},
        {id:'arcana',name:'Arcana',attr:'int',group:'mental'},
        {id:'history',name:'History',attr:'int',group:'mental'},
        {id:'medicine',name:'Medicine',attr:'wis',group:'mental'},
        {id:'deception',name:'Deception',attr:'cha',group:'social'},
        {id:'insight',name:'Insight',attr:'wis',group:'social'},
        {id:'intimidation',name:'Intimidation',attr:'cha',group:'social'},
        {id:'perception',name:'Perception',attr:'wis',group:'social'},
        {id:'persuasion',name:'Persuasion',attr:'cha',group:'social'},
        {id:'survival',name:'Survival',attr:'wis',group:'exploration'},
        {id:'lightWeapon',name:'Light Weaponry',attr:'dex',group:'physical'},
        {id:'heavyWeapon',name:'Heavy Weaponry',attr:'str',group:'physical'},
      ],

      pathSkills: {warrior:'athletics',mage:'arcana',rogue:'stealth',healer:'medicine'},
      sprenAppearances: {},

      purposes: ['Save Others','Seek Truth','Prove Your Worth','Find Connection','Seek Justice','Preserve Life'],
      obstacles: ['Haunted Past','Personal Grudge','Forbidden Knowledge','Crisis of Faith','Debt Owed'],
      gemstones: {copper:{chip:1,mark:10,broam:100},silver:{chip:1,mark:10,broam:100},gold:{chip:1,mark:10,broam:100}},

      locations: cfg.locations || ['The Capital','Northern Wastes','Eastern Forest','Western Mountains','Southern Coast','Ancient Ruins','Dark Caverns','Sacred Temple','Merchant Town','Border Fort','Enchanted Lake','Cursed Swamp','Desert Oasis','Frozen Tundra','Volcanic Peaks','Sunken City','Floating Isles','Shadow Realm'],
      offworldLocations: cfg.offworldLocations || ['Spirit Realm','Dream World','Elemental Plane','The Void'],
      shadesmarLocations: cfg.shadesmarLocations || ['The Underworld','Deep Caverns','Ancient Tunnels','Lost Mines','Forgotten Catacombs','Hidden Vaults'],
      legendaryLocations: cfg.legendaryLocations || ['The Final Dungeon','The Throne of Gods','The World Tree'],

      baseActs: [{num:1,tag:'Act I',start:0,end:59},{num:2,tag:'Act II',start:60,end:119},{num:3,tag:'Act III',start:120,end:179}],
      bladeTiers: ['Basic','Fine','Superior','Legendary','Mythic'],
      bladeNames: {warrior:'Champion\'s Blade',mage:'Arcane Staff',rogue:'Shadow Edge',healer:'Holy Relic'},

      orderOaths: {
        warrior:['I will fight.','I will protect.','I will endure.','I will conquer.','I am unstoppable.'],
        mage:['I seek knowledge.','I master the arcane.','I reshape reality.','I transcend limits.','I am magic itself.'],
        rogue:['I survive.','I adapt.','I overcome.','I outmaneuver.','I am the unseen.'],
        healer:['I preserve life.','I heal all wounds.','I cleanse corruption.','I restore balance.','I am life itself.'],
      },
      oathBonuses: {
        1:{desc:'First oath sworn',combat:0,heal:0},
        2:{desc:'Power awakens',combat:1,heal:0},
        3:{desc:'Abilities strengthen',combat:1,heal:1,ability:'Enhanced power'},
        4:{desc:'True potential emerges',combat:2,heal:2,ability:'Major ability'},
        5:{desc:'Mastery achieved',combat:3,heal:3,ability:'Ultimate power'},
      },
      advancement: {
        1:{attr:false,hpBase:true,maxSkill:2},
        2:{attr:false,hpGain:5,maxSkill:2},
        3:{attr:true,hpGain:5,maxSkill:2},
        4:{attr:false,hpGain:5,maxSkill:2},
        5:{attr:false,hpGain:5,maxSkill:2},
        6:{attr:true,hpGain:4,maxSkill:3},
        7:{attr:false,hpGain:4,maxSkill:3},
        8:{attr:false,hpGain:4,maxSkill:3},
        9:{attr:true,hpGain:4,maxSkill:3},
        10:{attr:false,hpGain:4,maxSkill:3},
      },
      orderIdeals: {
        warrior:{words:['fight','protect','strong','battle','warrior','blade','shield'],ideal:'I am the shield that never breaks'},
        mage:{words:['magic','arcane','spell','study','knowledge','power','learn'],ideal:'Knowledge is the ultimate power'},
        rogue:{words:['shadow','steal','sneak','hide','cunning','trick','quick'],ideal:'I am the unseen hand'},
        healer:{words:['heal','life','save','restore','purify','protect','mend'],ideal:'All life has value'},
      },

      hoidLines: [
        "A stranger catches your eye — mismatched clothes, knowing smile. They tip an invisible hat and vanish into a crowd that wasn't there a moment ago.",
        "You find a note tucked under a stone. It reads: 'You are asking the wrong questions.' No signature.",
        "A street performer plays one chord that somehow says everything about your situation, then leaves.",
        "Someone has written in the dust: LOOK CLOSER. The marks are too precise to be accidental.",
        "A child hands you something meaningless and says 'they said you'd need this eventually.'",
      ],

      weaponPrefixes: ['Iron','Shadow','Storm','Flame','Frost','Thunder','Silver','Crystal','Rune','Star'],
      weaponSuffixes: ['bane','strike','guard','fury','song','edge','fang','heart','caller','weaver'],

      // Enemy config — set by wizard checkboxes
      enemyCategories: enemies.categories || ['undead','beasts','goblinoids','humanEnemies'],
      enemyPools: enemies.pools || {
        default: [
          {name:'Bandit',type:'Humanoid',baseHP:8,dmg:3,attackBonus:2},
          {name:'Wolf',type:'Beast',baseHP:7,dmg:3,attackBonus:3},
          {name:'Skeleton',type:'Undead',baseHP:8,dmg:3,attackBonus:2},
          {name:'Goblin',type:'Goblinoid',baseHP:5,dmg:2,attackBonus:2},
        ],
      },
      enemyPatterns: [],
    };
  },
};
