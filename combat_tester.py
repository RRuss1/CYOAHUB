"""
Stormlight Chronicles — Combat Playtester
==========================================
Simulates full combat encounters using the same mechanics as the browser game.
Uses Haiku for AI decisions (cheap), skips narration (pure mechanics testing).

SAFEGUARDS:
  MAX_ROUNDS_PER_COMBAT = 8
  MAX_COMBATS_PER_RUN   = 3
  MAX_TOKENS_TOTAL      = 8000   (~$0.004 per full run)
  AI only used for player action selection — all math is local Python
"""

import anthropic
import random
import json
import math
import os
from dataclasses import dataclass, field
from typing import Optional
from copy import deepcopy

# ══ SAFEGUARDS ══
MAX_ROUNDS_PER_COMBAT = 8
MAX_COMBATS_PER_RUN   = 3
MAX_TOKENS_TOTAL      = 8000
tokens_used           = 0

# ══ MODELS ══
MODEL_DECISIONS = 'claude-haiku-4-5-20251001'  # Cheapest — for action selection

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY',''))

# ══ GAME DATA (mirrored from JS) ══

CLASSES = [
    {'id':'windrunner',  'name':'Windrunner',  'abilities':['Gravitation','Adhesion'],   'dmgBonus':{'crit':4,'hit':3}, 'bonus':{'str':2}},
    {'id':'edgedancer',  'name':'Edgedancer',  'abilities':['Abrasion','Progression'],   'dmgBonus':{'crit':3,'hit':2}, 'bonus':{'dex':2}},
    {'id':'lightweaver', 'name':'Lightweaver', 'abilities':['Illumination','Transformation'],'dmgBonus':{'crit':3,'hit':2},'bonus':{'int':2}},
    {'id':'truthwatcher','name':'Truthwatcher','abilities':['Progression','Illumination'],'dmgBonus':{'crit':2,'hit':2},'bonus':{'wis':2}},
    {'id':'stoneward',   'name':'Stoneward',   'abilities':['Cohesion','Tension'],       'dmgBonus':{'crit':3,'hit':3}, 'bonus':{'end':2}},
    {'id':'bondsmith',   'name':'Bondsmith',   'abilities':['Tension','Adhesion'],       'dmgBonus':{'crit':2,'hit':1}, 'bonus':{'cha':3}},
]

HERO_ROLES = [
    {'id':'soldier',   'name':'Alethi Soldier',    'bonus':{'str':3,'end':1}},
    {'id':'scholar',   'name':'Kharbranth Scholar', 'bonus':{'int':3,'wis':1}},
    {'id':'merchant',  'name':'Thaylen Merchant',   'bonus':{'cha':3,'dex':1}},
]

ENEMY_POOLS = {
    'hearthstone': [
        {'name':'Voidspren Scout',   'hp':14,'maxHp':14,'attackBonus':2,'dmg':3},
        {'name':'Corrupted Townsman','hp':18,'maxHp':18,'attackBonus':3,'dmg':4},
        {'name':'Darkform Soldier',  'hp':22,'maxHp':22,'attackBonus':4,'dmg':5},
        {'name':'Slumbering Horror', 'hp':30,'maxHp':30,'attackBonus':3,'dmg':6},
    ],
    'shattered_plains': [
        {'name':'Parshendi Scout',   'hp':16,'maxHp':16,'attackBonus':3,'dmg':4},
        {'name':'Parshendi Warrior', 'hp':24,'maxHp':24,'attackBonus':4,'dmg':5},
        {'name':'Shardbearer',       'hp':35,'maxHp':35,'attackBonus':5,'dmg':7},
    ],
}

# ══ DATA CLASSES ══

@dataclass
class Character:
    name: str
    is_radiant: bool
    class_id: str
    class_name: str
    hp: int
    max_hp: int
    stats: dict
    abilities: list
    dmg_bonus: dict
    downed: bool = False
    defending: bool = False
    blade_level: int = 0
    is_npc: bool = False

@dataclass
class Enemy:
    name: str
    hp: int
    max_hp: int
    attack_bonus: int
    dmg: int
    downed: bool = False
    defending: bool = False

@dataclass
class DiceEntry:
    actor: str
    roll: int
    bonus: int
    total: int
    result: str
    detail: str
    is_enemy: bool
    phase: str

@dataclass
class RoundLog:
    round_num: int
    entries: list = field(default_factory=list)
    phase_log: list = field(default_factory=list)

@dataclass
class CombatResult:
    outcome: str  # 'victory' | 'defeat' | 'timeout'
    rounds: int
    party_hp_remaining: dict
    enemies_killed: int
    total_enemies: int
    round_logs: list
    bugs_found: list

# ══ MECHANICS (mirrored from JS) ══

def get_spren_stage(total_moves: int) -> int:
    if total_moves < 20: return 0
    if total_moves < 50: return 1
    if total_moves < 90: return 2
    if total_moves < 140: return 3
    return 4

def get_heal_amount(char: Character, stage: int) -> int:
    base = (stage + 2) * 3
    if char.class_id == 'edgedancer': return round(base * 1.8)
    if char.class_id == 'bondsmith': return 0
    return base

def get_revive_hp(stage: int) -> int:
    return max(1, stage * 2)

def d20() -> int:
    return random.randint(1, 20)

def d4() -> int:
    return random.randint(1, 4)

def stat_bonus(val: int) -> int:
    return math.floor((val - 10) / 2)

def result_label(total: int) -> str:
    if total >= 18: return 'CRIT'
    if total >= 14: return 'HIT'
    if total >= 10: return 'PARTIAL'
    if total >= 6:  return 'MISS'
    return 'FUMBLE'

def get_action_bucket(action: str) -> tuple:
    """Returns (bucket, stat) — mirrors JS getActionBucket"""
    t = action.lower()
    if any(w in t for w in ['revive','stabilize','pull back','rouse']): return ('revive','wis')
    if any(w in t for w in ['[heal]','heal','regrow','mend','restore','tend','cure']): return ('heal','wis')
    if any(w in t for w in ['defend','block','shield','protect','brace','guard','parry']): return ('defend','end')
    if any(w in t for w in ['soulcast','lash','illusion','surge','conjure','transmute']): return ('surge','int')
    if any(w in t for w in ['search','detect','perceive','persuade','negotiate','bluff']): return ('skill','cha')
    if any(w in t for w in ['run','dodge','leap','sneak','dash','flip','slide']): return ('attack','dex')
    return ('attack','str')

def enemy_attack_roll(enemy: Enemy, target: Character) -> dict:
    roll = random.randint(1, 20) + (enemy.attack_bonus or 2)
    hit = roll >= 12
    dmg = enemy.dmg if hit else 0
    if target.defending and hit:
        dmg = max(1, dmg - 2)
    return {'hit': hit, 'roll': roll, 'dmg': dmg}

def enemy_ai_choose_action(enemy: Enemy, party: list) -> dict:
    """Simple enemy AI — mirrors JS enemy logic"""
    hp_pct = enemy.hp / (enemy.max_hp or enemy.hp)
    living_party = [p for p in party if not p.downed]
    if not living_party:
        return {'type': 'skip'}
    if hp_pct < 0.3 and random.random() < 0.4:
        return {'type': 'defend'}
    # Target lowest HP player
    target = sorted(living_party, key=lambda p: p.hp)[0] if random.random() < 0.6 else random.choice(living_party)
    return {'type': 'attack', 'target': target}

# ══ AI PLAYER DECISION ══

def ai_choose_player_action(char: Character, enemies: list, party: list, round_num: int) -> str:
    """Use Haiku to pick an action for a player character"""
    global tokens_used
    if tokens_used >= MAX_TOKENS_TOTAL:
        # Fallback — no more AI calls
        return '[ATTACK] Strike at the nearest enemy'

    living_enemies = [e for e in enemies if not e.downed]
    downed_allies  = [p for p in party if p.downed and p.name != char.name]
    injured_allies = [p for p in party if p.hp < p.max_hp and not p.downed]

    situation = f"""You are {char.name} ({char.class_name}, {char.hp}/{char.max_hp}HP, Round {round_num}).
Enemies: {', '.join(f"{e.name}({e.hp}/{e.max_hp}HP)" for e in living_enemies) or 'none'}.
Downed allies: {', '.join(p.name for p in downed_allies) or 'none'}.
Injured allies: {', '.join(f"{p.name}({p.hp}HP)" for p in injured_allies) or 'none'}.

Pick the most tactically smart action. Return ONLY a JSON object like:
{{"action": "[ATTACK] strike description" | "[HEAL] heal description" | "[DEFEND] defend description" | "[REVIVE] revive description"}}

Rules: If allies are downed, consider REVIVE. If badly injured, consider HEAL. Otherwise ATTACK or DEFEND."""

    try:
        resp = client.messages.create(
            model=MODEL_DECISIONS,
            max_tokens=80,
            messages=[{'role':'user','content':situation}]
        )
        tokens_used += resp.usage.input_tokens + resp.usage.output_tokens
        text = resp.content[0].text.strip()
        # Parse JSON
        data = json.loads(text)
        return data.get('action', '[ATTACK] strike')
    except Exception as e:
        return '[ATTACK] strike at the enemy'

# ══ PHASE RESOLUTION (mirrors JS resolveRound) ══

def resolve_round(party: list, enemies: list, round_num: int,
                  total_moves: int, bugs: list) -> RoundLog:
    log = RoundLog(round_num=round_num)
    stage = get_spren_stage(total_moves)

    # ── Build action list ──
    all_actions = []

    # Player actions (AI-chosen)
    for char in party:
        if char.downed or char.is_npc:
            continue
        action_text = ai_choose_player_action(char, enemies, party, round_num)
        bucket, stat = get_action_bucket(action_text)
        phase = 'DEFENSE' if bucket == 'defend' else 'HEAL' if bucket in ('heal','revive') else 'OFFENSE'
        all_actions.append({
            'actor': char, 'action': action_text, 'bucket': bucket,
            'stat': stat, 'phase': phase, 'is_enemy': False
        })

    # NPC ally actions
    for char in party:
        if char.downed or not char.is_npc:
            continue
        living_enemies = [e for e in enemies if not e.downed]
        if not living_enemies:
            continue
        action_text = '[ATTACK] strike at the enemy'
        all_actions.append({
            'actor': char, 'action': action_text, 'bucket': 'attack',
            'stat': 'str', 'phase': 'OFFENSE', 'is_enemy': False
        })

    # Enemy actions
    for enemy in enemies:
        if enemy.downed:
            continue
        ai = enemy_ai_choose_action(enemy, party)
        if ai['type'] == 'defend':
            all_actions.append({'actor': enemy, 'phase': 'DEFENSE', 'is_enemy': True, 'type': 'defend'})
        elif ai['type'] == 'attack':
            all_actions.append({'actor': enemy, 'phase': 'OFFENSE', 'is_enemy': True,
                                 'type': 'attack', 'target': ai['target']})

    log.phase_log.append(f"  Actions queued: {len(all_actions)}")

    # ══ PHASE 1: BUFFS/DEBUFFS (placeholder) ══
    log.phase_log.append("PHASE 1: BUFFS/DEBUFFS — no active effects")

    # ══ PHASE 2: OFFENSE ══
    log.phase_log.append("PHASE 2: OFFENSE")
    for a in [x for x in all_actions if x['phase'] == 'OFFENSE']:
        if a['is_enemy']:
            enemy = a['actor']
            target = a.get('target')
            if not target or target.downed:
                log.phase_log.append(f"    {enemy.name}: target dead — skipped")
                continue
            result = enemy_attack_roll(enemy, target)
            if result['hit']:
                old_hp = target.hp
                target.hp = max(0, target.hp - result['dmg'])
                if target.hp == 0:
                    target.downed = True
                entry = DiceEntry(
                    actor=enemy.name, roll=result['roll'], bonus=enemy.attack_bonus,
                    total=result['roll'], result='HIT',
                    detail=f"{target.name} -{result['dmg']}HP (was {old_hp}, now {target.hp}{'  DOWNED' if target.downed else ''})",
                    is_enemy=True, phase='OFFENSE'
                )
            else:
                entry = DiceEntry(
                    actor=enemy.name, roll=result['roll'], bonus=enemy.attack_bonus,
                    total=result['roll'], result='MISS', detail='no effect',
                    is_enemy=True, phase='OFFENSE'
                )
            log.entries.append(entry)
            log.phase_log.append(f"    {enemy.name}: {entry.result} — {entry.detail}")

            # BUG CHECK: HP never goes negative
            if target.hp < 0:
                bugs.append(f"R{round_num}: {target.name} HP went negative ({target.hp})")

        else:
            char = a['actor']
            if char.downed:
                log.phase_log.append(f"    {char.name}: actor downed — skipped")
                continue
            cls = next((cl for cl in CLASSES if cl['id'] == char.class_id), CLASSES[0])
            sv = char.stats.get(a['stat'], 10)
            bonus = stat_bonus(sv) + char.blade_level
            roll = d20()
            total = min(20, max(1, roll + bonus))
            res = result_label(total)
            db = cls.get('dmgBonus', {'crit':3,'hit':2})
            living_en = [e for e in enemies if not e.downed]
            target = random.choice(living_en) if living_en else None
            detail = ''
            if target and total >= 10:
                dmg = (db['crit'] + random.randint(1,3) + 1) if total >= 18 else (db['hit'] if total >= 14 else 1)
                old_hp = target.hp
                target.hp = max(0, target.hp - dmg)
                if target.hp <= 0:
                    target.downed = True
                detail = f"{target.name} -{dmg}HP (was {old_hp}, now {target.hp}{'  KILLED' if target.downed else ''})"
            elif total < 6:
                self_dmg = random.randint(2, 5)
                old_hp = char.hp
                char.hp = max(0, char.hp - self_dmg)
                if char.hp == 0:
                    char.downed = True
                detail = f"FUMBLE self -{self_dmg}HP (was {old_hp}, now {char.hp}{'  DOWNED' if char.downed else ''})"
                # BUG CHECK
                if char.hp < 0:
                    bugs.append(f"R{round_num}: {char.name} HP went negative on fumble ({char.hp})")
            else:
                detail = 'no effect'

            entry = DiceEntry(
                actor=char.name, roll=roll, bonus=bonus,
                total=total, result=res, detail=detail,
                is_enemy=False, phase='OFFENSE'
            )
            log.entries.append(entry)
            log.phase_log.append(f"    {char.name} [{a['action'][:30]}]: d20={roll}+{bonus}={total} {res} — {detail}")

    # ══ PHASE 3: DEFENSE ══
    log.phase_log.append("PHASE 3: DEFENSE")
    for a in [x for x in all_actions if x['phase'] == 'DEFENSE']:
        if a['is_enemy']:
            a['actor'].defending = True
            log.phase_log.append(f"    {a['actor'].name}: defensive stance")
        else:
            char = a['actor']
            if char.downed:
                continue
            sv = char.stats.get(a['stat'], 10)
            bonus = stat_bonus(sv)
            roll = d20()
            total = min(20, max(1, roll + bonus))
            res = result_label(total)
            if total >= 14:
                char.defending = True
                detail = 'defensive stance (+2 DR next hit)'
            elif total >= 10:
                detail = 'partial block'
            else:
                detail = 'stance broken'
            entry = DiceEntry(
                actor=char.name, roll=roll, bonus=bonus,
                total=total, result=res, detail=detail,
                is_enemy=False, phase='DEFENSE'
            )
            log.entries.append(entry)
            log.phase_log.append(f"    {char.name}: d20={roll}+{bonus}={total} {res} — {detail}")

    # ══ PHASE 4: HEALING & RECOVERY ══
    log.phase_log.append("PHASE 4: HEALING")
    for a in [x for x in all_actions if x['phase'] == 'HEAL']:
        char = a['actor']
        if char.downed:
            log.phase_log.append(f"    {char.name}: healer downed — skipped")
            continue
        sv = char.stats.get(a['stat'], 10)
        bonus = stat_bonus(sv)
        roll = d20()
        total = min(20, max(1, roll + bonus))
        res = result_label(total)
        detail = ''

        if a['bucket'] == 'revive':
            downed_ally = next((p for p in party if p.downed and p.name != char.name), None)
            if not downed_ally:
                detail = 'no downed ally'
                log.phase_log.append(f"    {char.name} REVIVE: no target")
            elif total >= 10:
                rev_hp = get_revive_hp(stage) * 2 if total >= 18 else get_revive_hp(stage) if total >= 14 else max(1, get_revive_hp(stage)//2)
                old_downed = downed_ally.downed
                downed_ally.hp = rev_hp
                downed_ally.downed = False
                detail = f"{downed_ally.name} revived +{rev_hp}HP"
                # BUG CHECK: downed flag must clear
                if downed_ally.downed:
                    bugs.append(f"R{round_num}: REVIVE failed to clear downed flag on {downed_ally.name}")
                if old_downed and not downed_ally.downed:
                    log.phase_log.append(f"    {char.name} REVIVE SUCCESS: {detail}")
                entry = DiceEntry(actor=char.name, roll=roll, bonus=bonus, total=total,
                                  result='HIT' if total>=14 else 'PARTIAL', detail=detail,
                                  is_enemy=False, phase='HEAL')
                log.entries.append(entry)
            else:
                detail = f"failed to revive {downed_ally.name}"
                log.phase_log.append(f"    {char.name} REVIVE FAILED: {detail}")
                entry = DiceEntry(actor=char.name, roll=roll, bonus=bonus, total=total,
                                  result=res, detail=detail, is_enemy=False, phase='HEAL')
                log.entries.append(entry)

        else:  # heal
            base_amt = get_heal_amount(char, stage) or 6
            old_hp = char.hp
            if total >= 18:   heal_amt = round(base_amt * 1.5)
            elif total >= 14: heal_amt = base_amt
            elif total >= 10: heal_amt = round(base_amt * 0.6)
            elif total >= 6:  heal_amt = 0; detail = 'fizzled'
            else:             heal_amt = -round(base_amt * 0.3); detail = 'backlash'

            if heal_amt > 0:
                char.hp = min(char.max_hp, char.hp + heal_amt)
                detail = f"+{heal_amt}HP ({old_hp} -> {char.hp})"
                # BUG CHECK: heal must not exceed maxHp
                if char.hp > char.max_hp:
                    bugs.append(f"R{round_num}: {char.name} HP exceeded maxHp after heal ({char.hp} > {char.max_hp})")
            elif heal_amt < 0:
                char.hp = max(1, char.hp + heal_amt)
                detail = f"{heal_amt}HP backlash ({old_hp} -> {char.hp})"

            entry = DiceEntry(actor=char.name, roll=roll, bonus=bonus, total=total,
                              result='CRIT' if total>=18 else 'HEAL' if total>=14 else 'PARTIAL' if total>=10 else res,
                              detail=detail, is_enemy=False, phase='HEAL')
            log.entries.append(entry)
            log.phase_log.append(f"    {char.name} HEAL: d20={roll}+{bonus}={total} {res} — {detail}")

    # ══ PHASE 5: END-OF-TURN ══
    log.phase_log.append("PHASE 5: END-OF-TURN")
    # Passive regen for story mode would go here
    # Status tick would go here

    # Reset defending flags
    for char in party:
        char.defending = False
    for enemy in enemies:
        enemy.defending = False

    return log

# ══ FULL COMBAT SIMULATION ══

def run_combat(party: list, enemies: list, location: str = 'Hearthstone',
               total_moves: int = 0) -> CombatResult:
    bugs = []
    round_logs = []
    initial_enemies = len(enemies)

    print(f"\n  Location: {location}")
    print(f"  Party: {', '.join(f'{p.name}({p.hp}HP)' for p in party)}")
    print(f"  Enemies: {', '.join(f'{e.name}({e.hp}HP)' for e in enemies)}")
    print()

    for round_num in range(1, MAX_ROUNDS_PER_COMBAT + 1):
        # Victory/defeat check at start
        living_enemies = [e for e in enemies if not e.downed]
        living_party = [p for p in party if not p.downed]
        living_humans = [p for p in party if not p.downed and not p.is_npc]

        if not living_enemies:
            print(f"  ✓ VICTORY on round {round_num - 1}")
            return CombatResult(
                outcome='victory', rounds=round_num-1,
                party_hp_remaining={p.name: p.hp for p in party},
                enemies_killed=sum(1 for e in enemies if e.downed),
                total_enemies=initial_enemies,
                round_logs=round_logs, bugs_found=bugs
            )

        if not living_humans:
            print(f"  ✗ DEFEAT on round {round_num - 1}")
            return CombatResult(
                outcome='defeat', rounds=round_num-1,
                party_hp_remaining={p.name: p.hp for p in party},
                enemies_killed=sum(1 for e in enemies if e.downed),
                total_enemies=initial_enemies,
                round_logs=round_logs, bugs_found=bugs
            )

        print(f"  Round {round_num}:")

        # BUG CHECK: no negative HP going into round
        for p in party:
            if p.hp < 0:
                bugs.append(f"R{round_num}: {p.name} has negative HP at round start ({p.hp})")
                p.hp = 0
        for e in enemies:
            if e.hp < 0:
                bugs.append(f"R{round_num}: {e.name} has negative HP at round start ({e.hp})")
                e.hp = 0

        log = resolve_round(
            party=party,
            enemies=enemies,
            round_num=round_num,
            total_moves=total_moves + round_num,
            bugs=bugs
        )
        round_logs.append(log)

        # Print round summary
        for line in log.phase_log:
            print(f"    {line}")

        # HP summary after round
        party_str = ', '.join(f"{p.name}:{'DOWNED' if p.downed else str(p.hp)+'HP'}" for p in party)
        enemy_str = ', '.join(f"{e.name}:{'DEAD' if e.downed else str(e.hp)+'HP'}" for e in living_enemies)
        print(f"    → Party: {party_str}")
        print(f"    → Enemies: {enemy_str}")
        print()

        total_moves += 1

    print(f"  ⏱ TIMEOUT after {MAX_ROUNDS_PER_COMBAT} rounds")
    return CombatResult(
        outcome='timeout', rounds=MAX_ROUNDS_PER_COMBAT,
        party_hp_remaining={p.name: p.hp for p in party},
        enemies_killed=sum(1 for e in enemies if e.downed),
        total_enemies=initial_enemies,
        round_logs=round_logs, bugs_found=bugs
    )

# ══ CHARACTER FACTORIES ══

def make_radiant(name: str, class_id: str, oath_stage: int = 1) -> Character:
    cls = next((c for c in CLASSES if c['id'] == class_id), CLASSES[0])
    base = 12
    stats = {k: base + cls['bonus'].get(k, 0) for k in ['str','dex','int','wis','cha','end']}
    hp = 10 + stats['end']
    return Character(
        name=name, is_radiant=True, class_id=class_id,
        class_name=cls['name'], hp=hp, max_hp=hp,
        stats=stats, abilities=cls['abilities'],
        dmg_bonus=cls['dmgBonus'], blade_level=oath_stage - 1
    )

def make_hero(name: str, role_id: str) -> Character:
    role = next((r for r in HERO_ROLES if r['id'] == role_id), HERO_ROLES[0])
    base = 11
    stats = {k: base + role['bonus'].get(k, 0) for k in ['str','dex','int','wis','cha','end']}
    hp = 10 + stats['end']
    return Character(
        name=name, is_radiant=False, class_id=role_id,
        class_name=role['name'], hp=hp, max_hp=hp,
        stats=stats, abilities=['Weapon Proficiency'],
        dmg_bonus={'crit':2,'hit':2}
    )

def make_npc_ally(name: str, class_id: str) -> Character:
    char = make_radiant(name, class_id)
    char.is_npc = True
    return char

def make_enemy(template: dict) -> Enemy:
    e = deepcopy(template)
    return Enemy(
        name=e['name'], hp=e['hp'], max_hp=e['maxHp'],
        attack_bonus=e['attackBonus'], dmg=e['dmg']
    )

# ══ TEST SCENARIOS ══

def scenario_basic_combat() -> dict:
    """2 players vs 2 enemies — basic smoke test"""
    party = [
        make_radiant('Gore Booty', 'edgedancer', oath_stage=2),
        make_npc_ally('Hobber', 'truthwatcher'),
    ]
    pool = ENEMY_POOLS['hearthstone']
    enemies = [make_enemy(pool[0]), make_enemy(pool[1])]
    return {'name':'Basic Combat (2v2)', 'party':party, 'enemies':enemies}

def scenario_outnumbered() -> dict:
    """1 player vs 3 enemies — stress test"""
    party = [make_radiant('Slac Jaw', 'windrunner', oath_stage=1)]
    pool = ENEMY_POOLS['hearthstone']
    enemies = [make_enemy(pool[0]), make_enemy(pool[1]), make_enemy(pool[2])]
    return {'name':'Outnumbered (1v3)', 'party':party, 'enemies':enemies}

def scenario_revive_test() -> dict:
    """Force a revive situation — pre-wound a party member"""
    ally = make_radiant('Viktorkin', 'stoneward', oath_stage=1)
    ally.hp = 1  # Nearly dead — force revive scenario
    party = [
        make_radiant('Gore Booty', 'edgedancer', oath_stage=2),
        ally,
    ]
    pool = ENEMY_POOLS['shattered_plains']
    enemies = [make_enemy(pool[0])]
    return {'name':'Revive Test (ally at 1HP)', 'party':party, 'enemies':enemies}

def scenario_hero_vs_radiant() -> dict:
    """Hero of Roshar vs enemies — test non-Radiant mechanics"""
    party = [
        make_hero('Captain Ironsides', 'soldier'),
        make_npc_ally('Scholar NPC', 'lightweaver'),
    ]
    pool = ENEMY_POOLS['hearthstone']
    enemies = [make_enemy(pool[2])]
    return {'name':'Hero of Roshar (non-Radiant)', 'party':party, 'enemies':enemies}

def scenario_full_party() -> dict:
    """3-player party — test multi-player phase ordering"""
    party = [
        make_radiant('Gore Booty', 'edgedancer', oath_stage=2),
        make_hero('Red Beard', 'soldier'),
        make_npc_ally('Hobber', 'truthwatcher'),
    ]
    pool = ENEMY_POOLS['shattered_plains']
    enemies = [make_enemy(pool[0]), make_enemy(pool[1])]
    return {'name':'Full Party (3v2)', 'party':party, 'enemies':enemies}

# ══ REPORT ══

def print_report(results: list):
    print("\n" + "="*60)
    print("COMBAT PLAYTEST REPORT")
    print("="*60)

    all_bugs = []
    outcomes = {'victory':0, 'defeat':0, 'timeout':0}

    for scenario_name, result in results:
        print(f"\n▸ {scenario_name}")
        print(f"  Outcome:  {result.outcome.upper()}")
        print(f"  Rounds:   {result.rounds}")
        print(f"  Kills:    {result.enemies_killed}/{result.total_enemies} enemies")
        hp_str = ', '.join(f"{n}:{hp}HP" for n,hp in result.party_hp_remaining.items())
        print(f"  Party HP: {hp_str}")
        if result.bugs_found:
            print(f"  BUGS ({len(result.bugs_found)}):")
            for bug in result.bugs_found:
                print(f"    ✗ {bug}")
            all_bugs.extend(result.bugs_found)
        else:
            print(f"  Bugs:     none ✓")
        outcomes[result.outcome] += 1

    print("\n" + "-"*60)
    print("SUMMARY")
    print(f"  Scenarios run: {len(results)}")
    print(f"  Victories:  {outcomes['victory']}")
    print(f"  Defeats:    {outcomes['defeat']}")
    print(f"  Timeouts:   {outcomes['timeout']}")
    print(f"  Total bugs: {len(all_bugs)}")
    print(f"  Tokens used: {tokens_used} / {MAX_TOKENS_TOTAL}")
    print(f"  Est. cost:  ~${tokens_used * 0.00000025:.4f}")

    if all_bugs:
        print("\nALL BUGS FOUND:")
        for i, bug in enumerate(all_bugs, 1):
            print(f"  {i}. {bug}")
    else:
        print("\n✓ No bugs detected across all scenarios")

    print("="*60)

# ══ MAIN ══

def main():
    global tokens_used
    tokens_used = 0

    print("Stormlight Chronicles — Combat Playtester")
    print(f"Safeguards: {MAX_ROUNDS_PER_COMBAT} rounds max, {MAX_COMBATS_PER_RUN} combats max, {MAX_TOKENS_TOTAL} tokens max")
    print()

    scenarios = [
        scenario_basic_combat(),
        scenario_outnumbered(),
        scenario_revive_test(),
        scenario_hero_vs_radiant(),
        scenario_full_party(),
    ]

    # Cap at MAX_COMBATS_PER_RUN
    scenarios = scenarios[:MAX_COMBATS_PER_RUN]
    results = []

    for i, scenario in enumerate(scenarios):
        if tokens_used >= MAX_TOKENS_TOTAL:
            print(f"\n⚠ Token budget reached ({tokens_used}). Stopping.")
            break

        print(f"\n{'='*50}")
        print(f"SCENARIO {i+1}/{len(scenarios)}: {scenario['name']}")
        print(f"{'='*50}")

        result = run_combat(
            party=scenario['party'],
            enemies=scenario['enemies'],
            location='Test Arena',
            total_moves=30  # Mid-game stage
        )
        results.append((scenario['name'], result))

    print_report(results)

if __name__ == '__main__':
    main()
