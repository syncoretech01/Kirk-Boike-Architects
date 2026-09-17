import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { drawEdges } from './edges.js';

/* Drawing to render: scroll wipes the line drawing off to reveal the photograph. */
export function initRender({ reduced = false } = {}) {
  const pin = document.querySelector('.render__pin');
  const img = document.getElementById('render-photo');
  const canvas = document.getElementById('render-lines');
  const scan = document.getElementById('render-scan');
  const copy = document.querySelector('.render__copy');
  drawEdges(img, canvas, { bg: [15, 43, 90], line: [244, 245, 243], lo: 34, hi: 140 });

  const st = { p: -6 };
  canvas.style.setProperty('--p', '-6%');
  gsap.set(copy, { opacity: 0, y: 30 });

  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: '+=180%',
    pin: true,
    scrub: reduced ? false : 0.5,
    anticipatePin: 1,
    onUpdate: (self) => {
      // hold the drawing for the first fifth, then wipe
      const t = Math.max(0, Math.min(1, (self.progress - 0.18) / 0.62));
      st.p = -6 + t * 112;
      canvas.style.setProperty('--p', `${st.p}%`);
      const r = pin.getBoundingClientRect();
      scan.style.left = `${Math.max(0, Math.min(1, st.p / 100)) * r.width}px`;
      scan.style.opacity = t > 0.01 && t < 0.99 ? '1' : '0';
      gsap.to(copy, { opacity: self.progress > 0.55 ? 1 : 0, y: self.progress > 0.55 ? 0 : 30, duration: 0.8, ease: 'expo.out', overwrite: 'auto' });
      gsap.set(img, { scale: 1.06 - t * 0.06 });
    },
  });
}
