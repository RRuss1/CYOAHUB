/**
 * ============================================================
 * app/devMode.js — Developer Mode & Debug Tools
 * CYOAhub
 * ============================================================
 * Activated via ?dev=1 URL param or window.CYOA_DEV = true.
 * Provides: config source highlighting, fallback logging,
 * live config editing panel, and validation reports.
 *
 * Loaded LAST (after main.js). Zero overhead when inactive.
 * ============================================================
 */

(function () {
  'use strict';

  // ── Activation Gate ────────────────────────────────────────
  const urlDev = new URLSearchParams(window.location.search).get('dev') === '1';
  const globalDev = window.CYOA_DEV === true;
  if (!urlDev && !globalDev) return; // Exit immediately — no overhead

  console.log('%c[DEV MODE] Active — Ctrl+Shift+D for config editor', 'color:#C9A84C;font-weight:bold;font-size:14px;');
  document.body.classList.add('dev-mode');

  // ── 1. Fallback Usage Report ──────────────────────────────
  const _fallbackReport = {};

  function logFallbacks(systemData) {
    if (!systemData || !window.ConfigDefaults) return;
    const defaults = window.ConfigDefaults;

    function compare(sys, def, path) {
      if (!def || typeof def !== 'object') return;
      for (const key of Object.keys(def)) {
        const fullPath = path ? `${path}.${key}` : key;
        const sysVal = sys ? sys[key] : undefined;
        const defVal = def[key];

        if (defVal && typeof defVal === 'object' && !Array.isArray(defVal)) {
          compare(sysVal, defVal, fullPath);
        } else if (sysVal === undefined || sysVal === null) {
          _fallbackReport[fullPath] = { default: defVal, source: 'ConfigDefaults' };
        }
      }
    }

    compare(systemData.rules, defaults.rules, 'rules');
    compare(systemData.charCreation, defaults.charCreation, 'charCreation');

    const count = Object.keys(_fallbackReport).length;
    if (count > 0) {
      console.groupCollapsed(`%c[DEV] Fallback report: ${count} fields using defaults`, 'color:#888;');
      console.table(_fallbackReport);
      console.groupEnd();
    } else {
      console.log('%c[DEV] No fallbacks — system config is fully specified', 'color:#28A87A;');
    }
  }

  // ── 2. Config Source Highlighting ─────────────────────────
  // Inject CSS for dev mode indicators
  const style = document.createElement('style');
  style.textContent = `
    body.dev-mode [data-config-source]::after {
      content: attr(data-config-source);
      position: absolute; top: -8px; right: -4px;
      font-size: 8px; font-family: monospace;
      padding: 1px 3px; border-radius: 3px;
      pointer-events: none; z-index: 999;
    }
    body.dev-mode [data-config-source="system"]::after {
      background: #C9A84C22; color: #C9A84C; border: 1px solid #C9A84C44;
    }
    body.dev-mode [data-config-source="default"]::after {
      background: #88888822; color: #888; border: 1px solid #88888844;
    }
    #dev-panel {
      position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
      background: #0a0a10ee; border-left: 2px solid #C9A84C40;
      z-index: 99999; display: none; flex-direction: column;
      font-family: 'Courier New', monospace; font-size: 12px; color: #e0e0e0;
      backdrop-filter: blur(10px);
    }
    #dev-panel.open { display: flex; }
    #dev-panel-header {
      padding: 12px 16px; border-bottom: 1px solid #333;
      display: flex; justify-content: space-between; align-items: center;
    }
    #dev-panel-header h3 { margin: 0; color: #C9A84C; font-size: 14px; }
    #dev-panel textarea {
      flex: 1; background: #111; color: #ddd; border: none; padding: 12px;
      font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.5;
      resize: none; outline: none;
    }
    #dev-panel-actions { padding: 10px 16px; display: flex; gap: 8px; border-top: 1px solid #333; }
    #dev-panel-actions button {
      padding: 6px 14px; border: 1px solid #555; border-radius: 4px;
      background: #1a1a24; color: #ddd; cursor: pointer; font-size: 11px;
    }
    #dev-panel-actions button:hover { background: #2a2a34; border-color: #C9A84C; }
    #dev-panel-status { padding: 4px 16px; font-size: 10px; color: #888; }
  `;
  document.head.appendChild(style);

  // ── 3. Live Config Editor Panel ───────────────────────────
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.innerHTML = `
    <div id="dev-panel-header">
      <h3>⟁ Config Editor</h3>
      <button onclick="document.getElementById('dev-panel').classList.remove('open')" style="background:none;border:none;color:#888;cursor:pointer;font-size:16px;">✕</button>
    </div>
    <div id="dev-panel-status">System: ${window.SystemData ? window.SystemData.name : 'none loaded'}</div>
    <textarea id="dev-config-editor" spellcheck="false"></textarea>
    <div id="dev-panel-actions">
      <button onclick="window.DevMode.applyConfig()">✓ Apply</button>
      <button onclick="window.DevMode.validateConfig()">⚡ Validate</button>
      <button onclick="window.DevMode.exportConfig()">↓ Export</button>
      <button onclick="window.DevMode.resetConfig()">↻ Reset</button>
    </div>`;
  document.body.appendChild(panel);

  function togglePanel() {
    const p = document.getElementById('dev-panel');
    p.classList.toggle('open');
    if (p.classList.contains('open')) {
      refreshEditor();
    }
  }

  function refreshEditor() {
    const editor = document.getElementById('dev-config-editor');
    const status = document.getElementById('dev-panel-status');
    if (window.SystemData) {
      // Show a curated subset (not the full data tables — too large)
      const subset = {
        id: window.SystemData.id,
        name: window.SystemData.name,
        rules: window.SystemData.rules,
        charCreation: window.SystemData.charCreation,
        combatActions: window.SystemData.combatActions,
        storyActions: window.SystemData.storyActions,
        gmContext: window.SystemData.gmContext,
        theme: window.SystemData.theme,
      };
      editor.value = JSON.stringify(subset, null, 2);
      status.textContent = `System: ${window.SystemData.name || window.SystemData.id} | Keys: ${Object.keys(window.SystemData).length}`;
    } else {
      editor.value = '// No system loaded';
      status.textContent = 'System: none loaded';
    }
  }

  function applyConfig() {
    const editor = document.getElementById('dev-config-editor');
    const status = document.getElementById('dev-panel-status');
    try {
      const parsed = JSON.parse(editor.value);
      // Merge into current SystemData
      Object.assign(window.SystemData, parsed);
      if (window.resolveWithDefaults) window.resolveWithDefaults(window.SystemData);
      status.textContent = '✓ Applied. Refresh screen to see changes.';
      status.style.color = '#28A87A';
      console.log('[DEV] Config applied:', parsed);
    } catch (e) {
      status.textContent = '✕ JSON error: ' + e.message;
      status.style.color = '#B03828';
    }
  }

  function validateConfig() {
    const editor = document.getElementById('dev-config-editor');
    const status = document.getElementById('dev-panel-status');
    try {
      const parsed = JSON.parse(editor.value);
      if (window.ConfigValidator) {
        const result = window.ConfigValidator.validate(parsed);
        const msg = result.valid
          ? `✓ Valid (${result.warnings.length} warnings)`
          : `✕ ${result.errors.length} errors, ${result.warnings.length} warnings`;
        status.textContent = msg;
        status.style.color = result.valid ? '#28A87A' : '#B03828';
      } else {
        status.textContent = 'ConfigValidator not loaded';
      }
    } catch (e) {
      status.textContent = '✕ JSON error: ' + e.message;
      status.style.color = '#B03828';
    }
  }

  function exportConfig() {
    if (!window.SystemData) return;
    const blob = new Blob([JSON.stringify(window.SystemData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (window.SystemData.id || 'worldConfig') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetConfig() {
    if (window.SystemData && window.SystemData.id && typeof loadSystem === 'function') {
      loadSystem(window.SystemData.id);
      refreshEditor();
      document.getElementById('dev-panel-status').textContent = '↻ Reset to original config';
    }
  }

  // ── Keyboard shortcut: Ctrl+Shift+D ──
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      togglePanel();
    }
  });

  // ── System Load Hook ──
  function onSystemLoad(systemData) {
    logFallbacks(systemData);
    refreshEditor();
    document.getElementById('dev-panel-status').textContent =
      `System: ${systemData.name || systemData.id} | Keys: ${Object.keys(systemData).length}`;
  }

  // ── Export ──
  window.DevMode = {
    onSystemLoad,
    togglePanel,
    applyConfig,
    validateConfig,
    exportConfig,
    resetConfig,
    getFallbackReport: () => ({ ..._fallbackReport }),
  };
})();
