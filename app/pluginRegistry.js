/**
 * ============================================================
 * app/pluginRegistry.js — Plugin / Extension System
 * CYOAhub
 * ============================================================
 * Allows new modules (crafting, factions, magic schools) to
 * register via config extension without modifying core files.
 *
 * Loaded AFTER configDefaults.js, BEFORE gameState.js.
 *
 * Usage:
 *   PluginRegistry.register({
 *     id: 'crafting',
 *     name: 'Crafting System',
 *     rulesExtension: { craftingEnabled: true },
 *     combatActions: [{ id: 'craft', tag: 'CRAFT', label: 'Craft', icon: '🔨' }],
 *     hooks: { onRoundEnd(gState) { ... } }
 *   });
 * ============================================================
 */

(function() {
  'use strict';

  const _plugins = {};

  /**
   * Register a plugin definition.
   */
  function register(pluginDef) {
    if (!pluginDef || !pluginDef.id) {
      console.warn('[PluginRegistry] Plugin must have an id');
      return;
    }
    if (_plugins[pluginDef.id]) {
      console.warn(`[PluginRegistry] Plugin "${pluginDef.id}" already registered, overwriting`);
    }
    _plugins[pluginDef.id] = pluginDef;
    console.log(`[PluginRegistry] Registered: ${pluginDef.name || pluginDef.id}`);
  }

  /**
   * Apply all registered plugins to a system data object.
   * Called by loadSystem() after resolveWithDefaults().
   */
  function applyPlugins(systemData) {
    if (!systemData) return;

    for (const [id, plugin] of Object.entries(_plugins)) {
      // Deep-merge rules extension
      if (plugin.rulesExtension && systemData.rules) {
        Object.assign(systemData.rules, plugin.rulesExtension);
      }

      // Append combat actions (avoid duplicates by id)
      if (plugin.combatActions && Array.isArray(plugin.combatActions)) {
        if (!systemData.combatActions) systemData.combatActions = [];
        const existingIds = new Set(systemData.combatActions.map(a => a.id));
        plugin.combatActions.forEach(action => {
          if (!existingIds.has(action.id)) {
            systemData.combatActions.push(action);
          }
        });
      }

      // Append story actions
      if (plugin.storyActions && Array.isArray(plugin.storyActions)) {
        if (!systemData.storyActions) systemData.storyActions = [];
        const existingIds = new Set(systemData.storyActions.map(a => a.id));
        plugin.storyActions.forEach(action => {
          if (!existingIds.has(action.id)) {
            systemData.storyActions.push(action);
          }
        });
      }

      // Append conditions
      if (plugin.conditions && systemData.conditions) {
        Object.assign(systemData.conditions, plugin.conditions);
      }

      // Call onSystemLoad hook
      if (plugin.hooks && typeof plugin.hooks.onSystemLoad === 'function') {
        try { plugin.hooks.onSystemLoad(systemData); } catch(e) {
          console.warn(`[PluginRegistry] Hook onSystemLoad failed for "${id}":`, e);
        }
      }
    }
  }

  /**
   * Invoke a named hook across all plugins.
   * @param {string} hookName — e.g. 'onCombatStart', 'onRoundEnd'
   * @param {...*} args — passed to each hook function
   */
  function invoke(hookName, ...args) {
    for (const [id, plugin] of Object.entries(_plugins)) {
      if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
        try { plugin.hooks[hookName](...args); } catch(e) {
          console.warn(`[PluginRegistry] Hook ${hookName} failed for "${id}":`, e);
        }
      }
    }
  }

  function getAll() { return { ..._plugins }; }
  function get(id) { return _plugins[id] || null; }
  function unregister(id) { delete _plugins[id]; }

  window.PluginRegistry = { register, applyPlugins, invoke, getAll, get, unregister };

})();
