import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const STEPS = [
  { title: 'Site walk', body: 'We walk the land with you. Sun, slope, views, access, wet ground and setbacks all get noted before anything is drawn.', out: 'Site analysis', more: 'We pull the parcel data, critical areas and utility locations so the first sketch already fits the rules.' },
  { title: 'Schematic design', body: 'Two or three plan and massing options, each tested on the site model. You pick the one that feels like home.', out: 'Schematic set', more: 'Rough cost ranges come with each option so the decision is made with numbers on the table.' },
  { title: 'Design development', body: 'Materials, windows, sections and energy targets are settled. The house becomes specific.', out: 'DD set', more: 'Window schedules, roof details and a preliminary framing plan are drawn now, not left to the builder.' },
  { title: 'Structural engineering', body: 'Beams, posts, shear walls and foundations are engineered in-house, alongside the architecture.', out: 'Calculations', more: 'Lateral design for the Peninsula wind and seismic loads, sized so the big glass and long spans hold up without bulk.' },
  { title: 'Permit set', body: 'A complete set of drawings and calculations goes to Jefferson County or the City of Port Townsend.', out: 'Permit drawings', more: 'We answer reviewer comments directly so corrections do not stall the permit.' },
  { title: 'Construction support', body: 'Site visits, builder questions and shop drawing review through to move-in.', out: 'Site visits', more: 'Most questions are answered the same day. Field changes get a sketch, not a shrug.' },
];

export function initProcess({ reduced = false } = {}) {
  const pin = document.querySelector('.process__pin');
  const track = document.getElementById('process-track');
  const list = document.getElementById('process-steps');
  const svg = document.getElementById('process-line');
  const path = document.getElementById('process-path');

  list.innerHTML = STEPS.map((s) => `
    <li class="step">
      <span class="step__idx" aria-hidden="true"></span>
      <h3 class="step__title">${s.title}</h3>
      <p class="step__body">${s.body}</p>
      <div class="step__out"><b>Deliverable</b><span>${s.out}</span></div>
      <div class="step__more"><p>${s.more}</p></div>
      <button class="step__toggle" type="button" aria-expanded="false">Details</button>
    </li>`).join('');

  const steps = [...list.querySelectorAll('.step')];
  steps.forEach((step) => {
    const btn = step.querySelector('.step__toggle');
    const more = step.querySelector('.step__more');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.textContent = open ? 'Details' : 'Less';
      gsap.to(more, { height: open ? 0 : 'auto', opacity: open ? 0 : 1, duration: 0.6, ease: 'expo.out' });
    });
  });

  const mq = window.matchMedia('(min-width: 901px)');
  let ctx;
  const build = () => {
    ctx && ctx.revert();
    if (!mq.matches) { steps.forEach((s) => s.classList.add('is-active')); return; }
    ctx = gsap.context(() => {
      const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const distance = () => list.scrollWidth - window.innerWidth + gutter * 2;
      // connecting line between the markers
      const layout = () => {
        const tr = track.getBoundingClientRect();
        const pts = steps.map((s) => { const r = s.querySelector('.step__idx').getBoundingClientRect(); return { x: r.left + r.width / 2 - tr.left, y: r.top + r.height / 2 - tr.top }; });
        svg.setAttribute('width', list.scrollWidth + gutter * 2);
        svg.setAttribute('viewBox', `0 0 ${list.scrollWidth + gutter * 2} ${tr.height}`);
        path.setAttribute('d', pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        return len;
      };
      let len = layout();
      const tween = gsap.to([list, svg], {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: reduced ? false : 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefresh: () => { len = layout(); },
          onUpdate: (self) => {
            path.style.strokeDashoffset = len * (1 - Math.min(1, self.progress * 1.15));
            const active = Math.round(self.progress * (steps.length - 1));
            steps.forEach((s, i) => s.classList.toggle('is-active', i <= active));
          },
        },
      });
      return tween;
    }, pin);
  };
  build();
  mq.addEventListener('change', build);
}
