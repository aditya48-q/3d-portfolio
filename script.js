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
const pageTransition = document.querySelector('.page-transition');
const transitionCard = document.querySelector('.transition-card');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;
let isLaunchingProject = false;
let activeTransitionClone = null;

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

  // Enhanced radial card 3D interaction
  radialCards.forEach((card) => {
    radialObserver.observe(card);

    const cardState = {
      currentRotX: 0,
      currentRotY: 0,
      targetRotX: 0,
      targetRotY: 0,
      hovering: false,
      rafId: null,
    };

    const animateCardRotation = () => {
      cardState.currentRotX = lerp(cardState.currentRotX, cardState.targetRotX, 0.12);
      cardState.currentRotY = lerp(cardState.currentRotY, cardState.targetRotY, 0.12);

      if (cardState.hovering) {
        card.style.transform = `
          rotateX(${cardState.currentRotX.toFixed(2)}deg)
          rotateY(${cardState.currentRotY.toFixed(2)}deg)
          translateY(-8px)
          translateZ(50px)
          scale(1.05)
        `;
      }

      const stillMoving =
        cardState.hovering ||
        Math.abs(cardState.currentRotX) > 0.05 ||
        Math.abs(cardState.currentRotY) > 0.05;

      if (stillMoving) {
        cardState.rafId = requestAnimationFrame(animateCardRotation);
      } else {
        cardState.rafId = null;
        if (!cardState.hovering) {
          card.style.transform = '';
        }
      }
    };

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      cardState.targetRotY = clamp(x * 10, -10, 10);
      cardState.targetRotX = clamp(-y * 10, -10, 10);
      cardState.hovering = true;

      if (!cardState.rafId) {
        cardState.rafId = requestAnimationFrame(animateCardRotation);
      }
    });

    card.addEventListener('mouseleave', () => {
      cardState.targetRotX = 0;
      cardState.targetRotY = 0;
      cardState.hovering = false;
      if (!cardState.rafId) {
        cardState.rafId = requestAnimationFrame(animateCardRotation);
      }
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

  // Enhanced skill row cursor tracking for glow effect
  if (!prefersReducedMotion) {
    skillRows.forEach((row) => {
      row.addEventListener('mousemove', (e) => {
        const rect = row.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const glowPos = clamp(x * 100, 0, 100);
        row.style.setProperty('--glow-pos', `${glowPos}%`);
      });

      row.addEventListener('mouseleave', () => {
        row.style.setProperty('--glow-pos', '50%');
      });
    });
  }
};

const setupCardReveal = () => {
  projectCards.forEach((card) => {
    card.addEventListener('click', (event) => {
      // Don't toggle if clicking interactive elements (buttons or links)
      if (event.target.closest('.project-btn') || event.target.closest('.project-link')) return;
      // Don't toggle during page transitions
      if (document.body.classList.contains('transitioning')) return;
      // Toggle reveal on mobile/touch devices
      card.classList.toggle('active');
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
      if (isLaunchingProject && card.classList.contains('launching')) {
        state.rafId = null;
        return;
      }

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
      if (isLaunchingProject) return;
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
      if (isLaunchingProject) return;
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
  projectButtons.forEach((button) => {
    if (prefersReducedMotion) return;

    const state = {
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      hovering: false,
      rafId: null,
    };

    const animateButton = () => {
      if (isLaunchingProject && button.classList.contains('launching')) {
        state.rafId = null;
        return;
      }

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
      if (isLaunchingProject) return;
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
      event.stopPropagation();

      if (isLaunchingProject) {
        event.preventDefault();
        return;
      }

      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'project-btn-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.append(ripple);

      const card = button.closest('.project-card');
      const link = button.getAttribute('href');

      if (!card || !link || !pageTransition || !transitionCard) {
        button.classList.add('launching');
        window.setTimeout(() => {
          ripple.remove();
          button.classList.remove('launching');
        }, 620);
        return;
      }

      event.preventDefault();
      isLaunchingProject = true;
      document.body.classList.add('transition-prep');

      const timing = {
        preLift: 120,
        collapseIn: 300,
        peak: 560,
        settle: 660,
        loading: 710,
        redirect: 820,
      };

      button.classList.add('launching');
      card.classList.add('launching');
      card.style.transform = 'scale(1.06) translateZ(80px) rotateX(5deg)';

      const cardRect = card.getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      const targetX = window.innerWidth / 2 - centerX;
      const targetY = window.innerHeight / 2 - centerY;

      if (activeTransitionClone) {
        activeTransitionClone.remove();
        activeTransitionClone = null;
      }

      const clone = card.cloneNode(true);
      clone.classList.add('transition-clone');
      clone.classList.remove('floating', 'delayed', 'launching');
      const loaderLayer = document.createElement('span');
      loaderLayer.className = 'transition-clone-loader';
      clone.append(loaderLayer);
      clone.style.top = `${cardRect.top}px`;
      clone.style.left = `${cardRect.left}px`;
      clone.style.width = `${cardRect.width}px`;
      clone.style.height = `${cardRect.height}px`;
      clone.style.transform = 'translate3d(0, 0, 0) scale(1) rotateX(8deg) translateZ(0px)';
      clone.style.setProperty('--clone-x', `${targetX.toFixed(2)}px`);
      clone.style.setProperty('--clone-y', `${targetY.toFixed(2)}px`);
      pageTransition.append(clone);
      activeTransitionClone = clone;

      card.style.visibility = 'hidden';

      transitionCard.style.width = `${cardRect.width}px`;
      transitionCard.style.height = `${cardRect.height}px`;
      transitionCard.style.top = `${centerY}px`;
      transitionCard.style.left = `${centerX}px`;
      transitionCard.style.opacity = '0';
      transitionCard.style.setProperty('--card-edge-blur', '0px');
      transitionCard.style.transform = 'translate(-50%, -50%) scale(1) rotateX(16deg) translateZ(0px)';

      window.setTimeout(() => {
        pageTransition.classList.add('active');
        pageTransition.classList.add('shared-active');
        document.body.classList.add('transitioning');
      }, timing.preLift);

      window.setTimeout(() => {
        pageTransition.classList.add('expanding');
        if (activeTransitionClone) {
          activeTransitionClone.style.filter = 'blur(2px)';
        }
      }, timing.collapseIn);

      window.setTimeout(() => {
        pageTransition.classList.add('settled');
        if (activeTransitionClone) {
          activeTransitionClone.style.filter = 'blur(0px)';
        }
      }, timing.settle);

      window.setTimeout(() => {
        pageTransition.classList.add('flash');
      }, timing.peak);

      window.setTimeout(() => {
        pageTransition.classList.add('loading');
      }, timing.loading);

      window.setTimeout(() => {
        ripple.remove();
      }, 620);

      window.setTimeout(() => {
        window.location.href = link;
      }, timing.redirect);

      // Fallback cleanup if navigation is interrupted.
      window.setTimeout(() => {
        if (!isLaunchingProject) return;
        isLaunchingProject = false;
        card.style.visibility = '';
        card.classList.remove('launching');
        button.classList.remove('launching');
        document.body.classList.remove('transition-prep', 'transitioning');
        pageTransition.classList.remove('active', 'shared-active', 'expanding', 'settled', 'flash', 'loading');
        if (activeTransitionClone) {
          activeTransitionClone.remove();
          activeTransitionClone = null;
        }
      }, 1800);
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
      const intensity = depth * 0.36;
      const x = -state.currentX * intensity;
      const y = -state.currentY * intensity;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${(depth * 20).toFixed(2)}px)`;
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
setupCardReveal();
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
