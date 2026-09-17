import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initNav(lenis) {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const links = [...document.querySelectorAll('[data-nav]')];

  ScrollTrigger.create({
    start: 'top -40px',
    onUpdate: (self) => nav.classList.toggle('is-scrolled', self.scroll() > 40),
    onEnter: () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled'),
  });

  // active link
  links.forEach((a) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => a.classList.toggle('is-active', self.isActive),
    });
  });

  // mobile menu
  const menuLinks = [...menu.querySelectorAll('.menu__links a')];
  menuLinks.forEach((a) => { a.innerHTML = `<span>${a.textContent}</span>`; });
  let open = false;
  const tl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' }, 0)
    .fromTo(menuLinks.map((a) => a.firstChild), { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, 0.35)
    .fromTo(menu.querySelector('.menu__foot'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.7);

  const toggle = (force) => {
    open = force ?? !open;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('is-open', open);
    if (open) { tl.timeScale(1).play(); lenis.stop(); }
    else { tl.timeScale(1.6).reverse(); lenis.start(); }
  };
  burger.addEventListener('click', () => toggle());
  menuLinks.forEach((a) => a.addEventListener('click', () => toggle(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(false); });
}
