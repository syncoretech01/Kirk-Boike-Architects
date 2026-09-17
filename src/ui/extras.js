import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* Materials: accordion image slider. Hover or focus a strip to open it; tap on touch. */
export function initMaterials({ reduced = false } = {}) {
  const acc = document.getElementById('materials-acc');
  if (!acc) return;
  const panels = [...acc.querySelectorAll('.acc__panel')];
  const open = (p) => panels.forEach((x) => x.classList.toggle('is-open', x === p));
  const fine = window.matchMedia('(pointer: fine)').matches;
  panels.forEach((p) => {
    if (fine) p.addEventListener('pointerenter', () => open(p));
    p.addEventListener('click', () => open(p));
    p.addEventListener('focus', () => open(p));
  });
  if (reduced) return;
  // strips slide up in sequence when the section arrives
  gsap.set(panels, { yPercent: 12, opacity: 0 });
  ScrollTrigger.create({
    trigger: acc, start: 'top 80%', once: true,
    onEnter: () => gsap.to(panels, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.09, ease: 'expo.out', clearProps: 'transform' }),
  });
  // when idle, the open strip walks along on its own
  let idx = 0, timer = 0, userTouched = false;
  const step = () => { if (userTouched) return; idx = (idx + 1) % panels.length; open(panels[idx]); };
  acc.addEventListener('pointerenter', () => { userTouched = true; clearInterval(timer); }, { once: true });
  ScrollTrigger.create({
    trigger: acc, start: 'top 70%', end: 'bottom 30%',
    onToggle: (self) => { clearInterval(timer); if (self.isActive && !userTouched) timer = setInterval(step, 2600); },
  });
}

/* FAQ: one open at a time, height animated */
export function initFaq({ reduced = false } = {}) {
  const list = document.getElementById('faq-list');
  if (!list) return;
  const items = [...list.querySelectorAll('.qa')];
  items.forEach((qa) => {
    const btn = qa.querySelector('.qa__q');
    const body = qa.querySelector('.qa__a');
    gsap.set(body, { height: qa.classList.contains('is-open') ? 'auto' : 0 });
    btn.addEventListener('click', () => {
      const willOpen = !qa.classList.contains('is-open');
      items.forEach((other) => {
        const ob = other.querySelector('.qa__a'), obtn = other.querySelector('.qa__q');
        const openIt = other === qa && willOpen;
        other.classList.toggle('is-open', openIt);
        obtn.setAttribute('aria-expanded', String(openIt));
        gsap.to(ob, { height: openIt ? 'auto' : 0, duration: reduced ? 0 : 0.6, ease: 'expo.out' });
      });
    });
  });
  if (reduced) return;
  gsap.set(items, { opacity: 0, y: 24 });
  ScrollTrigger.create({
    trigger: list, start: 'top 82%', once: true,
    onEnter: () => gsap.to(items, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }),
  });
}
