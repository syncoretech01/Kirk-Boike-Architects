import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* Site plan parallax: procedural contour lines plus two photos moving at different depths. */
export function initStudio({ reduced = false } = {}) {
  const section = document.getElementById('studio');
  const svg = document.getElementById('studio-contours');
  const W = 1600, H = 1200;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const cx = W * 0.72, cy = H * 0.62;
  let d = '';
  for (let k = 1; k <= 16; k++) {
    const base = 70 + k * 58;
    const n = 140;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = base * (1 + 0.13 * Math.sin(3 * a + k * 0.6) + 0.07 * Math.sin(7 * a - k * 1.1) + 0.035 * Math.sin(13 * a + k * 0.3));
      const x = cx + Math.cos(a) * r * 1.25, y = cy + Math.sin(a) * r * 0.85;
      s += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += s + 'Z';
  }
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);

  if (reduced) return;
  const photos = section.querySelectorAll('.studio__photo');
  gsap.to(svg, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
  photos.forEach((p) => {
    const depth = Number(p.dataset.depth || 0.4);
    gsap.fromTo(p, { y: 220 * depth }, { y: -220 * depth, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(p.querySelector('img'), { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // draw the contours in as the section enters
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  ScrollTrigger.create({
    trigger: section, start: 'top 80%', once: true,
    onEnter: () => gsap.to(path, { strokeDashoffset: 0, duration: 3.5, ease: 'power2.out' }),
  });
}
