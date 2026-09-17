import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHouse, addDaylight } from '../house.js';
import { stage } from '../stage.js';

/*
  Services: the house assembles as you scroll, in the order the studio works.
  Site design -> ground, drive and foundation
  Structural design -> floor, wall and roof framing
  Home design -> cladding, glazing, roof, interior, deck
*/
const STEPS = [
  { label: 'Site', layers: ['landscape', 'foundation'] },
  { label: 'Structure', layers: ['floorFraming', 'wallFraming', 'roofFraming'] },
  { label: 'Home', layers: ['cladding', 'glazing', 'roof', 'interior', 'deck'] },
];

export function createAssemblyView(el, pinEl, { reduced = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const house = createHouse();
  scene.add(house.root);
  scene.background = new THREE.Color(0xeaece8);
  addDaylight(scene, { fog: 0xeaece8 });
  house.plan.mats.forEach((m) => (m.opacity = 0));
  house.plan.solid.visible = false; house.plan.dashed.visible = false;

  camera.position.set(22, 13, 26);
  const target = new THREE.Vector3(0, 1.2, 0);

  const L = house.layers;
  const steps = [...document.querySelectorAll('.svc')];
  const bar = document.getElementById('services-bar');
  const label = document.getElementById('services-label');

  // everything except the site starts hidden high above the ground
  const all = STEPS.flatMap((s) => s.layers);
  all.forEach((n) => { L[n].visible = false; L[n].position.y = 14; });
  L.landscape.position.y = 0; L.landscape.scale.set(0.001, 0.001, 0.001);

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  let t = 0;
  const per = 1 / all.length;
  STEPS.forEach((s) => {
    s.layers.forEach((n) => {
      tl.set(L[n], { visible: true }, t);
      if (n === 'landscape') tl.to(L[n].scale, { x: 1, y: 1, z: 1, duration: per * 1.3, ease: 'back.out(1.2)' }, t);
      else tl.fromTo(L[n].position, { y: 14 }, { y: 0, duration: per * 1.5 }, t);
      t += per;
    });
  });
  tl.to({}, { duration: 0.2 }); // hold at the end

  let current = -1;
  const setStep = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    if (label) label.textContent = STEPS[i].label;
    const s = steps[i];
    if (s) gsap.fromTo(s.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'expo.out', overwrite: 'auto' });
  };
  setStep(0);

  let progress = 0;
  ScrollTrigger.create({
    trigger: pinEl,
    start: 'top top',
    end: '+=320%',
    pin: true,
    scrub: reduced ? false : 0.6,
    anticipatePin: 1,
    onUpdate: (self) => {
      progress = self.progress;
      tl.progress(progress);
      if (bar) bar.style.transform = `scaleX(${progress})`;
      setStep(progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2);
    },
  });

  const view = stage.add({
    el, scene, camera,
    update() {
      house.root.rotation.y = -0.55 + progress * 1.35;
      const k = camera.aspect < 1.1 ? 1 + (1.1 - camera.aspect) * 1.2 : 1;
      camera.position.set(22 * k, (13 - progress * 3) * k, 26 * k);
      camera.lookAt(target);
    },
  });

  return { view, house };
}
