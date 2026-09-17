import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/geist-mono';
import 'lenis/dist/lenis.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSmoothScroll, reduced } from './lib/smooth.js';
import { stage } from './three/stage.js';
import { createHeroView } from './three/views/hero.js';
import { createAssemblyView } from './three/views/assembly.js';
import { createExplorerView } from './three/views/explorer.js';
import { createFlyView } from './three/views/flythrough.js';
import { createSunView } from './three/views/sun.js';
import { runLoader, exitLoader } from './ui/loader.js';
import { initNav } from './ui/nav.js';
import { prepareHero, initLineReveals, initWordScrub, initReveals } from './ui/text.js';
import { initMagnetic } from './ui/magnetic.js';
import { initXray } from './ui/xray.js';
import { initRender } from './ui/render.js';
import { initProjects } from './ui/projects.js';
import { initProcess } from './ui/process.js';
import { initStudio } from './ui/studio.js';
import { initContact } from './ui/contact.js';
import { initMaterials, initFaq } from './ui/extras.js';

gsap.registerPlugin(ScrollTrigger);
document.body.classList.add('is-loading');
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const opts = { reduced };
const loaderDone = runLoader(opts);

// scroll + nav
const lenis = createSmoothScroll();
lenis.stop();

// text
const revealHero = prepareHero();

// Sections are initialised in DOM order so pinned ScrollTriggers stack correctly.
const hero = createHeroView(document.getElementById('hero-stage'), opts);
initWordScrub();
createAssemblyView(document.getElementById('services-stage'), document.querySelector('.services__pin'), opts);
createSunView(document.getElementById('sun-stage'), opts);
initXray(opts);
initProjects(lenis, opts);
initRender(opts);
createExplorerView(document.getElementById('anatomy-stage'), opts);
createFlyView(document.getElementById('fly-stage'), document.querySelector('.fly__pin'), opts);
initMaterials(opts);
initProcess(opts);
initFaq(opts);
initStudio(opts);
initContact();
initLineReveals(opts);
initReveals(opts);
initMagnetic(opts);
initNav(lenis);
ScrollTrigger.sort();

// hint fades after the first drag
document.getElementById('hero-stage').addEventListener('hero:drag', () => {
  document.getElementById('hero-hint')?.classList.remove('is-on');
}, { once: true });

// render loop
gsap.ticker.add((time, delta) => stage.render(Math.min(delta, 50) / 1000, time * 1000));

// pinned sections change layout after fonts and images settle
window.addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
document.fonts?.ready.then(() => ScrollTrigger.refresh());

loaderDone.then((loader) => {
  ScrollTrigger.refresh();
  exitLoader(loader, () => {
    hero.play();
    revealHero();
  }).then(() => {
    lenis.start();
    ScrollTrigger.refresh();
  });
});
