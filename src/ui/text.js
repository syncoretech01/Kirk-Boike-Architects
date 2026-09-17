import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { inView, animate, stagger } from 'motion';

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

/* Hero headline + subtext: split now, reveal when the loader lifts */
export function prepareHero() {
  const title = document.querySelector('.hero__title');
  const sub = document.querySelector('.hero__sub');
  const ctas = document.querySelectorAll('.hero__cta .btn');
  const t = SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'line' });
  const s = SplitText.create(sub, { type: 'lines', mask: 'lines', linesClass: 'line' });
  gsap.set(t.words, { yPercent: 110 });
  gsap.set(s.lines, { yPercent: 110, opacity: 0 });
  gsap.set(ctas, { y: 20, opacity: 0 });
  return () => {
    gsap.timeline()
      .to(t.words, { yPercent: 0, duration: 1.3, stagger: 0.05, ease: 'expo.out' }, 0.1)
      .to(s.lines, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0.5)
      .to(ctas, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'expo.out' }, 0.8)
      .add(() => document.getElementById('hero-hint')?.classList.add('is-on'), 2.2);
  };
}

/*
  Each section headline gets its own entrance. The type is set in the markup
  with data-reveal-type so no two neighbouring sections move the same way.
*/
const REVEALS = {
  // masked lines rising (default)
  lines(el) {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(split.lines, { yPercent: 110 });
    return () => gsap.to(split.lines, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' });
  },
  // masked lines that un-skew as they land
  'skew-lines'(el) {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(split.lines, { yPercent: 120, skewY: 7, transformOrigin: 'left top' });
    return () => gsap.to(split.lines, { yPercent: 0, skewY: 0, duration: 1.4, stagger: 0.1, ease: 'expo.out' });
  },
  // every character flips up around its baseline
  'chars-flip'(el) {
    const split = SplitText.create(el, { type: 'lines,chars', linesClass: 'line' });
    gsap.set(el, { perspective: 800 });
    gsap.set(split.chars, { yPercent: 60, rotateX: -90, opacity: 0, transformOrigin: '50% 100% -20px', display: 'inline-block' });
    return () => gsap.to(split.chars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1, stagger: { each: 0.018, from: 'start' }, ease: 'back.out(1.6)' });
  },
  // characters rise from the centre outwards
  'chars-rise'(el) {
    const split = SplitText.create(el, { type: 'lines,chars', mask: 'lines', linesClass: 'line' });
    gsap.set(split.chars, { yPercent: 110, display: 'inline-block' });
    return () => gsap.to(split.chars, { yPercent: 0, duration: 1, stagger: { each: 0.02, from: 'center' }, ease: 'expo.out' });
  },
  // the headline decodes from drafting characters
  scramble(el) {
    const text = el.textContent;
    gsap.set(el, { opacity: 1 });
    el.textContent = '';
    el.style.minHeight = '1em';
    return () => gsap.to(el, { duration: 1.6, scrambleText: { text, chars: '/\\|_-+=0123456789', speed: 0.5, revealDelay: 0.2, tweenLength: false }, ease: 'none' });
  },
  // a blue bar sweeps across and leaves the words behind it
  wipe(el) {
    const bar = document.createElement('span');
    bar.className = 'wipe-bar';
    el.style.position = 'relative';
    el.style.display = 'inline-block';
    el.appendChild(bar);
    gsap.set(el, { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(bar, { scaleY: 0 });
    return () => gsap.timeline()
      .to(bar, { scaleY: 1, duration: 0.35, ease: 'expo.out' })
      .to(el, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'expo.inOut' }, 0.1)
      .to(bar, { left: '100%', duration: 1.2, ease: 'expo.inOut' }, 0.1)
      .to(bar, { scaleY: 0, duration: 0.3, ease: 'expo.in' }, 1.15)
      .set(el, { clipPath: 'none' });
  },
  // words slide in from alternating sides
  'words-alt'(el) {
    const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'line' });
    split.words.forEach((w, i) => gsap.set(w, { xPercent: i % 2 ? 70 : -70, opacity: 0, display: 'inline-block' }));
    return () => gsap.to(split.words, { xPercent: 0, opacity: 1, duration: 1.1, stagger: 0.06, ease: 'expo.out' });
  },
  // words focus in from a blur
  blur(el) {
    const split = SplitText.create(el, { type: 'words' });
    gsap.set(split.words, { filter: 'blur(14px)', opacity: 0, y: 10, display: 'inline-block' });
    return () => gsap.to(split.words, { filter: 'blur(0px)', opacity: 1, y: 0, duration: 1.1, stagger: 0.07, ease: 'power3.out' });
  },
  // fade with a drawn underline
  underline(el) {
    const line = document.createElement('span');
    line.className = 'draw-line';
    el.appendChild(line);
    gsap.set(el, { opacity: 0, y: 18 });
    gsap.set(line, { scaleX: 0, transformOrigin: 'left' });
    return () => gsap.timeline()
      .to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' })
      .to(line, { scaleX: 1, duration: 1.1, ease: 'expo.inOut' }, 0.3);
  },
};

export function initLineReveals({ reduced = false } = {}) {
  // legacy attribute still used by the hero subtext
  document.querySelectorAll('[data-split-lines]').forEach((el) => { if (!el.closest('.hero')) el.dataset.revealType = 'lines'; });
  document.querySelectorAll('[data-reveal-type]').forEach((el) => {
    const type = REVEALS[el.dataset.revealType] ? el.dataset.revealType : 'lines';
    if (reduced) return;
    const play = REVEALS[type](el);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: play });
  });

  // images: architectural mask from a side
  document.querySelectorAll('[data-media-reveal]').forEach((el) => {
    if (reduced) return;
    const from = el.dataset.mediaReveal;
    const clip = from === 'left' ? 'inset(0 100% 0 0)' : from === 'right' ? 'inset(0 0 0 100%)' : 'inset(100% 0 0 0)';
    gsap.set(el, { clipPath: clip });
    const img = el.querySelector('img');
    img && gsap.set(img, { scale: 1.2 });
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      onEnter: () => gsap.timeline()
        .to(el, { clipPath: 'inset(0 0 0 0)', duration: 1.4, ease: 'expo.inOut' })
        .to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.1),
    });
  });

  // lists: items slide in from the side, one after another
  document.querySelectorAll('[data-stagger]').forEach((list) => {
    if (reduced) return;
    const items = [...list.children];
    gsap.set(items, { x: -30, opacity: 0 });
    ScrollTrigger.create({
      trigger: list, start: 'top 85%', once: true,
      onEnter: () => gsap.to(items, { x: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'expo.out' }),
    });
  });

  // quotes: the quote marks land first, then the lines
  document.querySelectorAll('[data-quote]').forEach((fig) => {
    if (reduced) return;
    const q = fig.querySelector('blockquote');
    const cap = fig.querySelector('figcaption');
    const split = SplitText.create(q, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(split.lines, { yPercent: 100, opacity: 0 });
    gsap.set(cap, { opacity: 0, x: -12 });
    ScrollTrigger.create({
      trigger: fig, start: 'top 82%', once: true,
      onEnter: () => gsap.timeline()
        .to(split.lines, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power4.out' })
        .to(cap, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out' }, 0.5),
    });
  });
}

/* Statement: word-by-word ink as you scroll */
export function initWordScrub() {
  const el = document.querySelector('[data-words]');
  if (!el) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  const spans = el.querySelectorAll('.w');
  let last = -1;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 78%',
    end: 'bottom 45%',
    scrub: true,
    onUpdate: (self) => {
      const n = Math.round(self.progress * spans.length);
      if (n === last) return;
      last = n;
      spans.forEach((s, i) => s.classList.toggle('is-on', i < n));
    },
  });
}

/* Generic paragraph reveals with motion's inView */
export function initReveals({ reduced = false } = {}) {
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    inView(el, () => { el.classList.add('is-in'); }, { amount: 0.3 });
  });
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    if (group.closest('.hero')) return;
    const kids = [...group.children];
    if (reduced) return;
    kids.forEach((k) => { k.style.opacity = '0'; k.style.transform = 'translateY(20px)'; });
    inView(group, () => {
      animate(kids, { opacity: [0, 1], y: [20, 0] }, { duration: 0.9, delay: stagger(0.08), ease: [0.16, 1, 0.3, 1] });
    }, { amount: 0.3 });
  });
}
