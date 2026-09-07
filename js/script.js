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
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    resultsBox.hidden = true;
  });
})();