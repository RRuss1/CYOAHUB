/**
 * ============================================================
 * app/configValidator.js — World Config Schema Validation
 * CYOAhub
 * ============================================================
 * Validates any worldConfig against the required schema.
 * Reports missing fields, type mismatches, and broken refs.
 * Auto-repairs with safe defaults to prevent runtime crashes.
 *
 * Loaded AFTER configDefaults.js, BEFORE configResolver.js.
 * ============================================================
 */

(function () {
  'use strict';

  // ── Schema Definition ──────────────────────────────────────
  // Each leaf: { type, required?, min?, max?, values?, itemShape? }
  const SCHEMA = {
    // Identity
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    subtitle: { type: 'string' },
    tagline: { type: 'string' },
    glyph: { type: 'string' },

    // Theme
    theme: {
      _type: 'object',
      required: true,
      primary: { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/ },
      secondary: { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/ },
      danger: { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/ },
      bgTone: { type: 'string', values: ['dark', 'light'] },
      titleFont: { type: 'string' },
      bodyFont: { type: 'string' },
    },

    // Stats
    statKeys: { type: 'array', required: true, minLength: 2 },
    statNames: { type: 'array', required: true, minLength: 2 },
    statFull: { type: 'array', required: true, minLength: 2 },

    // Rules
    rules: {
      _type: 'object',
      required: true,
      defenses: { type: 'array', required: true, minLength: 1 },
      hp: { _type: 'object', required: true, base: { type: 'number' }, stat: { type: 'string' } },
      focus: { _type: 'object', base: { type: 'number' }, stat: { type: 'string' } },
      magicPool: { _type: 'object', enabled: { type: 'boolean' }, label: { type: 'string' } },
      recoveryDie: { _type: 'object', stat: { type: 'string' }, table: { type: 'array' } },
      skillAttrMap: { type: 'object' },
      currency: { _type: 'object', name: { type: 'string' }, symbol: { type: 'string' } },
      progressionType: { type: 'string', values: ['oaths', 'levels', 'corruption', 'milestones'] },
      turnOrder: { type: 'string', values: ['fast-slow', 'initiative', 'round-robin'] },
      equipmentDrops: { _type: 'object', legendaryName: { type: 'string' }, armorName: { type: 'string' } },
    },

    // Character Creation
    charCreation: {
      _type: 'object',
      required: true,
      paths: { type: 'array', required: true, minLength: 1 },
      classLabel: { type: 'string' },
      backgroundLabel: { type: 'string' },
      partyLabel: { type: 'string' },
      attributePoints: { type: 'number', min: 1, max: 100 },
      maxPerAttribute: { type: 'number', min: 1, max: 20 },
    },

    // GM Context
    gmContext: {
      _type: 'object',
      required: true,
      worldName: { type: 'string', required: true },
      systemName: { type: 'string' },
      magicName: { type: 'string' },
      magicResource: { type: 'string' },
      worldLore: { type: 'string' },
      toneInstruction: { type: 'string' },
    },

    // Combat & Story Actions
    combatActions: { type: 'array', required: true, minLength: 1 },
    storyActions: { type: 'array', minLength: 1 },

    // Character Data
    classes: { type: 'array', required: true, minLength: 1 },
    ancestries: { type: 'array' },
    heroRoles: { type: 'array' },
    weapons: { type: 'object' },
    armors: { type: 'object' },
    conditions: { type: 'object' },
    locations: { type: 'array' },
  };

  // ── Validation Engine ──────────────────────────────────────
  function validate(systemData) {
    const errors = [];
    const warnings = [];
    const repaired = systemData;

    function check(schema, data, path) {
      if (!schema || typeof schema !== 'object') return;

      for (const [key, rule] of Object.entries(schema)) {
        if (key === '_type' || key === 'required') continue;
        const fullPath = path ? `${path}.${key}` : key;
        const val = data ? data[key] : undefined;

        // Nested object
        if (rule._type === 'object') {
          if (rule.required && (!val || typeof val !== 'object')) {
            errors.push({ path: fullPath, msg: 'Required object missing', severity: 'error' });
            // Auto-repair from defaults
            if (data && window.ConfigDefaults) {
              const defaultVal = getNestedDefault(fullPath);
              if (defaultVal !== undefined) {
                data[key] = defaultVal;
                warnings.push({ path: fullPath, msg: 'Auto-filled from defaults' });
              }
            }
          } else if (val && typeof val === 'object') {
            check(rule, val, fullPath);
          }
          continue;
        }

        // Leaf validation
        if (val === undefined || val === null) {
          if (rule.required) {
            errors.push({ path: fullPath, msg: 'Required field missing', severity: 'error' });
            const defaultVal = getNestedDefault(fullPath);
            if (defaultVal !== undefined && data) {
              data[key] = defaultVal;
              warnings.push({ path: fullPath, msg: 'Auto-filled from defaults' });
            }
          }
          continue;
        }

        // Type check
        if (rule.type === 'string' && typeof val !== 'string') {
          errors.push({ path: fullPath, msg: `Expected string, got ${typeof val}`, severity: 'error' });
        }
        if (rule.type === 'number' && typeof val !== 'number') {
          errors.push({ path: fullPath, msg: `Expected number, got ${typeof val}`, severity: 'error' });
          if (data) data[key] = parseFloat(val) || 0;
        }
        if (rule.type === 'boolean' && typeof val !== 'boolean') {
          errors.push({ path: fullPath, msg: `Expected boolean, got ${typeof val}`, severity: 'warning' });
        }
        if (rule.type === 'array' && !Array.isArray(val)) {
          errors.push({ path: fullPath, msg: `Expected array, got ${typeof val}`, severity: 'error' });
          if (data) data[key] = [];
        }
        if (rule.type === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
          errors.push({ path: fullPath, msg: `Expected object, got ${typeof val}`, severity: 'error' });
        }

        // Constraints
        if (rule.min !== undefined && typeof val === 'number' && val < rule.min) {
          warnings.push({ path: fullPath, msg: `Value ${val} below minimum ${rule.min}` });
        }
        if (rule.max !== undefined && typeof val === 'number' && val > rule.max) {
          warnings.push({ path: fullPath, msg: `Value ${val} above maximum ${rule.max}` });
        }
        if (rule.minLength !== undefined && Array.isArray(val) && val.length < rule.minLength) {
          errors.push({ path: fullPath, msg: `Array has ${val.length} items, need at least ${rule.minLength}`, severity: 'error' });
        }
        if (rule.values && !rule.values.includes(val)) {
          warnings.push({ path: fullPath, msg: `Value "${val}" not in allowed set: [${rule.values.join(', ')}]` });
        }
        if (rule.pattern && typeof val === 'string' && !rule.pattern.test(val)) {
          warnings.push({ path: fullPath, msg: `Value "${val}" does not match pattern` });
        }
      }
    }

    // Get a default value by dot-path
    function getNestedDefault(path) {
      const parts = path.split('.');
      let obj = window.ConfigDefaults;
      for (const p of parts) {
        if (!obj || typeof obj !== 'object') return undefined;
        obj = obj[p];
      }
      return obj;
    }

    check(SCHEMA, repaired, '');

    // Cross-reference validation
    if (repaired.rules && repaired.statKeys) {
      // Ensure defense stat refs exist in statKeys
      (repaired.rules.defenses || []).forEach((def, i) => {
        (def.stats || []).forEach((statKey) => {
          if (!repaired.statKeys.includes(statKey)) {
            warnings.push({
              path: `rules.defenses[${i}].stats`,
              msg: `Stat "${statKey}" not found in statKeys [${repaired.statKeys.join(',')}]`,
            });
          }
        });
      });
      // Ensure hp/focus stat refs exist
      if (repaired.rules.hp && repaired.rules.hp.stat && !repaired.statKeys.includes(repaired.rules.hp.stat)) {
        warnings.push({ path: 'rules.hp.stat', msg: `Stat "${repaired.rules.hp.stat}" not in statKeys` });
      }
    }

    // Log results
    const valid = errors.filter((e) => e.severity === 'error').length === 0;
    if (errors.length || warnings.length) {
      const sysName = repaired.name || repaired.id || 'unknown';
      console.groupCollapsed(`[ConfigValidator] ${sysName}: ${errors.length} errors, ${warnings.length} warnings`);
      errors.forEach((e) => console.error(`  ❌ ${e.path}: ${e.msg}`));
      warnings.forEach((w) => console.warn(`  ⚠ ${w.path}: ${w.msg}`));
      console.groupEnd();
    }

    return { valid, errors, warnings, repaired };
  }

  // ── Export ──────────────────────────────────────────────────
  window.ConfigValidator = { validate, SCHEMA };
})();
