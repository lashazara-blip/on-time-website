// On-Time Logistics Company — small helper scripts.
// Kept intentionally simple: this site is mostly static content,
// so JavaScript is only used for tiny conveniences like the lines below.

// Keep the footer's copyright year current automatically.
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Service card cursor tilt ----------
// Per Lasha: the 8 service boxes should tilt slightly toward the cursor
// as it moves over them (like covers.ge's product cards). This tracks
// the mouse position inside each .service-card, works out how far off
// center it is (-0.5..0.5 on each axis), and writes that as a small
// rotation into the --rx/--ry CSS custom properties that .service-card's
// transform (see style.css) already reads. Skipped entirely on touch
// devices, since there's no hover/cursor to track there — the CSS
// transform simply stays at its 0deg default.
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const MAX_TILT_DEG = 7;

  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      card.classList.add('is-tilting');
      card.style.setProperty('--rx', `${px * MAX_TILT_DEG * 2}deg`);
      card.style.setProperty('--ry', `${py * -MAX_TILT_DEG * 2}deg`);
    });

    card.addEventListener('mouseleave', () => {
      // Drop back to a slower transition (see .service-card.is-tilting
      // in style.css) so the card eases back flat instead of snapping.
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

// ---------- Scroll-reveal ----------
// New per Lasha: give the page a bit more life as you scroll — the big
// section boxes (Services, How It Works, Calculator, Contact, Partners
// intro) fade and rise into place the first time they enter the viewport,
// instead of just appearing. Marked up in the HTML with a plain .reveal
// class (see style.css for the opacity/transform values); this just
// toggles .is-visible once per element via IntersectionObserver, then
// stops watching it, so it never re-hides on scrolling back up. Under
// prefers-reduced-motion the CSS itself shows everything at full opacity
// already, so this is harmless (if pointless) to still run in that case.
(function () {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
})();

// ---------- Quick-nav dock active-section highlight ----------
// Per Lasha: the floating bottom-center dock should light up whichever
// section is currently on screen, not just react to clicks. Watches
// #services/#process/#calculator/#contact with an IntersectionObserver
// and toggles .is-active on the matching dock icon; falls back to the
// "home" icon near the very top of the page, before #services comes into
// view. (The About section/nav link/dock icon were removed per Lasha —
// the text was redundant with the Hero copy above it. "How It Works" was
// added later as a dock-only icon, once that section existed.)
(function () {
  const links = Array.from(document.querySelectorAll('.quick-nav-link'));
  if (!links.length) return;

  const sectionIds = ['services', 'process', 'calculator', 'contact'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  function setActive(id) {
    links.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.section === id);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (mostVisible) {
        setActive(mostVisible.target.id);
      } else if (window.scrollY < sections[0].offsetTop - 200) {
        setActive('home');
      }
    },
    { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  sections.forEach((section) => observer.observe(section));

  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY < 80) setActive('home');
    },
    { passive: true }
  );
})();

// ---------- Quick-nav dock avoids the hero's own dots ----------
// Per Lasha: the dock and the hero photo slideshow's own dots
// (.hero-dots) both sit at "bottom: 20px" — one relative to the
// viewport, one relative to the hero — so on shorter/laptop viewports,
// right at page load, they visually landed right on top of each other.
// This used to hide the dock entirely while .hero-dots was on screen —
// per Lasha, the dock should always stay visible instead. Fix: while
// .hero-dots is anywhere on screen, measure its real position on every
// scroll/resize and push the dock up (via an inline "bottom" style)
// just far enough to clear it; the moment that's no longer needed (dock
// scrolled past the hero, or a tall viewport where there was never a
// conflict), the inline style is removed and the dock settles back to
// its normal fixed offset from style.css.
(function () {
  const dock = document.querySelector('.quick-nav');
  const heroDots = document.querySelector('.hero-dots');
  if (!dock || !heroDots) return;

  const GAP = 14; // minimum breathing room to keep between the dock and the dots

  let raised = false;
  let ticking = false;

  // Reads .quick-nav's own resting "bottom" straight from style.css
  // (momentarily clearing any inline override to ask) rather than
  // hardcoding 20px/14px here — stays correct even if that value ever
  // changes at some breakpoint, and this only ever runs a few times a
  // frame at most.
  function readDefaultBottom() {
    const prev = dock.style.bottom;
    dock.style.bottom = '';
    const value = parseFloat(getComputedStyle(dock).bottom) || 0;
    dock.style.bottom = prev;
    return value;
  }

  function update() {
    ticking = false;
    if (!raised) return;
    const dotsRect = heroDots.getBoundingClientRect();
    const dotsTopFromBottom = window.innerHeight - dotsRect.top;
    const dotsBottomFromBottom = window.innerHeight - dotsRect.bottom;
    const base = readDefaultBottom();
    const dockHeight = dock.offsetHeight;
    // Only step in when the dock's own normal spot would actually come
    // within GAP of the dots — most of the time (dots are visible but
    // sitting well above the dock's resting spot, e.g. any reasonably
    // tall window) this leaves the dock exactly where it always is.
    const gapAtRest = dotsBottomFromBottom - (base + dockHeight);
    dock.style.bottom = gapAtRest < GAP ? dotsTopFromBottom + GAP + 'px' : '';
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  const dockPositionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        raised = entry.isIntersecting;
        if (raised) {
          window.addEventListener('scroll', requestUpdate, { passive: true });
          window.addEventListener('resize', requestUpdate);
          requestUpdate();
        } else {
          window.removeEventListener('scroll', requestUpdate);
          window.removeEventListener('resize', requestUpdate);
          dock.style.bottom = '';
        }
      });
    },
    { threshold: 0 }
  );

  dockPositionObserver.observe(heroDots);
})();

// ---------- Hero photo carousel ----------
// Per Lasha, inspired by weforward.ge's hero: the truck photo is now an
// auto-advancing slideshow, sliding right to left, with one white dot
// per slide at the bottom (see .hero-media/.hero-slide/.hero-dots in
// style.css). Only ever one slide is mid-transition: the incoming slide
// starts stacked off-screen to the right and animates to center, while
// the slide it replaces animates off to the left. Every other slide
// just sits off-screen to the right, reset there WITHOUT a transition
// (see the `instant` flag below) so it never visibly sweeps across the
// screen on its way back into the waiting position. Advances every 5s,
// pauses while the mouse is over the hero, and — like the partners
// marquee — doesn't autoplay at all under prefers-reduced-motion (dots
// stay clickable either way).
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll('.hero-slide'));
  const dots = Array.from(hero.querySelectorAll('.hero-dot'));
  if (slides.length < 2) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ADVANCE_MS = 5000;

  let current = Math.max(slides.findIndex((slide) => slide.classList.contains('is-active')), 0);
  let timer = null;

  function place(slide, percent, instant) {
    if (instant) {
      slide.style.transition = 'none';
      slide.style.transform = `translateX(${percent}%)`;
      // Force layout so the 'none' transition actually applies before
      // we hand control back to the CSS transition below.
      void slide.offsetWidth;
      slide.style.transition = '';
    } else {
      slide.style.transition = '';
      slide.style.transform = `translateX(${percent}%)`;
    }
  }

  function goTo(index, instant) {
    const previous = current;
    current = index;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      if (i === current) {
        place(slide, 0, instant);
        slide.style.zIndex = 2;
      } else if (i === previous) {
        place(slide, -100, instant);
        slide.style.zIndex = 1;
      } else {
        place(slide, 100, true);
        slide.style.zIndex = 0;
      }
    });

    dots.forEach((dot, i) => {
      const isActive = i === current;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', String(isActive));
    });
  }

  function next() {
    goTo((current + 1) % slides.length, false);
  }

  function start() {
    if (prefersReducedMotion) return;
    stop();
    timer = setInterval(next, ADVANCE_MS);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // Sync everything to its correct starting position with no animation.
  goTo(current, true);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (i === current) return;
      goTo(i, prefersReducedMotion);
      start();
    });
  });

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);

  start();
})();

// ---------- Hero stat count-up ----------
// Per Lasha, inspired by weforward.ge's animated stats: the two numeric
// hero stats ("30" and "100%") count up from 0 the first time they
// scroll into view, instead of just appearing. "24/7" has no
// data-count-to attribute (it isn't a number to count up to), so it's
// simply skipped here and stays static in the HTML. Respects
// prefers-reduced-motion by jumping straight to the final value.
(function () {
  const countEls = document.querySelectorAll('[data-count-to]');
  if (!countEls.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion || Number.isNaN(target)) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic — fast start, gentle settle, instead of a linear
      // (mechanical-looking) count.
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  countEls.forEach((el) => countObserver.observe(el));
})();

// ---------- Cargo volume calculator ----------
// Per Lasha: volume/weight only, deliberately NOT a price calculator —
// freight rates change 1-2x a week, so a price tool would need constant
// upkeep, while cubic volume is a fixed geometry formula that never goes
// stale. Packing Type presets just autofill Length/Width for common
// pallet sizes (Custom leaves them blank). Everything below runs
// entirely in the browser — no server, no data leaves the page.
(function () {
  const form = document.getElementById('cargoCalculatorForm');
  if (!form) return;

  const packingTypeSelect = document.getElementById('calcPackingType');
  const lengthInput = document.getElementById('calcLength');
  const widthInput = document.getElementById('calcWidth');
  const heightInput = document.getElementById('calcHeight');
  const quantityInput = document.getElementById('calcQuantity');
  const weightInput = document.getElementById('calcWeight');
  const resultsBox = document.getElementById('calculatorResults');
  const resultUnitVolume = document.getElementById('resultUnitVolume');
  const resultTotalVolume = document.getElementById('resultTotalVolume');
  const resultTotalWeight = document.getElementById('resultTotalWeight');
  const resetBtn = document.getElementById('calcResetBtn');
  // Placeholder copy in the summary card — shown until the first Calculate,
  // swapped for the numbers, and brought back on Reset.
  const placeholder = document.getElementById('calculatorPlaceholder');
  // The 3 reassurance points under the placeholder (new per Lasha, filling
  // space that used to sit empty) — hidden/shown in lockstep with it.
  const trustPoints = document.getElementById('calculatorTrustPoints');

  packingTypeSelect.addEventListener('change', () => {
    const selected = packingTypeSelect.selectedOptions[0];
    if (selected.dataset.length && selected.dataset.width) {
      lengthInput.value = selected.dataset.length;
      widthInput.value = selected.dataset.width;
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const quantity = parseFloat(quantityInput.value) || 0;
    const length = parseFloat(lengthInput.value) || 0;
    const width = parseFloat(widthInput.value) || 0;
    const height = parseFloat(heightInput.value) || 0;
    const weightPerUnit = parseFloat(weightInput.value) || 0;

    // cm³ → m³ (divide by 100³)
    const unitVolume = (length * width * height) / 1000000;
    const totalVolume = unitVolume * quantity;
    const totalWeight = weightPerUnit * quantity;

    resultUnitVolume.textContent = unitVolume.toFixed(3);
    resultTotalVolume.textContent = totalVolume.toFixed(3);
    resultTotalWeight.textContent = totalWeight.toFixed(1);

    resultsBox.hidden = false;
    if (placeholder) placeholder.hidden = true;
    if (trustPoints) trustPoints.hidden = true;
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    resultsBox.hidden = true;
    if (placeholder) placeholder.hidden = false;
    if (trustPoints) trustPoints.hidden = false;
  });
})();

// Contact form — wired to Lasha's Formspree endpoint (see the form's
// "action" in index.html). Submits in the background via fetch() instead
// of a normal HTML form POST so the page never navigates away/reloads —
// the visitor just sees a "thanks" message appear in place, right under
// the button they pressed.
(function () {
  const contactForm = document.getElementById('contactForm');
  const submitBtn = contactForm ? contactForm.querySelector('.contact-form-submit') : null;
  const successMsg = document.getElementById('contactFormSuccess');
  const errorMsg = document.getElementById('contactFormError');
  if (!contactForm || !submitBtn) return;

  const submitLabel = submitBtn.innerHTML;

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (successMsg) successMsg.hidden = true;
    if (errorMsg) errorMsg.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (response.ok) {
          contactForm.reset();
          if (successMsg) successMsg.hidden = false;
        } else if (errorMsg) {
          errorMsg.hidden = false;
        }
      })
      .catch(() => {
        if (errorMsg) errorMsg.hidden = false;
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitLabel;
      });
  });
})();
