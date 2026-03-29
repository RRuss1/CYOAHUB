-- ============================================================
-- 006_narrative_craft_kb.sql — Narrative Craft Knowledge Base
-- Full technique descriptions for admin audit / chronicle review.
-- Runtime prompts use condensed names only (in storyEngine.js).
-- ============================================================

CREATE TABLE IF NOT EXISTS narrative_techniques (
  key           TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  seed_work     TEXT NOT NULL,           -- literary source
  use_when      TEXT NOT NULL,           -- scenario description
  how           TEXT NOT NULL,           -- execution instructions
  phases        TEXT[] DEFAULT '{}',     -- phases where this technique applies
  scene_types   TEXT[] DEFAULT '{}'      -- scene types where this technique applies
);

-- Seed the 17 techniques from the Narrative Craft Knowledge Base
-- (distilled from 15 canonical literary works)

INSERT INTO narrative_techniques (key, name, seed_work, use_when, how, phases, scene_types)
VALUES
  ('ACCUMULATING_WRONGNESS',
   'The Accumulating Wrongness',
   'Dracula',
   'Any scene where dread should build — exploration, investigation, a corrupted NPC, an uncanny location.',
   'List three details in the environment that are each individually explicable but together feel wrong. The detail that is missing where it should be. The sound that is one beat off. The NPC who answers correctly but whose eyes don''t move. Do not name the wrongness. Let the player feel it accumulating.',
   '{opening,discovery}',
   '{exploration}'),

  ('PROSE_FRAYING',
   'The Prose Fraying',
   'The King in Yellow',
   'When a character is at psychological breaking point — oath failure, horror exposure, extended isolation, forbidden knowledge.',
   'Let the narration itself become unreliable as the character''s grip loosens. Sentences that start and don''t finish. A memory that intrudes in the wrong place. The GM voice momentarily uncertain of what it just described. Use sparingly — once per act maximum. The prose style is the symptom.',
   '{crisis}',
   '{emotional}'),

  ('SHADOW_SELF',
   'The Shadow Self Surfaces',
   'Jekyll & Hyde',
   'Moral dilemma scenes, oath crisis moments, when a character acts against their stated values.',
   'Name the thing the character wants to do that they would not admit to wanting. Show it as a physical pull — toward the door, away from the ally, toward the easier cruelty. Let them feel the relief of the wrong choice before they make it. This is where the oath system has its weight.',
   '{crisis}',
   '{moral_dilemma}'),

  ('NAMED_DEATH',
   'The Named Death',
   'The Iliad',
   'Any NPC death. Any player character near-death. Combat aftermath.',
   'Give every death a name, a face, and one specific detail that makes them human. The soldier who was humming. The enemy whose armor was repaired three times. Do not let anyone die as a number. The weight of violence is measured in the specificity of what is lost.',
   '{confrontation}',
   '{combat,injury}'),

  ('SLOW_CONSEQUENCE',
   'The Slow Consequence',
   'Anna Karenina',
   'Acts 2 and 3 — when early choices are finally paying their debt. Aftermath scenes.',
   'Show how the consequence of an early choice has been quietly accumulating. Reference the specific choice by name. Make the player feel the long tail — not a sudden punishment but a pressure that has been building since turn X. Consequences arrive slowly, then all at once.',
   '{aftermath}',
   '{injury,emotional}'),

  ('COST_OF_BECOMING',
   'The Cost of Becoming',
   'The Count of Monte Cristo / The Odyssey',
   'Oath transformation scenes, act transitions, long-running character arcs.',
   'When a character gains power or crosses a threshold, name explicitly what they are leaving behind. Not what they gain — what they can no longer be. The person who could have laughed at this. The softness that the new version doesn''t have room for. Power is always a trade.',
   '{oath,aftermath}',
   '{emotional}'),

  ('ARISTEIA',
   'The Aristeia',
   'The Iliad',
   'Combat climax — when a character is at peak power, critting, turning the tide.',
   'Give the moment of peak power its full weight. Describe it from the enemy''s perspective for one sentence — what it looks like to be on the receiving end of this. Then describe the physical cost in the same breath. The aristeia is always brief and always leaves a mark. Glory and exhaustion occupy the same moment.',
   '{confrontation}',
   '{combat}'),

  ('INTERIOR_CONTRADICTION',
   'The Interior Contradiction',
   'Crime & Punishment / Hamlet',
   'Decision points. Any beat where a character must act against their instinct or desire.',
   'Let the character''s internal logic be visible and wrong simultaneously. They are reasoning their way to the decision they have already made. Show the argument they are making to themselves — make it almost convincing — then show the one thing they are not examining. The reader sees the blind spot. The character does not.',
   '{rising_tension,crisis}',
   '{moral_dilemma,emotional}'),

  ('MASK_FITS_TOO_WELL',
   'The Mask That Fits Too Well',
   'The Count of Monte Cristo',
   'NPC dialogue. Long-running disguise or political intrigue. Characters with hidden agendas.',
   'When a character performs a role long enough, they begin to become it. An NPC who has pretended to be loyal finds themselves actually hesitating before betrayal. Show the moment a mask surprises its wearer. This creates depth in NPCs without requiring backstory exposition.',
   '{}',
   '{npc_dialogue}'),

  ('PARALYSIS_AS_CHOICE',
   'Paralysis as Active Choice',
   'Hamlet',
   'Crisis points. Moral dilemmas. When a character fails to act and the situation worsens.',
   'Do not treat inaction as absence of story. Write what not-choosing costs in real time — what passes, what closes, what the character watches happen. Paralysis is its own kind of motion. Make the player feel the window closing as their character stands in it.',
   '{crisis}',
   '{moral_dilemma}'),

  ('GUIDE_WITH_SCARS',
   'The Guide Who Has Been Through It',
   'The Divine Comedy',
   'NPC companions. Mentor figures. Any NPC with deep knowledge of the current danger.',
   'The guide''s authority comes from their scars, not their wisdom. They know what is coming because they survived the last version of it. Let them be specific about what they''ve seen. Their warnings are not exposition — they are testimony. This gives NPCs weight without requiring the player to trust them.',
   '{discovery}',
   '{npc_dialogue,exploration,revelation}'),

  ('PUNISHMENT_MIRRORS_SIN',
   'The Punishment Mirrors the Sin',
   'The Divine Comedy / Macbeth',
   'Consequence scenes. Villain reveals. World-building moments about how the magic system punishes corruption.',
   'When the world punishes a character, make the punishment rhyme with the crime. The tyrant who silenced others loses their own voice. The oath-breaker''s investiture turns against the thing they swore to protect. The shape of consequence should feel inevitable in retrospect, even if it was not predictable in advance.',
   '{crisis,oath}',
   '{revelation}'),

  ('UNCROSSABLE_PAST',
   'The Uncrossable Past',
   'Wuthering Heights / Crime & Punishment',
   'When characters try to undo, hide, or outrun a prior choice. Haunting. Old wounds.',
   'The past is not backstory — it is alive in the present scene. Let it intrude specifically: a smell that brings back a memory at the wrong moment, a gesture that echoes a dead person''s. The character who buried something finds it has been growing. Do not explain it. Let it surface in behavior.',
   '{discovery,aftermath}',
   '{emotional,exploration}'),

  ('BOAST_AND_RECKONING',
   'The Boast and the Reckoning',
   'Beowulf',
   'Before major battles or confrontations. Act-opening declarations. Oath moments.',
   'Let the character declare what they will do before they do it. The boast is not arrogance — it is a contract with fate. Then let the reckoning be specific about which part of the boast was kept and which part cost. The gap between what was promised and what was possible is where character lives.',
   '{opening,confrontation,oath}',
   '{combat}'),

  ('TEMPTATION_AS_ENEMY',
   'Temptation as the Real Enemy',
   'The Odyssey',
   'Any scene with an easy out, a corrupting offer, or a choice that serves the character''s immediate desire at long-term cost.',
   'The monster is rarely the real test. What the character wants is the test. Name the temptation specifically — the rest, the comfort, the revenge that would feel good — before the choice arrives. Make it genuinely attractive. The player should feel the pull. The heroism is in feeling it and choosing anyway.',
   '{rising_tension}',
   '{moral_dilemma}'),

  ('SINCERE_EXCHANGE',
   'The Sincere Exchange',
   'Brothers Karamazov',
   'NPC dialogue. Pivotal character conversations. Moral dilemma scenes.',
   'Write one exchange per act where two characters actually say what they believe, without strategy or performance. Both characters should leave the exchange changed — even by a degree. This is the hardest scene to write and the one players remember longest. It requires the NPC to have a real position, not just a role.',
   '{aftermath}',
   '{npc_dialogue,emotional}'),

  ('CHARISMATIC_ALMOST_RIGHT',
   'The Charismatic Almost-Right',
   'Treasure Island / Brothers Karamazov',
   'Major antagonist scenes. Faction leaders with opposing philosophies. Morally complex NPCs.',
   'The antagonist''s argument should be almost correct. Give them the best version of their position. Let the player feel the pull of it before they feel the flaw. A villain who is simply wrong is boring. A villain who is right about everything except the one thing that matters is terrifying.',
   '{}',
   '{npc_dialogue,moral_dilemma}')

ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  seed_work = EXCLUDED.seed_work,
  use_when = EXCLUDED.use_when,
  how = EXCLUDED.how,
  phases = EXCLUDED.phases,
  scene_types = EXCLUDED.scene_types;

-- Index for phase/scene lookups (future admin audit tool)
CREATE INDEX IF NOT EXISTS idx_techniques_phases ON narrative_techniques USING GIN (phases);
CREATE INDEX IF NOT EXISTS idx_techniques_scenes ON narrative_techniques USING GIN (scene_types);
