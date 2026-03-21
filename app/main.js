/**
 * ============================================================
 * app/main.js — Application Bootstrap + GSAP Animation System
 * Stormlight Chronicles
 * ============================================================
 * Responsibilities:
 *   1. Initialize Lenis smooth scroll
 *   2. Register GSAP plugins
 *   3. Set up screen transition system (with blur + depth)
 *   4. Screen-specific entrance animations
 *   5. Combat feedback: float text, shake, heal, crit, damage flash
 *   6. Chronicle card 3-D tilt parallax
 *   7. Global button micro-feedback (press scale)
 *   8. Idle glyph animations
 *   9. Toast notification system
 *  10. Boot sequence
 * ============================================================
 */

// ── 1. LENIS SMOOTH SCROLL ────────────────────────────────────
let lenis;
window.addEventListener('load', () => {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    function rafLenis(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLenis);
    }
    requestAnimationFrame(rafLenis);
  }
});

// ── 2. GSAP PLUGIN REGISTRATION ──────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── 3. SCREEN TRANSITION SYSTEM ──────────────────────────────
// Patches showScreen() so every screen change gets:
//   • fade + slight upward slide
//   • subtle blur-in (depth reveal)
//   • screen-specific entrance sequence
window.addEventListener('load', () => {
  if (!window.showScreen) return;

  const _orig = window.showScreen;
  window.showScreen = function(id) {
    _orig(id);
    const el = document.getElementById('s-' + id);
    if (!el) return;

    // Kill any in-progress animation on this element
    gsap.killTweensOf(el);

    // Entrance animation — blur + fade + lift (cinematic depth reveal)
    gsap.fromTo(el,
      { opacity: 0, y: 14, filter: 'blur(5px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.42, ease: 'power2.out', clearProps: 'all' }
    );

    // Screen-specific entrance sequences
    switch (id) {
      case 'campaign': _animateCampaignScreen(); break;
      case 'title':    _animateTitleScreen();    break;
      case 'create':   _animateCreateScreen();   break;
      case 'lobby':    _animateLobbyScreen();    break;
      case 'game':     _animateGameScreen();     break;
      case 'combat':   _animateCombatScreen();   break;
    }
  };

  // ── Global button micro-feedback ──────────────────────────
  // Slight compress on mousedown, spring back on mouseup
  const INTERACTIVE = '.btn, .btn-act, .btn-continue, .btn-gold, .achoice, .camp-card, .type-card, .ccard, .origin-btn, .resolve-btn';

  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest(INTERACTIVE);
    if (!btn || btn.disabled) return;
    gsap.to(btn, { scale: 0.965, duration: 0.08, ease: 'power2.in', overwrite: 'auto' });
  }, { passive: true });

  document.addEventListener('mouseup', () => {
    document.querySelectorAll(INTERACTIVE).forEach(btn => {
      if (gsap.isTweening(btn)) return;
      gsap.to(btn, { scale: 1, duration: 0.25, ease: 'elastic.out(1.2, 0.5)', overwrite: 'auto' });
    });
  }, { passive: true });
});

// ── 4. SCREEN-SPECIFIC ENTRANCE ANIMATIONS ───────────────────

function _animateCampaignScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('#s-campaign .title-h1',   { opacity: 0, y: 32, filter: 'blur(4px)', duration: 0.75, delay: 0.08 })
    .from('#s-campaign .title-h2',   { opacity: 0, y: 20, duration: 0.5 }, '-=0.42')
    .from('#s-campaign .title-line', { opacity: 0, scaleX: 0, duration: 0.6, transformOrigin: 'center' }, '-=0.32');

  // Idle float on title glyph
  const glyph = document.querySelector('#s-campaign .title-glyph');
  if (glyph) {
    gsap.to(glyph, {
      y: -5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    });
  }

  // Campaign cards stagger in via MutationObserver (rendered async)
  const grid = document.getElementById('camp-grid');
  if (grid) {
    const observer = new MutationObserver(() => {
      const cards = grid.querySelectorAll('.camp-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 26,
          scale: 0.95,
          filter: 'blur(3px)',
          duration: 0.48,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'all',
        });
        observer.disconnect();
      }
    });
    observer.observe(grid, { childList: true });
  }
}

function _animateTitleScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('#s-title .title-glyph', { opacity: 0, scale: 0.75, filter: 'blur(6px)', duration: 0.65, delay: 0.06 })
    .from('#s-title .title-h1',    { opacity: 0, y: 22,  filter: 'blur(3px)', duration: 0.55 }, '-=0.30')
    .from('#s-title .title-h2',    { opacity: 0, y: 16,  duration: 0.42 }, '-=0.28')
    .from('#s-title .title-line',  { opacity: 0, scaleX: 0, duration: 0.50, transformOrigin: 'center' }, '-=0.24')
    .from('#s-title .title-quote', { opacity: 0, y: 12,  duration: 0.42 }, '-=0.20')
    .from('#s-title .psz-wrap',    { opacity: 0, y: 10,  duration: 0.40 }, '-=0.10')
    .from('#s-title .btn',         { opacity: 0, y: 8,   duration: 0.35, stagger: 0.09 }, '-=0.18');

  // Idle float on title glyph
  const glyph = document.querySelector('#s-title .title-glyph');
  if (glyph) {
    gsap.to(glyph, { y: -5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.8 });
  }
}

function _animateCreateScreen() {
  gsap.from('#s-create .create-wrap', {
    opacity: 0, y: 18, filter: 'blur(4px)', duration: 0.44, ease: 'power2.out', delay: 0.06,
  });
  gsap.from('#create-steps .step-dot', {
    opacity: 0, scale: 0, duration: 0.32, stagger: 0.055, ease: 'back.out(2)', delay: 0.18,
  });
}

function _animateLobbyScreen() {
  gsap.from('#s-lobby .lobby-wrap > *', {
    opacity: 0, y: 16, filter: 'blur(2px)', duration: 0.42, stagger: 0.07, ease: 'power2.out', delay: 0.06,
  });
}

function _animateGameScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from('.game-top',       { opacity: 0, y: -10, filter: 'blur(4px)', duration: 0.38, delay: 0.05 })
    .from('.party-strip',    { opacity: 0, y: -8,  duration: 0.32 }, '-=0.18')
    .from('.chronicle-card', { opacity: 0, y: 18,  filter: 'blur(5px)', duration: 0.52 }, '-=0.16')
    .from('.side-panel',     { opacity: 0, x: -12, filter: 'blur(3px)', duration: 0.42, stagger: 0.10 }, '-=0.30');

  // Init chronicle tilt parallax after layout settles
  setTimeout(_initChronicleTilt, 400);
}

function _animateCombatScreen() {
  // ── Dramatic red screen flash on combat entrance ──
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(176,56,40,0.20);pointer-events:none;z-index:9999;';
  document.body.appendChild(flash);
  gsap.to(flash, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => flash.remove(),
  });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.combat-top',       { opacity: 0, y: -14, filter: 'blur(4px)', duration: 0.36, delay: 0.05 })
    .from('.combat-party-col .char-combat-card', {
      opacity: 0, x: -26, filter: 'blur(4px)', duration: 0.48, stagger: 0.09,
    }, '-=0.10')
    .from('.combat-enemy-col .char-combat-card', {
      opacity: 0, x: 26, filter: 'blur(4px)', duration: 0.48, stagger: 0.09,
    }, '-=0.48')
    .from('.combat-narrative', { opacity: 0, y: 14, filter: 'blur(3px)', duration: 0.40 }, '-=0.22');
}

// ── 5. COMBAT FEEDBACK ANIMATIONS ────────────────────────────

/**
 * Float a damage/heal number over a character pip.
 */
window.animateFloatText = function(element, text, isHeal) {
  if (!element) return;
  const float = document.createElement('div');
  float.textContent = text;
  float.style.cssText = `
    position: absolute;
    top: -2px; left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-d);
    font-size: 14px;
    font-weight: 700;
    color: ${isHeal ? 'var(--teal2)' : 'var(--coral2)'};
    pointer-events: none;
    z-index: 100;
    white-space: nowrap;
    text-shadow: 0 0 8px ${isHeal ? 'rgba(29,122,92,0.6)' : 'rgba(212,78,48,0.6)'};
  `;
  element.style.position = 'relative';
  element.appendChild(float);

  gsap.fromTo(float,
    { opacity: 1, y: 0, scale: 1.1 },
    {
      opacity: 0,
      y: -36,
      scale: 0.85,
      duration: 1.0,
      ease: 'power2.out',
      onComplete: () => float.remove(),
    }
  );
};

/**
 * Shake a combat card when taking damage.
 */
window.shakeCombatCard = function(cardEl) {
  if (!cardEl) return;
  gsap.fromTo(cardEl,
    { x: 0 },
    {
      keyframes: { x: [-7, 6, -5, 5, -3, 2, 0] },
      duration: 0.45,
      ease: 'power1.inOut',
      clearProps: 'x',
    }
  );
};

/**
 * Heal shimmer on a combat card.
 */
window.healShimmerCard = function(cardEl) {
  if (!cardEl) return;
  gsap.fromTo(cardEl,
    { boxShadow: '0 0 0 0 rgba(29,122,92,0)' },
    {
      boxShadow: '0 0 0 4px rgba(29,122,92,0.55), 0 0 28px rgba(29,122,92,0.25)',
      duration: 0.32,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: 'boxShadow',
    }
  );
};

/**
 * Critical hit — white-gold burst then fade, combined with shake.
 */
window.animateCritHit = function(cardEl) {
  if (!cardEl) return;
  gsap.timeline()
    .to(cardEl, {
      filter: 'brightness(3.0) saturate(0.15)',
      boxShadow: '0 0 50px rgba(255,248,200,0.65), 0 0 100px rgba(201,168,76,0.3)',
      duration: 0.09,
      ease: 'none',
    })
    .to(cardEl, {
      filter: 'brightness(1) saturate(1)',
      boxShadow: 'none',
      duration: 0.50,
      ease: 'power3.out',
      clearProps: 'filter,boxShadow',
    });
  window.shakeCombatCard(cardEl);
};

/**
 * Full-screen edge-flash for taking damage in combat.
 */
window.animateDamageFlash = function() {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(176,56,40,0.22);pointer-events:none;z-index:9998;';
  document.body.appendChild(flash);
  gsap.fromTo(flash,
    { opacity: 1 },
    { opacity: 0, duration: 0.55, ease: 'power2.out', onComplete: () => flash.remove() }
  );
};

/**
 * Spawn heal particles above a card.
 */
window.animateHealParticles = function(cardEl) {
  if (!cardEl) return;
  for (let i = 0; i < 4; i++) {
    const p = document.createElement('div');
    p.textContent = '✦';
    p.style.cssText = `
      position: absolute;
      font-size: 10px;
      color: var(--teal2);
      pointer-events: none;
      z-index: 50;
      left: ${20 + Math.random() * 60}%;
      top: 20%;
    `;
    cardEl.style.position = 'relative';
    cardEl.appendChild(p);
    gsap.fromTo(p,
      { opacity: 0.85, y: 0, x: (Math.random() - 0.5) * 14 },
      {
        opacity: 0,
        y: -(18 + Math.random() * 16),
        duration: 0.8 + Math.random() * 0.3,
        delay: i * 0.07,
        ease: 'power2.out',
        onComplete: () => p.remove(),
      }
    );
  }
};

// ── 6. CHOICE REVEAL ANIMATION ───────────────────────────────
window.animateChoicesIn = function(container) {
  if (!container) return;
  const choices = container.querySelectorAll('.achoice');
  if (!choices.length) return;
  gsap.from(choices, {
    opacity: 0,
    y: 12,
    scale: 0.96,
    filter: 'blur(2px)',
    duration: 0.34,
    stagger: 0.055,
    ease: 'power2.out',
    clearProps: 'all',
  });
};

// ── 7. STORY TEXT REVEAL ──────────────────────────────────────
window.animateStoryReveal = function(el) {
  if (!el) return;
  gsap.fromTo(el,
    { opacity: 0, y: 10, filter: 'blur(3px)' },
    { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.48, ease: 'power2.out', clearProps: 'all' }
  );
};

// ── 8. CHRONICLE CARD 3-D TILT PARALLAX ──────────────────────
function _initChronicleTilt() {
  const card = document.querySelector('.chronicle-card');
  if (!card || window.innerWidth < 900) return;

  // Remove previous listeners (re-init safe)
  card.onmousemove = null;
  card.onmouseleave = null;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 → 0.5
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;
    gsap.to(card, {
      rotateX: cy * -3.5,
      rotateY: cx * 3.5,
      transformPerspective: 1400,
      duration: 0.55,
      ease: 'power2.out',
    });
  }, { passive: true });

  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out', clearProps: 'rotateX,rotateY' });
  });
}

// Keep old initParallax for legacy calls from ui.js
function initParallax() { _initChronicleTilt(); }

// ── 9. TURN CHANGE ANIMATION ──────────────────────────────────
/**
 * Animate the turn-pill when ownership switches.
 * Call this from ui.js whenever the active turn changes.
 */
window.animateTurnChange = function(pillEl) {
  if (!pillEl) return;
  gsap.fromTo(pillEl,
    { scale: 1.0 },
    { scale: 1.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1,
      onComplete: () => gsap.set(pillEl, { clearProps: 'scale' }) }
  );
};

// ── 10. TOAST NOTIFICATION ────────────────────────────────────
window.showToastGSAP = function(message) {
  const existing = document.querySelector('.sc-toast');
  if (existing) {
    gsap.to(existing, { opacity: 0, y: 8, duration: 0.2, onComplete: () => existing.remove() });
  }

  const toast = document.createElement('div');
  toast.className = 'sc-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px; left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 20px;
    padding: 8px 20px;
    font-family: var(--font-d);
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--text3);
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    backdrop-filter: blur(12px);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  gsap.timeline()
    .to(toast, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    .to(toast, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in', delay: 2.4,
        onComplete: () => toast.remove() });
};

// ── 11. BOOT ──────────────────────────────────────────────────
(async () => {
  applyLang();
  loadVoicePreference();

  // Show campaign screen
  showScreen('campaign');

  // Load campaigns
  try {
    await tok();
    const camps = await listCampaigns();
    renderCampaigns(camps);
    document.getElementById('camp-status').textContent = '';
  } catch (e) {
    document.getElementById('camp-status').textContent = 'Connecting... ' + e.message;
  }

  // Init parallax after first render
  setTimeout(initParallax, 600);
})();
