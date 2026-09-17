import { gsap } from 'gsap';
import { drawEdges } from './edges.js';

/* Structural x-ray: a lens follows the pointer and reveals the line drawing under the photo. */
export function initXray({ reduced = false } = {}) {
  const media = document.getElementById('xray-media');
  const img = media.querySelector('.xray__photo');
  const canvas = document.getElementById('xray-lines');
  const lens = document.getElementById('xray-lens');
  drawEdges(img, canvas, { bg: [244, 245, 243], line: [30, 79, 163], lo: 30, hi: 130 });

  const s = { x: 50, y: 50, r: 0 };
  const tx = { x: 50, y: 50, r: 0 };
  const apply = () => {
    canvas.style.setProperty('--x', `${s.x}%`);
    canvas.style.setProperty('--y', `${s.y}%`);
    canvas.style.setProperty('--r', `${s.r}px`);
    lens.style.left = `${s.x}%`; lens.style.top = `${s.y}%`;
    lens.style.width = lens.style.height = `${s.r * 2}px`;
    lens.style.opacity = s.r > 2 ? '1' : '0';
  };
  gsap.ticker.add(() => {
    s.x += (tx.x - s.x) * 0.14; s.y += (tx.y - s.y) * 0.14; s.r += (tx.r - s.r) * 0.12;
    apply();
  });
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  media.addEventListener('pointermove', (e) => {
    const r = media.getBoundingClientRect();
    tx.x = ((e.clientX - r.left) / r.width) * 100;
    tx.y = ((e.clientY - r.top) / r.height) * 100;
    tx.r = Math.min(r.width, r.height) * 0.26;
  });
  media.addEventListener('pointerleave', () => { tx.r = 0; });
  if (coarse || reduced) {
    // touch: the lens sweeps on its own when the image is in view
    const sweep = gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { ease: 'sine.inOut' } })
      .to(tx, { x: 78, y: 40, duration: 4 })
      .to(tx, { x: 30, y: 65, duration: 4 })
      .to(tx, { x: 60, y: 30, duration: 4 });
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { const r = media.getBoundingClientRect(); tx.r = Math.min(r.width, r.height) * 0.26; sweep.play(); }
      else { tx.r = 0; sweep.pause(); }
    }, { threshold: 0.4 });
    io.observe(media);
  }
}
