/**
 * ============================================================
 * app/storyEngine.js — Narrative Intelligence Engine
 * CYOAhub
 * ============================================================
 * Handles:
 *   1. Story arc memory (load/save to DB)
 *   2. Post-turn extraction (NPCs, factions, consequences)
 *   3. Rotating style modifiers for GM variety
 *   4. NPC registry injection into prompts
 *   5. Story beat templates and pacing nudges
 *
 * Loaded AFTER gameState.js, BEFORE ui.js.
 * ============================================================
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // 1. STORY ARC MEMORY
  // ═══════════════════════════════════════════════════════════

  let _storyArc = null;

  async function loadStoryArc(campaignId) {
    if (!campaignId) return null;
    try {
      const res = await fetch(PROXY_URL + '/db/story/' + encodeURIComponent(campaignId));
      _storyArc = await res.json();
    } catch (e) {
      _storyArc = _emptyArc();
    }
    return _storyArc;
  }

  async function saveStoryArc(campaignId) {
    if (!campaignId || !_storyArc) return;
    try {
      await fetch(PROXY_URL + '/db/story/' + encodeURIComponent(campaignId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_storyArc),
      });
    } catch (e) {
      console.warn('[StoryEngine] Save failed:', e.message);
    }
  }

  function _emptyArc() {
    return {
      act: 1,
      npcs: [],
      factions: {},
      secrets: [],
      threads: [],
      consequences: [],
      locations_visited: [],
      reputation: {},
      dramatic_question: '',
    };
  }

  function getStoryArc() {
    return _storyArc || _emptyArc();
  }

  // ═══════════════════════════════════════════════════════════
  // 2. POST-TURN EXTRACTION
  // ═══════════════════════════════════════════════════════════

  /**
   * After each GM response, extract structured narrative data.
   * Uses Haiku for cheap, fast extraction (~$0.001 per call).
   */
  async function extractFromNarrative(gmText, playerAction, turn) {
    if (!gmText || gmText.length < 50) return;
    if (!_storyArc) _storyArc = _emptyArc();

    const existingNpcs = _storyArc.npcs.map(function (n) { return n.name; }).join(', ') || 'none yet';
    const existingThreads = _storyArc.threads.filter(function (t) { return !t.resolved; }).map(function (t) { return t.desc; }).join('; ') || 'none yet';

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content:
                'Extract narrative data from this RPG turn as JSON. Return ONLY valid JSON.\n\n' +
                'Story: "' + gmText.substring(0, 600) + '"\n' +
                'Player action: "' + (playerAction || '').substring(0, 200) + '"\n' +
                'Turn: ' + turn + '\n' +
                'Known NPCs: ' + existingNpcs + '\n' +
                'Open threads: ' + existingThreads + '\n\n' +
                'Return: {"npcs":[{"name":"NPC name","disposition":"friendly|hostile|neutral","notes":"brief context"}],' +
                '"factions":{"FactionName":"friendly|hostile|neutral"},' +
                '"secrets":["new secret if revealed"],' +
                '"threads":[{"desc":"unresolved situation","resolved":false}],' +
                '"consequences":[{"desc":"lasting result of this action"}],' +
                '"location":"where this happened",' +
                '"dramatic_shift":"one sentence about how the story changed, or empty"}\n' +
                'If nothing notable happened, return {}',
            },
          ],
        }),
      });
      const data = await res.json();
      var raw = data.content && data.content[0] ? data.content[0].text : '{}';
      // Strip markdown code fences if present
      raw = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      var extracted;
      try { extracted = JSON.parse(raw); } catch (e) { return; }

      // Merge extracted data into story arc
      _mergeExtracted(extracted, turn);

      // Save to DB (non-blocking)
      if (typeof campaignId !== 'undefined' && campaignId) {
        saveStoryArc(campaignId).catch(function () {});
      }
    } catch (e) {
      console.warn('[StoryEngine] Extraction failed:', e.message);
    }
  }

  function _mergeExtracted(data, turn) {
    if (!_storyArc) _storyArc = _emptyArc();

    // NPCs — upsert by name
    if (data.npcs && Array.isArray(data.npcs)) {
      data.npcs.forEach(function (npc) {
        if (!npc.name) return;
        var existing = _storyArc.npcs.find(function (n) { return n.name.toLowerCase() === npc.name.toLowerCase(); });
        if (existing) {
          if (npc.disposition) existing.disposition = npc.disposition;
          if (npc.notes) existing.notes = npc.notes;
          existing.lastSeen = turn;
        } else {
          _storyArc.npcs.push({ name: npc.name, disposition: npc.disposition || 'neutral', notes: npc.notes || '', lastSeen: turn, introduced: turn });
        }
      });
      // Cap at 20 NPCs, remove oldest
      if (_storyArc.npcs.length > 20) _storyArc.npcs = _storyArc.npcs.slice(-20);
    }

    // Factions
    if (data.factions) {
      Object.assign(_storyArc.factions, data.factions);
    }

    // Secrets
    if (data.secrets && Array.isArray(data.secrets)) {
      data.secrets.forEach(function (s) {
        if (s && !_storyArc.secrets.includes(s)) _storyArc.secrets.push(s);
      });
      if (_storyArc.secrets.length > 15) _storyArc.secrets = _storyArc.secrets.slice(-15);
    }

    // Threads
    if (data.threads && Array.isArray(data.threads)) {
      data.threads.forEach(function (t) {
        if (!t.desc) return;
        var existing = _storyArc.threads.find(function (x) { return x.desc.toLowerCase().includes(t.desc.toLowerCase().substring(0, 20)); });
        if (existing) {
          if (t.resolved) existing.resolved = true;
        } else {
          _storyArc.threads.push({ desc: t.desc, introduced: turn, resolved: t.resolved || false });
        }
      });
      if (_storyArc.threads.length > 12) _storyArc.threads = _storyArc.threads.slice(-12);
    }

    // Consequences
    if (data.consequences && Array.isArray(data.consequences)) {
      data.consequences.forEach(function (c) {
        if (c.desc) _storyArc.consequences.push({ turn: turn, desc: c.desc, active: true });
      });
      if (_storyArc.consequences.length > 15) _storyArc.consequences = _storyArc.consequences.slice(-15);
    }

    // Location
    if (data.location) {
      _storyArc.locations_visited.push({ name: data.location, turn: turn });
      if (_storyArc.locations_visited.length > 20) _storyArc.locations_visited = _storyArc.locations_visited.slice(-20);
    }

    // Dramatic shift
    if (data.dramatic_shift) _storyArc.dramatic_question = data.dramatic_shift;
  }

  // ═══════════════════════════════════════════════════════════
  // 3. ROTATING STYLE MODIFIERS
  // ═══════════════════════════════════════════════════════════

  var STYLE_MODIFIERS = [
    'This scene: focus on SOUND. What do they hear? Echoes, breathing, distant rumbles.',
    'This scene: focus on SMELL and TASTE. Visceral sensory detail.',
    'This scene: dialogue-heavy. Let an NPC speak. Give them a voice.',
    'This scene: show passage of TIME. Hours pass in a sentence. Then snap to the present.',
    'This scene: internal. What is the character THINKING? One moment of introspection.',
    'This scene: environmental storytelling. The surroundings tell a story. Scratches on a wall. A child\'s toy in the dust.',
    'This scene: tension through SILENCE. What isn\'t being said? What are they avoiding?',
    'This scene: tactile. Temperature, texture, weight. The physical world presses in.',
    'This scene: movement. Everything is in motion. Nothing stays still.',
    'This scene: contrast. Something beautiful in an ugly place, or something wrong in a safe place.',
    'This scene: consequences. Something from earlier comes back. A choice echoes.',
    'This scene: mystery. Leave something unexplained. Not everything gets answered.',
  ];

  function getStyleModifier(turn) {
    return STYLE_MODIFIERS[turn % STYLE_MODIFIERS.length];
  }

  // ═══════════════════════════════════════════════════════════
  // 4. NPC REGISTRY — prompt injection
  // ═══════════════════════════════════════════════════════════

  function getNpcContext() {
    var arc = getStoryArc();
    if (!arc.npcs || !arc.npcs.length) return '';
    var recent = arc.npcs.filter(function (n) { return !n.dead; }).slice(-8);
    if (!recent.length) return '';
    var lines = recent.map(function (n) {
      return '- ' + n.name + ' (' + (n.disposition || 'neutral') + '): ' + (n.notes || 'No details yet') + (n.lastSeen ? '. Last seen turn ' + n.lastSeen : '');
    });
    return '\n\nRECURRING NPCs — maintain their personality and voice:\n' + lines.join('\n');
  }

  function getConsequenceContext() {
    var arc = getStoryArc();
    var active = (arc.consequences || []).filter(function (c) { return c.active; }).slice(-6);
    if (!active.length) return '';
    return '\n\nACTIVE CONSEQUENCES (from previous choices — weave naturally):\n' + active.map(function (c) { return '- Turn ' + c.turn + ': ' + c.desc; }).join('\n');
  }

  function getThreadContext() {
    var arc = getStoryArc();
    var open = (arc.threads || []).filter(function (t) { return !t.resolved; }).slice(-5);
    if (!open.length) return '';
    return '\n\nOPEN STORY THREADS (unresolved — advance or reference when natural):\n' + open.map(function (t) { return '- ' + t.desc + ' (since turn ' + t.introduced + ')'; }).join('\n');
  }

  function getFactionContext() {
    var arc = getStoryArc();
    var factions = arc.factions || {};
    var keys = Object.keys(factions);
    if (!keys.length) return '';
    return '\n\nFACTION STANDINGS:\n' + keys.map(function (k) { return '- ' + k + ': ' + factions[k]; }).join('\n');
  }

  /**
   * Get the full narrative intelligence context for injection into GM prompts.
   * Call this in every GM prompt to give the AI structured memory.
   */
  function getFullNarrativeContext() {
    return getNpcContext() + getConsequenceContext() + getThreadContext() + getFactionContext();
  }

  // ═══════════════════════════════════════════════════════════
  // 5. STORY BEAT TEMPLATES
  // ═══════════════════════════════════════════════════════════

  var DEFAULT_BEATS = [
    { turn: 1, type: 'opening', hint: 'Immediate danger or mystery. The world is already in motion.' },
    { turn: 10, type: 'ally', hint: 'A potential ally appears — but they have their own agenda. Don\'t make them simple.' },
    { turn: 25, type: 'escalation', hint: 'The stakes rise. What seemed local is connected to something larger.' },
    { turn: 40, type: 'betrayal', hint: 'Someone the party trusted reveals a secret or shifts allegiance.' },
    { turn: 55, type: 'twist', hint: 'The real enemy or problem is not what they assumed. Reframe the conflict.' },
    { turn: 60, type: 'act2_open', hint: 'New location, new dangers. The world has changed because of Act I choices.' },
    { turn: 80, type: 'loss', hint: 'Something is taken. A place destroyed, an ally lost, a power stripped.' },
    { turn: 100, type: 'truth', hint: 'A fundamental truth is revealed. Everything clicks into place.' },
    { turn: 115, type: 'preparation', hint: 'The party prepares for the final confrontation. Let them plan.' },
    { turn: 120, type: 'act3_open', hint: 'The final act. Everything converges. No more side quests — this is it.' },
    { turn: 140, type: 'sacrifice', hint: 'Something must be given up. Power, safety, or a bond. Make it cost.' },
    { turn: 165, type: 'climax', hint: 'The final confrontation. Everything earned or lost comes to bear.' },
    { turn: 178, type: 'resolution', hint: 'The aftermath. What has changed? Who survived? What was it all for?' },
  ];

  /**
   * Get the current story beat hint for the GM, if any.
   * Returns a string to inject into the prompt, or empty.
   */
  function getStoryBeatHint(turn) {
    var beats = (window.SystemData && window.SystemData.storyBeats) || DEFAULT_BEATS;
    // Find beats within ±3 turns of current
    var active = beats.filter(function (b) { return Math.abs(b.turn - turn) <= 3; });
    if (!active.length) return '';
    var beat = active[0];
    return '\n\nSTORY PACING HINT (subtle — weave naturally, don\'t force):\n' +
      'Around turn ' + beat.turn + ' (' + beat.type + '): ' + beat.hint;
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════

  window.StoryEngine = {
    loadStoryArc: loadStoryArc,
    saveStoryArc: saveStoryArc,
    getStoryArc: getStoryArc,
    extractFromNarrative: extractFromNarrative,
    getStyleModifier: getStyleModifier,
    getNpcContext: getNpcContext,
    getConsequenceContext: getConsequenceContext,
    getThreadContext: getThreadContext,
    getFactionContext: getFactionContext,
    getFullNarrativeContext: getFullNarrativeContext,
    getStoryBeatHint: getStoryBeatHint,
    STYLE_MODIFIERS: STYLE_MODIFIERS,
    DEFAULT_BEATS: DEFAULT_BEATS,
  };
})();
