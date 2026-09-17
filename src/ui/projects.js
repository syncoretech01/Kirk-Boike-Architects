import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { PROJECTS } from '../data/projects.js';
import { drawEdges } from './edges.js';

gsap.registerPlugin(Flip);

/*
  Projects grid. Clicking a card morphs its photo into the fullscreen view (GSAP Flip),
  where a compare slider sits between the line drawing and the finished photograph.
*/
export function initProjects(lenis, { reduced = false } = {}) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = PROJECTS.map((p, i) => `
    <button class="card card--${i + 1}" type="button" data-id="${p.id}" aria-label="Open ${p.name}">
      <div class="card__media card__mask">
        <img src="${p.img}" alt="${p.name}, ${p.loc}" loading="lazy" data-flip-id="${p.id}" crossorigin="anonymous" />
        <div class="card__frame"></div>
      </div>
      <div class="card__meta">
        <span class="card__name">${p.name}</span>
        <span class="card__loc">${p.loc}</span>
      </div>
    </button>`).join('');

  // mask reveal on enter
  grid.querySelectorAll('.card').forEach((card) => {
    const media = card.querySelector('.card__mask');
    const meta = card.querySelector('.card__meta');
    if (reduced) { media.style.clipPath = 'none'; return; }
    gsap.set(meta, { opacity: 0, y: 14 });
    ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.timeline()
          .to(media, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.inOut' })
          .fromTo(media.querySelector('img'), { scale: 1.25 }, { scale: 1.04, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 0)
          .to(meta, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.7);
      },
    });
  });

  // modal
  const modal = document.getElementById('project-modal');
  const scrim = document.getElementById('pm-scrim');
  const pmImg = document.getElementById('pm-img');
  const pmLines = document.getElementById('pm-lines');
  const drawing = document.getElementById('pm-drawing');
  const media = document.getElementById('pm-media');
  const handle = document.getElementById('pm-handle');
  const body = modal.querySelector('.pm__body');
  const closeBtn = document.getElementById('pm-close');
  let openCard = null, busy = false;

  // compare slider: pointer drag anywhere on the media, arrow keys on the handle, tags snap
  const cmp = { v: 55, target: 55 };
  const render = () => {
    drawing.style.setProperty('--p', `${cmp.v}%`);
    handle.style.left = `${cmp.v}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(cmp.v)));
  };
  const setCompare = (v, instant = false) => {
    cmp.target = Math.max(0, Math.min(100, v));
    if (instant) { gsap.killTweensOf(cmp); cmp.v = cmp.target; render(); return; }
    gsap.to(cmp, { v: cmp.target, duration: 0.5, ease: 'expo.out', overwrite: true, onUpdate: render });
  };
  let dragging = false;
  const pct = (e) => { const r = media.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  media.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.pm__tags')) return;
    dragging = true; media.setPointerCapture(e.pointerId); media.classList.add('is-dragging');
    setCompare(pct(e));
  });
  media.addEventListener('pointermove', (e) => { if (dragging) setCompare(pct(e), true); });
  const stop = () => { dragging = false; media.classList.remove('is-dragging'); };
  media.addEventListener('pointerup', stop); media.addEventListener('pointercancel', stop);
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setCompare(cmp.target - 5); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setCompare(cmp.target + 5); }
    if (e.key === 'Home') setCompare(0); if (e.key === 'End') setCompare(100);
  });
  modal.querySelectorAll('[data-compare]').forEach((b) => b.addEventListener('click', () => setCompare(Number(b.dataset.compare))));

  const open = (card) => {
    if (busy || openCard) return;
    busy = true;
    const p = PROJECTS.find((x) => x.id === card.dataset.id);
    const cardImg = card.querySelector('img');
    openCard = card;

    document.getElementById('pm-title').textContent = p.name;
    document.getElementById('pm-loc').textContent = p.loc;
    document.getElementById('pm-type').textContent = p.type;
    document.getElementById('pm-year').textContent = p.year;
    document.getElementById('pm-desc').textContent = p.desc;
    pmImg.src = p.img; pmImg.alt = cardImg.alt;
    pmImg.dataset.flipId = p.id;
    setCompare(55, true);
    drawing.style.opacity = '0';
    drawEdges(pmImg, pmLines, { bg: [15, 43, 90], line: [244, 245, 243], lo: 48, hi: 170, maxW: 1200 })
      .then(() => gsap.timeline({ delay: 0.4 })
        .to(drawing, { opacity: 1, duration: 0.6 })
        // a quick sweep shows what the handle does
        .add(() => setCompare(35), 0.6)
        .add(() => setCompare(55), 1.3));

    const state = Flip.getState(cardImg);
    modal.classList.add('is-open', 'is-morphing');
    modal.setAttribute('aria-hidden', 'false');
    lenis.stop();
    cardImg.style.visibility = 'hidden';
    gsap.set([body, closeBtn], { opacity: 0 });
    gsap.set(scrim, { opacity: 0 });

    const tl = gsap.timeline({ onComplete: () => { modal.classList.remove('is-morphing'); busy = false; closeBtn.focus(); } });
    tl.to(scrim, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0);
    tl.add(Flip.from(state, { targets: pmImg, duration: reduced ? 0 : 1.1, ease: 'expo.inOut', absolute: true }), 0);
    tl.fromTo(body, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.6);
    tl.to(closeBtn, { opacity: 1, duration: 0.5 }, 0.7);
  };

  const close = () => {
    if (busy || !openCard) return;
    busy = true;
    const cardImg = openCard.querySelector('img');
    modal.classList.add('is-morphing');
    const tl = gsap.timeline({
      onComplete: () => {
        cardImg.style.visibility = '';
        modal.classList.remove('is-open', 'is-morphing');
        modal.setAttribute('aria-hidden', 'true');
        gsap.set(pmImg, { clearProps: 'all' });
        lenis.start();
        openCard.focus();
        openCard = null; busy = false;
      },
    });
    tl.to([body, closeBtn], { opacity: 0, duration: 0.3 }, 0);
    tl.add(Flip.fit(pmImg, cardImg, { duration: reduced ? 0 : 0.9, ease: 'expo.inOut', absolute: true }), 0.1);
    tl.to(scrim, { opacity: 0, duration: 0.6 }, 0.35);
  };

  grid.addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) open(c); });
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  modal.querySelector('.pm__cta').addEventListener('click', () => { close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openCard) close(); });
}
