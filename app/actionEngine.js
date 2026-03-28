/**
 * ============================================================
 * app/actionEngine.js — Universal Action Resolution Engine
 * CYOAhub
 * ============================================================
 * Resolves ALL game actions (combat, story, exploration) from
 * config definitions. Replaces hardcoded regex-based action
 * detection with config-driven keyword matching.
 *
 * Loaded AFTER configResolver.js, BEFORE ui.js.
 *
 * Every action in config defines:
 *   id, tag, label, icon, cost, phase, stat, skill, keywords, effects, conditions
 *
 * Usage:
 *   ActionEngine.resolve("[ATTACK] I swing my sword at the goblin", systemData)
 *   // => { actionDef: {...}, bucket: 'attack', stat: 'str', skill: 'heavyWeapon', tag: 'ATTACK' }
 *
 *   ActionEngine.execute(actionDef, actor, target, context)
 *   // => { success: true, effects: [...], narrative: '...' }
 * ============================================================
 */

(function() {
  'use strict';

  function _SD() { return window.SystemData || {}; }

  // ═══════════════════════════════════════════════════════════
  // 1. RESOLVE — Determine which action config matches input text
  // ═══════════════════════════════════════════════════════════

  /**
   * Resolve action text to a config-defined action.
   * @param {string} actionText — player's chosen action text
   * @param {object} systemData — optional override (defaults to window.SystemData)
   * @returns {object} { actionDef, bucket, stat, skill, tag, phase }
   */
  function resolve(actionText, systemData) {
    const sys = systemData || _SD();
    const text = (actionText || '').toLowerCase();
    const combatActions = sys.combatActions || [];
    const storyActions = sys.storyActions || [];
    const allActions = [...combatActions, ...storyActions];

    // 1. Check explicit [TAG] prefix
    const tagMatch = text.match(/^\[([A-Z_]+)\]/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const found = allActions.find(a => a.tag === tag);
      if (found) {
        return _buildResult(found, text);
      }
    }

    // 2. Match keywords from config
    for (const action of allActions) {
      if (action.keywords && Array.isArray(action.keywords)) {
        for (const kw of action.keywords) {
          if (typeof kw === 'string' && text.includes(kw.toLowerCase())) {
            return _buildResult(action, text);
          }
          if (kw instanceof RegExp && kw.test(text)) {
            return _buildResult(action, text);
          }
        }
      }
    }

    // 3. Fallback: detect heal/rest patterns (universal)
    if (/\[heal\]|heal|mend|restore|bandage|cure|medicine|patch.*wound/.test(text)) {
      const healAction = combatActions.find(a => a.id === 'heal') || { id: 'heal', tag: 'HEAL', label: 'Heal' };
      return _buildResult(healAction, text);
    }
    if (/\[rest\]|short rest|take a rest|rest and recover|catch.*breath/.test(text)) {
      return { actionDef: { id: 'rest', tag: 'REST', label: 'Rest' }, bucket: 'heal', stat: _getFirstStat('wil'), skill: 'medicine', tag: 'REST', phase: 'HEAL', restAction: true };
    }

    // 4. Fallback: detect attack patterns
    if (/\[attack\]|attack|strike|slash|hit|stab|shoot|swing|punch|kick/.test(text)) {
      const atkAction = combatActions.find(a => a.id === 'attack') || { id: 'attack', tag: 'ATTACK', label: 'Attack' };
      return _buildResult(atkAction, text);
    }

    // 5. Fallback: detect defend patterns
    if (/\[defend\]|defend|block|dodge|evade|shield|parry|protect/.test(text)) {
      const defAction = combatActions.find(a => a.id === 'defend') || { id: 'defend', tag: 'DEFEND', label: 'Defend' };
      return _buildResult(defAction, text);
    }

    // 6. Detect surge/ability/magic from system surges
    const surges = _SD().surges || [];
    for (const surge of surges) {
      if (text.includes(surge.name.toLowerCase()) || text.includes(surge.id.toLowerCase())) {
        const surgeAction = combatActions.find(a => a.id === 'surge' || a.id === 'magic' || a.id === 'corruption') || { id: 'surge', tag: 'SURGE' };
        return { actionDef: surgeAction, bucket: 'surge', stat: surge.attr || _getFirstStat('int'), skill: surge.id, tag: surgeAction.tag || 'SURGE', phase: surgeAction.phase || 'OFFENSE' };
      }
    }

    // 7. Skill-based detection from skillAttrMap
    const skillMap = window.ConfigResolver ? window.ConfigResolver.getSkillAttrMap() : {};
    for (const [skillId, attrKey] of Object.entries(skillMap)) {
      if (text.includes(skillId.toLowerCase())) {
        return { actionDef: { id: 'skill', tag: 'SKILL', label: 'Skill Check' }, bucket: 'skill', stat: attrKey, skill: skillId, tag: 'SKILL', phase: 'OFFENSE' };
      }
    }

    // 8. Default — generic action
    const defaultAction = combatActions[0] || { id: 'action', tag: 'ACTION', label: 'Act' };
    return _buildResult(defaultAction, text);
  }

  function _buildResult(actionDef, text) {
    const bucket = actionDef.id || 'action';
    return {
      actionDef,
      bucket,
      stat: actionDef.stat || _inferStat(bucket),
      skill: actionDef.skill || _inferSkill(bucket),
      tag: actionDef.tag || 'ACTION',
      phase: actionDef.phase || _inferPhase(bucket),
      restAction: /rest|recover|catch.*breath/.test(text),
    };
  }

  function _getFirstStat(fallback) {
    const keys = (_SD().statKeys || []);
    return keys[0] || fallback || 'str';
  }

  function _inferStat(bucket) {
    const map = { attack: 'str', defend: 'spd', heal: 'wil', surge: 'int', magic: 'int', skill: 'int' };
    const keys = _SD().statKeys || [];
    return keys.length > 0 ? (keys[0]) : (map[bucket] || 'str');
  }

  function _inferSkill(bucket) {
    const map = { attack: 'heavyWeapon', defend: 'agility', heal: 'medicine', surge: null, skill: 'perception' };
    return map[bucket] || 'athletics';
  }

  function _inferPhase(bucket) {
    const map = { attack: 'OFFENSE', defend: 'DEFENSE', heal: 'HEAL', surge: 'OFFENSE', magic: 'OFFENSE', corruption: 'OFFENSE', skill: 'OFFENSE' };
    return map[bucket] || 'OFFENSE';
  }

  // ═══════════════════════════════════════════════════════════
  // 2. EXECUTE — Apply action effects from config
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute an action, applying costs, conditions, and effects.
   * @param {object} actionDef — from resolve() result
   * @param {object} actor — the acting character
   * @param {object} target — the target (enemy or ally)
   * @param {object} context — { gState, round, ... }
   * @returns {object} { success, effects: [], costs: [], narrative }
   */
  function execute(actionDef, actor, target, context) {
    const result = { success: true, effects: [], costs: [], narrative: '' };

    if (!actionDef) {
      result.success = false;
      result.narrative = 'No action defined.';
      return result;
    }

    // ── Check conditions ──
    if (actionDef.conditions && window.ConfigResolver) {
      const conds = Array.isArray(actionDef.conditions) ? actionDef.conditions : [actionDef.conditions];
      for (const cond of conds) {
        if (!window.ConfigResolver.evaluateCondition(cond, { character: actor, gState: context && context.gState })) {
          result.success = false;
          result.narrative = 'Conditions not met for ' + (actionDef.label || actionDef.id) + '.';
          return result;
        }
      }
    }

    // ── Apply costs ──
    if (actionDef.cost) {
      const costParts = actionDef.cost.split(':');
      const resource = costParts[0];
      const amount = parseInt(costParts[1]) || 1;

      if (resource === 'magicPool' || resource === 'investiture') {
        if ((actor.investiture || 0) < amount) {
          const label = window.ConfigResolver ? window.ConfigResolver.getMagicPoolLabel() : 'magic';
          result.success = false;
          result.narrative = `Not enough ${label} (need ${amount}).`;
          return result;
        }
        actor.investiture = (actor.investiture || 0) - amount;
        result.costs.push({ resource, amount });
      } else if (resource === 'focus') {
        if ((actor.focus || 0) < amount) {
          result.success = false;
          result.narrative = 'Not enough Focus.';
          return result;
        }
        actor.focus = (actor.focus || 0) - amount;
        result.costs.push({ resource, amount });
      } else if (resource === 'hp') {
        actor.hp = Math.max(0, (actor.hp || 0) - amount);
        result.costs.push({ resource, amount });
      }
    }

    // ── Apply effects ──
    if (actionDef.effects && Array.isArray(actionDef.effects)) {
      for (const effect of actionDef.effects) {
        const effectResult = _applyEffect(effect, actor, target, context);
        result.effects.push(effectResult);
      }
    }

    return result;
  }

  function _applyEffect(effect, actor, target, context) {
    if (!effect || !effect.type) return { type: 'none' };

    switch (effect.type) {
      case 'damage': {
        const formula = effect.formula || 'weapon';
        let dmg = 0;
        if (formula === 'weapon') {
          const weapon = actor.weapons && actor.weapons[0];
          dmg = weapon ? (window.Rules ? window.Rules.parseDice(weapon.dmg) : Math.ceil(Math.random() * 6)) : Math.ceil(Math.random() * 4);
        } else if (window.FormulaEngine && window.FormulaEngine.isFormula(formula)) {
          dmg = window.FormulaEngine.evaluate(formula, { ...actor.stats, level: actor.level || 1 });
        } else {
          dmg = parseInt(formula) || 3;
        }
        if (target) target.hp = Math.max(0, (target.hp || 0) - dmg);
        return { type: 'damage', amount: dmg, target: target ? target.name : 'unknown' };
      }

      case 'heal': {
        const amount = effect.amount || 5;
        const healTarget = effect.target === 'self' ? actor : target || actor;
        healTarget.hp = Math.min(healTarget.maxHp || 10, (healTarget.hp || 0) + amount);
        return { type: 'heal', amount, target: healTarget.name };
      }

      case 'buff': {
        const buffTarget = effect.target === 'self' ? actor : target || actor;
        if (!buffTarget.conditions) buffTarget.conditions = {};
        buffTarget.conditions[effect.condition] = effect.value || true;
        return { type: 'buff', condition: effect.condition, target: buffTarget.name };
      }

      case 'debuff': {
        if (target) {
          if (!target.conditions) target.conditions = {};
          target.conditions[effect.condition] = effect.value || true;
        }
        return { type: 'debuff', condition: effect.condition, target: target ? target.name : 'unknown' };
      }

      default:
        return { type: effect.type };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 3. HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Get all available actions for the current combat state.
   */
  function getAvailableActions(actor, context) {
    const sys = _SD();
    const actions = sys.combatActions || [];
    return actions.filter(action => {
      if (!action.conditions) return true;
      if (!window.ConfigResolver) return true;
      const conds = Array.isArray(action.conditions) ? action.conditions : [action.conditions];
      return conds.every(c => window.ConfigResolver.evaluateCondition(c, { character: actor, gState: context }));
    });
  }

  /**
   * Get the action tags string for GM prompts.
   */
  function getActionTagsString() {
    const sys = _SD();
    return (sys.combatActions || []).map(a => '[' + a.tag + ']').join(', ');
  }

  window.ActionEngine = { resolve, execute, getAvailableActions, getActionTagsString };

})();
