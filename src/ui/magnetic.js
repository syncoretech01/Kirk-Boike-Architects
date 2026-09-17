import { animate, press } from 'motion';

/* Magnetic buttons: pull toward the pointer, spring back on leave. Press squashes slightly. */
export function initMagnetic({ reduced = false } = {}) {
  const fine = window.matchMedia('(pointer: fine)').matches;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    press(el, () => {
      animate(el, { scale: 0.97 }, { duration: 0.15 });
      return () => animate(el, { scale: 1 }, { type: 'spring', stiffness: 400, damping: 18 });
    });
    if (!fine || reduced) return;
    const strength = 0.32;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      animate(el, { x: dx * strength, y: dy * strength }, { type: 'spring', stiffness: 260, damping: 22, mass: 0.6 });
    });
    el.addEventListener('pointerleave', () => {
      animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 220, damping: 16 });
    });
  });
}
