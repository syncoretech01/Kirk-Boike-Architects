import { animate, createDrawable, stagger, createTimeline } from 'animejs';
import { gsap } from 'gsap';

/*
  Blueprint loading screen: the front elevation draws itself line by line
  while the counter runs. Resolves when the drawing is complete.
*/
export function runLoader({ reduced = false } = {}) {
  const loader = document.getElementById('loader');
  const count = document.getElementById('loader-count');
  const lines = createDrawable('#loader .ld');
  const ready = Promise.all([document.fonts?.ready || Promise.resolve()]);

  if (reduced) {
    count.textContent = '100';
    return ready.then(() => loader);
  }

  const drawn = new Promise((resolve) => {
    const tl = createTimeline({ defaults: { ease: 'inOutQuad' }, onComplete: resolve });
    tl.add(lines, { draw: ['0 0', '0 1'], duration: 900, delay: stagger(70), ease: 'inOutSine' }, 0);
    const n = { v: 0 };
    tl.add(n, {
      v: 100, duration: 2100, ease: 'inOutQuart',
      onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(2, '0'); },
    }, 0);
  });

  return Promise.all([drawn, ready]).then(() => loader);
}

export function exitLoader(loader, onStart) {
  return new Promise((resolve) => {
    document.body.classList.remove('is-loading');
    gsap.timeline({ onComplete: () => { loader.remove(); resolve(); } })
      .to(loader.querySelector('.loader__inner'), { y: -30, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0)
      .add(() => onStart && onStart(), 0.35)
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, 0.4);
  });
}
