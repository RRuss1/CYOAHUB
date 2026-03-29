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
  // 6. NARRATIVE CRAFT KNOWLEDGE BASE (condensed)
  //    Distilled from 15 canonical literary works.
  //    Token-optimized: names + keywords only.
  // ═══════════════════════════════════════════════════════════

  var CRAFT_PRINCIPLES =
    'CRAFT PRINCIPLES (always active): ' +
    'Emotion as sensation, never label. ' +
    'Environment mirrors interior state. ' +
    'Every consequence specific and named. ' +
    'Dread lives in implication, not revelation. ' +
    'Corruption through first compromise, not last. ' +
    'Dialogue carries subtext, not content. ' +
    'Trials remake characters, not reveal them. ' +
    'Prophecy traps its believers. ' +
    'Sincere exchanges change both speakers. ' +
    'Present tense demands commitment to the moment.';

  // Named technique library — keyed for lookup by phase/scene guidance
  var TECHNIQUES = {
    ACCUMULATING_WRONGNESS:   'details individually normal, together wrong',
    PROSE_FRAYING:            'narration unreliable at breaking point (1/act max)',
    SHADOW_SELF:              'name the forbidden want, show relief of wrong choice',
    NAMED_DEATH:              'every death: name, face, one human detail',
    SLOW_CONSEQUENCE:         'early choice paying its debt, reference by name',
    COST_OF_BECOMING:         'power gained, name what is left behind',
    ARISTEIA:                 'peak power from enemy view, then cost in same breath',
    INTERIOR_CONTRADICTION:   'reasoning toward decision already made, show blind spot',
    MASK_FITS_TOO_WELL:       'pretender becoming the role, mask surprises wearer',
    PARALYSIS_AS_CHOICE:      'inaction costs in real time, show what closes',
    GUIDE_WITH_SCARS:         'authority from survival, warnings as testimony',
    PUNISHMENT_MIRRORS_SIN:   'consequence rhymes with the crime',
    UNCROSSABLE_PAST:         'past intrudes via smell, gesture, echo of the dead',
    BOAST_AND_RECKONING:      'declaration vs reality, gap is where character lives',
    TEMPTATION_AS_ENEMY:      'make wrong choice genuinely attractive before the flaw',
    SINCERE_EXCHANGE:         'both speakers changed, no strategy or performance',
    CHARISMATIC_ALMOST_RIGHT: 'antagonist right about everything except what matters',
  };

  // Full library string (kept for system prompt — condensed reference)
  var TECHNIQUE_NAMES = Object.keys(TECHNIQUES);

  var TECHNIQUE_LIBRARY_STR =
    '\n\nTECHNIQUE LIBRARY (reference — specific techniques injected per beat):\n' +
    TECHNIQUE_NAMES.map(function (k) { return k; }).join(' · ');

  /**
   * Resolve technique keys to one-line descriptions.
   * Input: "ACCUMULATING_WRONGNESS · BOAST_AND_RECKONING"
   * Output: "ACCUMULATING_WRONGNESS — details individually normal...\nBOAST_AND_RECKONING — declaration vs reality..."
   */
  function _expandTechniques(keysStr) {
    if (!keysStr) return '';
    var keys = keysStr.split(/\s*·\s*/);
    var lines = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i].trim();
      if (TECHNIQUES[k]) lines.push(k + ' — ' + TECHNIQUES[k]);
    }
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 7. PHASE GUIDANCE (replaces old 5-phase system)
  // ═══════════════════════════════════════════════════════════

  var PHASE_TECHNIQUES = {
    opening:       'ACCUMULATING_WRONGNESS · BOAST_AND_RECKONING',
    discovery:     'GUIDE_WITH_SCARS · UNCROSSABLE_PAST',
    rising_tension:'INTERIOR_CONTRADICTION · TEMPTATION_AS_ENEMY',
    confrontation: 'ARISTEIA · NAMED_DEATH · BOAST_AND_RECKONING',
    crisis:        'PARALYSIS_AS_CHOICE · SHADOW_SELF · PUNISHMENT_MIRRORS_SIN',
    oath:          'COST_OF_BECOMING · BOAST_AND_RECKONING',
    aftermath:     'SLOW_CONSEQUENCE · SINCERE_EXCHANGE · UNCROSSABLE_PAST',
  };

  var PHASE_GUIDANCE = {
    opening:
      'Drop into motion mid-scene. Plant one physical mystery for act 2. ' +
      'Establish emotional register. One element that matters later — don\'t signal importance.',

    discovery:
      'Information through evidence, not testimony. Every discovery raises a new question. ' +
      'One genuinely ambiguous detail. Ground in sensory specificity.',

    rising_tension:
      'Compress low-stakes time, stretch high-stakes. Something makes confrontation costlier than expected. ' +
      'Journey cost in bodies — hunger, cold, sleeplessness. One NPC\'s reliability uncertain through behavior.',

    confrontation:
      'Open in middle of motion. Every round changes something beyond HP. ' +
      'Humanize at least one enemy with one detail. Final moment specific — exactly how, who saw it.',

    crisis:
      'Genuine dilemma — both options cost something real and named. Delay costs in real time. ' +
      'Name what conflicts with oath or values. Crisis rhymes with backstory. Environment mirrors pressure.',

    oath:
      'Earned, not performed — inevitable given everything before. Name what is left behind. ' +
      'Magic response physical and specific, not a glow. One witness reacts with something other than awe.',

    aftermath:
      'Reference one early choice by name, show what it became. Don\'t resolve everything. ' +
      'Bodies tell the act\'s story. Sincere exchanges happen here. World different in one named way.',
  };

  /**
   * Get phase guidance for current story position.
   * Replaces the old 5-phase inline system in turnPrompt().
   */
  function getPhaseGuidance(beatNum, totalBeats, preCombatNow, combatMode, turn) {
    if (combatMode) return '';

    var phase;
    var gs = typeof gState !== 'undefined' ? gState : {};

    // Priority 1: pre-combat confrontation
    if (preCombatNow) {
      phase = 'confrontation';
    }
    // Priority 2: act transitions → aftermath
    else if (turn === 59 || turn === 119) {
      phase = 'aftermath';
    }
    // Priority 3: story beat overrides
    else {
      var beats = (window.SystemData && window.SystemData.storyBeats) || DEFAULT_BEATS;
      var activeBeat = null;
      for (var i = 0; i < beats.length; i++) {
        if (Math.abs(beats[i].turn - turn) <= 2) { activeBeat = beats[i]; break; }
      }
      if (activeBeat && (activeBeat.type === 'loss' || activeBeat.type === 'sacrifice' || activeBeat.type === 'betrayal')) {
        phase = 'crisis';
      }
      // Priority 4: opening turns
      else if (turn <= 2 || turn === 60 || turn === 61 || turn === 120 || turn === 121) {
        phase = 'opening';
      }
      // Priority 5: beat-position mapping
      else {
        var progress = totalBeats > 0 ? beatNum / totalBeats : 0.5;
        if (progress <= 0.3) phase = 'discovery';
        else if (progress <= 0.7) phase = 'rising_tension';
        else phase = 'confrontation';
      }
    }

    // Oath override — check if any player near oath threshold
    if (phase !== 'confrontation' && phase !== 'crisis') {
      var players = gs.players || [];
      for (var j = 0; j < players.length; j++) {
        if (players[j] && players[j].oathProgress && players[j].oathProgress >= 0.8) {
          phase = 'oath';
          break;
        }
      }
    }

    var guidance = PHASE_GUIDANCE[phase] || PHASE_GUIDANCE.discovery;
    var techniqueKeys = PHASE_TECHNIQUES[phase] || PHASE_TECHNIQUES.discovery;
    var expanded = _expandTechniques(techniqueKeys);

    return '\n\nPHASE — ' + phase.toUpperCase().replace(/_/g, ' ') +
      ' (' + beatNum + '/' + totalBeats + '):\n' +
      (expanded ? expanded + '\n' : '') + guidance;
  }

  // ═══════════════════════════════════════════════════════════
  // 8. SCENE TYPE DETECTION + GUIDANCE
  // ═══════════════════════════════════════════════════════════

  var SCENE_GUIDANCE = {
    npc_dialogue:
      'NPC wants something unstated. Three words unique to this character. ' +
      'NPC leaves exchange changed. Subtext louder than text.',

    exploration:
      'Three senses: visual + auditory/olfactory + tactile. One inexplicable detail. ' +
      'Environment contradicts its reputation. Evidence over testimony.',

    combat:
      'Start in motion. Named death for significant kills. Aristeia at peak power with cost. ' +
      'Environment changes each round. Enemy has goal, fear, and tell.',

    injury:
      'Exact body part, sensation, limitation created. Immediate effect + planted ongoing effect. ' +
      'Character response reveals character. Others\' reactions matter equally.',

    moral_dilemma:
      'Wrong choice gets best argument. Name what oath forbids. Both options cost specifically. ' +
      'Delay costs in real time. Dilemma rhymes with backstory.',

    revelation:
      'Never exposition — evidence or testimony. Knowledge cost someone. ' +
      'One element genuinely ambiguous. Revelation recontextualizes, not just adds.',

    emotional:
      'Something true said — relief and cost simultaneously. Show reasoning gap. ' +
      'Reference one prior beat. Name what is left behind. Stretch time — duration is respect.',
  };

  /**
   * Detect scene type from action text and game context.
   * Independent layer — not tied to action tags.
   */
  function detectSceneType(action, gameState) {
    if (!action) return 'exploration';
    var act = action.toLowerCase();
    var gs = gameState || {};

    // Combat mode override
    if (gs.combatMode) return 'combat';

    // Action text patterns (most specific first)
    if (/oath|swear|vow|bond|transform|ideal|pledge|embrace|kneel/i.test(act)) return 'emotional';
    if (/choose|decide|sacrifice|betray|abandon|save|condemn|spare|mercy|refuse|accept|bargain/i.test(act)) return 'moral_dilemma';
    if (/speak|talk|persuade|negotiate|ask|tell|confront|argue|plead|convince|warn|lie|question|challenge/i.test(act)) return 'npc_dialogue';
    if (/examine|investigate|search|explore|look|inspect|study|read|decipher|enter|scout|sneak|observe|open|touch/i.test(act)) return 'exploration';

    // Context-based fallback — check for recent injuries
    var players = gs.players || [];
    var hasRecentInjury = false;
    for (var i = 0; i < players.length; i++) {
      if (players[i] && players[i].injuries && players[i].injuries.length && players[i].hp < (players[i].maxHp || 1) * 0.4) {
        hasRecentInjury = true;
        break;
      }
    }
    if (hasRecentInjury) return 'injury';

    // Story beat type fallback
    var turn = gs.totalMoves || 0;
    var beats = (window.SystemData && window.SystemData.storyBeats) || DEFAULT_BEATS;
    for (var j = 0; j < beats.length; j++) {
      if (Math.abs(beats[j].turn - turn) <= 3) {
        var bt = beats[j].type;
        if (bt === 'betrayal' || bt === 'twist' || bt === 'truth') return 'revelation';
        if (bt === 'loss' || bt === 'sacrifice') return 'moral_dilemma';
        if (bt === 'resolution') return 'emotional';
        break;
      }
    }

    return 'exploration';
  }

  /**
   * Get scene type guidance string for prompt injection.
   */
  function getSceneGuidance(action, gameState) {
    var sceneType = detectSceneType(action, gameState);
    var guidance = SCENE_GUIDANCE[sceneType];
    if (!guidance) return '';
    return '\n\nSCENE — ' + sceneType.toUpperCase().replace(/_/g, ' ') + ':\n' + guidance;
  }

  /**
   * Get craft principles string for system prompt injection.
   */
  function getCraftPrinciples() {
    return '\n\n' + CRAFT_PRINCIPLES;
  }

  /**
   * Get technique library string for system prompt injection.
   */
  function getTechniqueLibrary() {
    return TECHNIQUE_LIBRARY_STR;
  }

  /**
   * Get combat-specific craft guidance by combat prompt type.
   */
  function getCombatCraftGuidance(type, round) {
    if (type === 'opening') {
      return '\nCRAFT: Open in middle of motion — sword already moving. Humanize one enemy with one specific detail. Connect threat to the narrative thread.';
    }
    if (type === 'round') {
      var hint = round <= 2
        ? 'ACCUMULATING_WRONGNESS — something in the environment shifts each round.'
        : round <= 4
          ? 'ARISTEIA if a player crits — peak power from enemy\'s view, then cost. NAMED_DEATH for any significant kill.'
          : 'Final moments — COST_OF_BECOMING. Someone is changing. Name it.';
      return '\nCRAFT: ' + hint + ' Every round changes something beyond HP — position, visibility, emotional state.';
    }
    if (type === 'victory') {
      return '\nCRAFT: SLOW_CONSEQUENCE — reference what this fight cost by name. Victory is relief and exhaustion, never glory. Bodies tell the story.';
    }
    if (type === 'defeat') {
      return '\nCRAFT: Stillness after violence. NAMED_DEATH principle — what was lost is specific. End on consequence, not despair.';
    }
    return '';
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
    getPhaseGuidance: getPhaseGuidance,
    getSceneGuidance: getSceneGuidance,
    getCraftPrinciples: getCraftPrinciples,
    getTechniqueLibrary: getTechniqueLibrary,
    getCombatCraftGuidance: getCombatCraftGuidance,
    detectSceneType: detectSceneType,
    STYLE_MODIFIERS: STYLE_MODIFIERS,
    DEFAULT_BEATS: DEFAULT_BEATS,
    PHASE_GUIDANCE: PHASE_GUIDANCE,
    SCENE_GUIDANCE: SCENE_GUIDANCE,
    TECHNIQUE_NAMES: TECHNIQUE_NAMES,
  };
})();
