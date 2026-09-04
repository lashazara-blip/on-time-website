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