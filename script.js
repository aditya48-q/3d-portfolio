const revealElements = document.querySelectorAll('.reveal');
const sections = document.querySelectorAll('[data-section]');
const tiltCards = document.querySelectorAll('[data-tilt]');
const parallaxRoot = document.querySelector('[data-parallax-root]');
const parallaxTargets = document.querySelectorAll('[data-parallax]');
const radialCards = document.querySelectorAll('.radial-card');
const skillRows = document.querySelectorAll('.skill-row');
const skillFills = document.querySelectorAll('.skill-fill');
const projectCards = document.querySelectorAll('[data-magnetic]');
const projectButtons = document.querySelectorAll('[data-magnetic-btn]');
const progressBar = document.querySelector('[data-scroll-progress]');
const heroTitle = document.querySelector('.hero-title');
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const spotlight = document.querySelector('[data-spotlight]');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (start, end, alpha) => start + (end - start) * alpha;

const levelFromValue = (value) => {
  if (value >= 82) return 'Advanced';
  if (value >= 72) return 'Proficient';
  return 'Intermediate';
};

const setupSplitHeading = () => {
  const splitTargets = document.querySelectorAll('[data-split]');
  splitTargets.forEach((target) => {
    const text = target.textContent || '';
    const fragment = document.createDocumentFragment();
    target.textContent = '';

    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.className = 'hero-char';
      span.style.setProperty('--char-index', String(index));
      span.textContent = char === ' ' ? '\u00A0' : char;
      fragment.append(span);
    });

    target.append(fragment);
  });
};

const setupRevealStagger = () => {
  sections.forEach((section) => {
    const scopedReveals = section.querySelectorAll('.reveal');
    scopedReveals.forEach((el, idx) => {
      if (!prefersReducedMotion) {
        el.style.transitionDelay = `${Math.min(idx * 80, 300)}ms`;
      }
    });
  });
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.2, rootMargin: '0px 0px -12% 0px' }
);

const sectionSceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    });
  },
  { threshold: 0.38 }
);

const animateCounter = (element, toValue, duration = 1200) => {
  const startTime = performance.now();

  const update = (now) => {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(toValue * eased);
    element.textContent = `${current}%`;

    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
};

const animateRadialCard = (card, withCounter = false) => {
  const value = Number(card.getAttribute('data-value'));
  const progressCircle = card.querySelector('.progress');
  const valueLabel = card.querySelector('.radial-value');
  const radius = Number(progressCircle?.getAttribute('r')) || 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  card.dataset.level = levelFromValue(value);

  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference}`;

    requestAnimationFrame(() => {
      progressCircle.style.strokeDashoffset = `${offset}`;
    });
  }

  if (withCounter && valueLabel) {
    valueLabel.textContent = '0%';
    animateCounter(valueLabel, value, 1300);
  }
};

const setupSkills = () => {
  const radialObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateRadialCard(entry.target, true);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.42 }
  );

  radialCards.forEach((card) => {
    radialObserver.observe(card);

    card.addEventListener('mouseenter', () => {
      animateRadialCard(card, false);
      card.style.transform = 'translateY(-4px) scale(1.025)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  const progressObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const fill = entry.target;
        const value = Number(fill.getAttribute('data-progress'));
        fill.closest('.skill-row')?.setAttribute('data-level', levelFromValue(value));
        requestAnimationFrame(() => {
          fill.style.width = `${value}%`;
          fill.classList.add('is-live');
        });
        observer.unobserve(fill);
      });
    },
    { threshold: 0.5 }
  );

  skillFills.forEach((fill) => progressObserver.observe(fill));

  skillRows.forEach((row) => {
    row.addEventListener('mouseenter', () => {
      row.style.transform = 'translateY(-2px)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.transform = '';
    });
  });
};

const setupTilt = () => {
  if (prefersReducedMotion) return;

  tiltCards.forEach((card) => {
    const state = {
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      hovering: false,
      rafId: null,
    };

    const animate = () => {
      state.currentX = lerp(state.currentX, state.targetX, 0.11);
      state.currentY = lerp(state.currentY, state.targetY, 0.11);

      const isMagnetic = card.hasAttribute('data-magnetic');
      const magX = isMagnetic ? Number(card.dataset.magx || 0) : 0;
      const magY = isMagnetic ? Number(card.dataset.magy || 0) : 0;

      card.style.transform = `translate3d(${magX.toFixed(2)}px, ${magY.toFixed(2)}px, 0) rotateX(${state.currentX.toFixed(
        2
      )}deg) rotateY(${state.currentY.toFixed(2)}deg)`;

      const stillMoving = state.hovering || Math.abs(state.currentX) > 0.05 || Math.abs(state.currentY) > 0.05;
      if (stillMoving) {
        state.rafId = requestAnimationFrame(animate);
      } else {
        state.rafId = null;
        card.style.transform = `translate3d(${magX.toFixed(2)}px, ${magY.toFixed(2)}px, 0)`;
      }
    };

    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      state.targetY = clamp((x - 0.5) * 9, -4.5, 4.5);
      state.targetX = clamp((0.5 - y) * 8, -4, 4);
      state.hovering = true;
      if (!state.rafId) state.rafId = requestAnimationFrame(animate);
    });

    card.addEventListener('mouseleave', () => {
      state.targetX = 0;
      state.targetY = 0;
      state.hovering = false;
      if (!state.rafId) state.rafId = requestAnimationFrame(animate);
    });
  });
};

const setupMagneticCards = () => {
  if (prefersReducedMotion) return;

  projectCards.forEach((card) => {
    card.dataset.magx = '0';
    card.dataset.magy = '0';

    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;
      const normX = (relX / rect.width - 0.5) * 2;
      const normY = (relY / rect.height - 0.5) * 2;

      const pullX = clamp(normX * 6, -6, 6);
      const pullY = clamp(normY * 6, -6, 6);

      card.dataset.magx = pullX.toFixed(2);
      card.dataset.magy = pullY.toFixed(2);
      card.style.setProperty('--mag-x', `${pullX.toFixed(2)}px`);
      card.style.setProperty('--mag-y', `${pullY.toFixed(2)}px`);
      card.style.setProperty('--mx', `${(relX / rect.width) * 100}%`);
      card.style.setProperty('--my', `${(relY / rect.height) * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.dataset.magx = '0';
      card.dataset.magy = '0';
      card.style.setProperty('--mag-x', '0px');
      card.style.setProperty('--mag-y', '0px');
    });

    card.addEventListener('click', () => {
      card.classList.add('pressed');
      window.setTimeout(() => card.classList.remove('pressed'), 140);
    });
  });
};

const setupProjectButtons = () => {
  if (prefersReducedMotion) return;

  projectButtons.forEach((button) => {
    const state = {
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      hovering: false,
      rafId: null,
    };

    const animateButton = () => {
      state.currentX = lerp(state.currentX, state.targetX, 0.16);
      state.currentY = lerp(state.currentY, state.targetY, 0.16);

      button.style.setProperty('--btn-x', `${state.currentX.toFixed(2)}px`);
      button.style.setProperty('--btn-y', `${state.currentY.toFixed(2)}px`);

      const keepRunning = state.hovering || Math.abs(state.currentX) > 0.08 || Math.abs(state.currentY) > 0.08;
      if (keepRunning) {
        state.rafId = requestAnimationFrame(animateButton);
      } else {
        state.rafId = null;
      }
    };

    button.addEventListener('mousemove', (event) => {
      const rect = button.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;
      const normX = (relX / rect.width - 0.5) * 2;
      const normY = (relY / rect.height - 0.5) * 2;

      state.targetX = clamp(normX * 3.4, -4, 4);
      state.targetY = clamp(normY * 2.8, -3.5, 3.5);
      state.hovering = true;

      button.style.setProperty('--mx', `${(relX / rect.width) * 100}%`);
      button.style.setProperty('--my', `${(relY / rect.height) * 100}%`);

      if (!state.rafId) state.rafId = requestAnimationFrame(animateButton);
    });

    button.addEventListener('mouseleave', () => {
      state.targetX = 0;
      state.targetY = 0;
      state.hovering = false;
      button.style.setProperty('--mx', '50%');
      button.style.setProperty('--my', '50%');
      if (!state.rafId) state.rafId = requestAnimationFrame(animateButton);
    });

    button.addEventListener('pointerdown', () => {
      button.classList.add('is-down');
    });

    const releaseButton = () => {
      button.classList.remove('is-down');
    };

    button.addEventListener('pointerup', releaseButton);
    button.addEventListener('pointerleave', releaseButton);

    button.addEventListener('click', (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'project-btn-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.append(ripple);

      button.classList.add('launching');
      window.setTimeout(() => {
        ripple.remove();
        button.classList.remove('launching');
      }, 620);
    });
  });
};

const setupParallax = () => {
  if (prefersReducedMotion || !parallaxRoot) return;

  const state = {
    pointerX: 0,
    pointerY: 0,
    currentX: 0,
    currentY: 0,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    ringX: window.innerWidth / 2,
    ringY: window.innerHeight / 2,
    running: false,
  };

  const loop = () => {
    state.currentX = lerp(state.currentX, state.pointerX, 0.08);
    state.currentY = lerp(state.currentY, state.pointerY, 0.08);

    parallaxTargets.forEach((el) => {
      const depth = Number(el.getAttribute('data-parallax')) || 4;
      const intensity = depth * 0.22;
      el.style.transform = `translate3d(${(-state.currentX * intensity).toFixed(2)}px, ${(-state.currentY * intensity).toFixed(
        2
      )}px, ${Math.min(depth, 12)}px)`;
    });

    if (heroTitle) {
      heroTitle.style.transform = `translate3d(${(state.currentX * 7).toFixed(2)}px, ${(state.currentY * 5).toFixed(2)}px, 0)`;
    }

    if (spotlight) {
      const spotX = 50 + state.currentX * 32;
      const spotY = 50 + state.currentY * 32;
      document.documentElement.style.setProperty('--spot-x', `${spotX.toFixed(2)}%`);
      document.documentElement.style.setProperty('--spot-y', `${spotY.toFixed(2)}%`);
    }

    if (cursorDot && cursorRing && isFinePointer) {
      state.ringX = lerp(state.ringX, state.cursorX, 0.18);
      state.ringY = lerp(state.ringY, state.cursorY, 0.18);
      cursorDot.style.transform = `translate(${state.cursorX.toFixed(2)}px, ${state.cursorY.toFixed(2)}px) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate(${state.ringX.toFixed(2)}px, ${state.ringY.toFixed(2)}px) translate(-50%, -50%)`;
    }

    if (
      Math.abs(state.currentX - state.pointerX) > 0.003 ||
      Math.abs(state.currentY - state.pointerY) > 0.003 ||
      Math.abs(state.ringX - state.cursorX) > 0.15 ||
      Math.abs(state.ringY - state.cursorY) > 0.15
    ) {
      requestAnimationFrame(loop);
    } else {
      state.running = false;
    }
  };

  const wakeLoop = () => {
    if (!state.running) {
      state.running = true;
      requestAnimationFrame(loop);
    }
  };

  parallaxRoot.addEventListener('mousemove', (event) => {
    state.pointerX = event.clientX / window.innerWidth - 0.5;
    state.pointerY = event.clientY / window.innerHeight - 0.5;
    state.cursorX = event.clientX;
    state.cursorY = event.clientY;
    wakeLoop();
  });

  parallaxRoot.addEventListener('mouseleave', () => {
    state.pointerX = 0;
    state.pointerY = 0;
    wakeLoop();
  });
};

const setupCustomCursorStates = () => {
  if (!isFinePointer || !cursorDot || !cursorRing) return;

  const cardLike = document.querySelectorAll('.project-card, .depth-card, .radial-card');
  const projectCtas = document.querySelectorAll('.project-btn');
  const links = document.querySelectorAll('a, button');

  cardLike.forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover-card'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover-card'));
  });

  links.forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover-link'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover-link'));
  });

  projectCtas.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.remove('cursor-hover-link');
      document.body.classList.add('cursor-hover-button');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover-button');
    });
  });
};

const setupScrollStory = () => {
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = `${progress.toFixed(2)}%`;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      const shift = clamp(centerOffset * -0.025, -16, 16);
      const container = section.querySelector('.container');
      if (container) {
        container.style.setProperty('--scene-shift', `${shift.toFixed(2)}px`);
      }
    });
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
};

const setupContactForm = () => {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const labels = form.querySelectorAll('label');
  labels.forEach((label) => {
    const input = label.querySelector('input, textarea');
    if (!input) return;

    const syncState = () => {
      label.classList.toggle('has-value', input.value.trim().length > 0);
    };

    input.addEventListener('input', syncState);
    syncState();
  });

  const submitButton = form.querySelector('button');

  submitButton?.addEventListener('click', (event) => {
    const rect = submitButton.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    submitButton.append(ripple);
    window.setTimeout(() => ripple.remove(), 620);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    const feedback = form.querySelector('[data-form-feedback]');
    if (!button) return;

    const idleLabel = 'Send';
    button.textContent = 'Sending...';
    button.disabled = true;
    if (feedback) feedback.textContent = 'Creating a polished response...';

    window.setTimeout(() => {
      button.textContent = 'Sent';
      if (feedback) feedback.textContent = 'Thanks. Your message has been recorded successfully.';

      window.setTimeout(() => {
        form.reset();
        labels.forEach((label) => label.classList.remove('has-value'));
        button.textContent = idleLabel;
        button.disabled = false;
        if (feedback) feedback.textContent = '';
      }, 1100);
    }, 950);
  });
};

const setupGlobalMicroInteractions = () => {
  const pressables = document.querySelectorAll('.btn, .project-card, .depth-card, .project-btn');

  pressables.forEach((el) => {
    el.addEventListener('pointerdown', () => el.classList.add('is-pressed'));
    el.addEventListener('pointerup', () => el.classList.remove('is-pressed'));
    el.addEventListener('pointerleave', () => el.classList.remove('is-pressed'));
  });
};

setupSplitHeading();
setupRevealStagger();
setupTilt();
setupMagneticCards();
setupProjectButtons();
setupParallax();
setupCustomCursorStates();
setupSkills();
setupScrollStory();
setupContactForm();
setupGlobalMicroInteractions();

revealElements.forEach((el) => revealObserver.observe(el));
sections.forEach((section) => sectionSceneObserver.observe(section));

window.setTimeout(() => {
  document.body.classList.add('loaded');
}, prefersReducedMotion ? 30 : 120);
