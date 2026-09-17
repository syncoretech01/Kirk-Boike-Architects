import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createSmoothScroll() {
  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 1,
    smoothWheel: !reduced,
    syncTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links scroll through Lenis so pinned sections resolve correctly
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: reduced ? 0 : 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  });

  return lenis;
}
