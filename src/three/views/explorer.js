import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHouse, addDaylight, FL, H_FRONT, W, D } from '../house.js';

// bottom-to-top order for the exploded diagram
const EXPLODE_ORDER = ['foundation', 'deck', 'floorFraming', 'interior', 'wallFraming', 'cladding', 'glazing', 'roofFraming', 'roof'];
import { stage, projectToRect } from '../stage.js';

/*
  Anatomy explorer: orbit (scroll + drag), explode, cutaway, x-ray,
  layer isolation and hotspots projected from 3D to the DOM.
*/
const HOTSPOTS = [
  { name: 'Standing seam roof, single shed pitch', pos: new THREE.Vector3(-2, FL + H_FRONT + 0.75, D / 2 + 0.6) },
  { name: 'Glulam beam carries the roof over 12 m of glass', pos: new THREE.Vector3(2.5, FL + H_FRONT - 0.25, D / 2 + 0.15) },
  { name: 'Floor-to-ceiling south glazing', pos: new THREE.Vector3(-1, FL + 1.5, D / 2 + 0.1) },
  { name: 'Cedar rainscreen over a ventilated cavity', pos: new THREE.Vector3(W / 2 + 0.1, FL + 2.2, 0.5) },
  { name: 'Stem wall foundation with a centre girder', pos: new THREE.Vector3(-5, -0.35, D / 2 + 0.25) },
  { name: 'Cedar deck on the sun side', pos: new THREE.Vector3(4.5, FL, D / 2 + 3.1) },
];

export function createExplorerView(el, { reduced = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const house = createHouse();
  scene.add(house.root);
  scene.background = new THREE.Color(0xeaece8);
  addDaylight(scene, { fog: 0xeaece8 });
  house.plan.solid.visible = false; house.plan.dashed.visible = false;

  const target = new THREE.Vector3(0, 1.4, 0);
  const orbit = { theta: 0.15, phi: 1.14, radius: 37, dragTheta: 0, vel: 0, dragging: false, lastX: 0, lastInput: 0, scroll: 0 };

  // hotspot DOM
  const hsWrap = document.getElementById('hotspots');
  const hsEls = HOTSPOTS.map((h) => {
    const b = document.createElement('button');
    b.className = 'hs';
    b.type = 'button';
    b.innerHTML = `<span class="hs__dot"></span><span class="hs__label">${h.name}</span>`;
    b.setAttribute('aria-label', h.name);
    hsWrap.appendChild(b);
    return b;
  });

  // modes
  const modes = { explode: false, cutaway: false, xray: false };
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 8);
  const cutUI = document.getElementById('anatomy-cut');
  const cutRange = document.getElementById('cut-range');
  const cutVal = { c: 8 };

  const setExplode = (on) => {
    EXPLODE_ORDER.forEach((n, i) => {
      gsap.to(house.layers[n].position, { y: on ? i * 1.4 : 0, duration: 1.3, ease: 'expo.inOut', delay: on ? i * 0.04 : (EXPLODE_ORDER.length - i) * 0.03 });
    });
    gsap.to(house.layers.landscape.position, { y: on ? -1.2 : 0, duration: 1.2, ease: 'expo.inOut' });
  };
  const applyCut = () => {
    const v = cutRange ? Number(cutRange.value) / 100 : 0.5;
    gsap.to(cutVal, { c: 8.5 - 11.5 * v, duration: 0.5, ease: 'power2.out', onUpdate: () => { plane.constant = cutVal.c; } });
  };
  const setCut = (on) => {
    house.setClip(on ? plane : null);
    cutUI && cutUI.classList.toggle('is-on', on);
    if (on) applyCut(); else { cutVal.c = 8.5; plane.constant = 8.5; }
  };
  cutRange && cutRange.addEventListener('input', applyCut);

  document.querySelectorAll('.mode').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.mode;
      modes[m] = !modes[m];
      btn.setAttribute('aria-pressed', String(modes[m]));
      if (m === 'explode') setExplode(modes[m]);
      if (m === 'cutaway') setCut(modes[m]);
      if (m === 'xray') house.setXray(modes[m]);
    });
  });

  // layer isolation
  const layerItems = document.querySelectorAll('#layers li');
  layerItems.forEach((li) => {
    const on = () => { layerItems.forEach((x) => x.classList.remove('is-on')); li.classList.add('is-on'); house.setHighlight(li.dataset.layer); };
    const off = () => { li.classList.remove('is-on'); house.setHighlight(null); };
    li.addEventListener('pointerenter', on);
    li.addEventListener('pointerleave', off);
    li.addEventListener('focus', on);
    li.addEventListener('blur', off);
    li.tabIndex = 0;
  });

  // drag orbit
  el.addEventListener('pointerdown', (e) => { orbit.dragging = true; orbit.lastX = e.clientX; orbit.vel = 0; orbit.lastInput = performance.now(); el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (!orbit.dragging) return;
    const dx = e.clientX - orbit.lastX; orbit.lastX = e.clientX;
    orbit.dragTheta += dx * 0.006; orbit.vel = dx * 0.006; orbit.lastInput = performance.now();
  });
  const end = () => { orbit.dragging = false; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);

  // scroll-driven orbit while the section is in view
  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => { orbit.scroll = self.progress; },
  });

  const camDir = new THREE.Vector3();
  const view = stage.add({
    el, scene, camera,
    update(dt, t, rect) {
      if (!orbit.dragging) {
        orbit.dragTheta += orbit.vel; orbit.vel *= 0.93;
        if (!reduced && performance.now() - orbit.lastInput > 3000) orbit.dragTheta += dt * 0.05;
      }
      const theta = orbit.theta + orbit.dragTheta + orbit.scroll * 1.0;
      const phi = orbit.phi - orbit.scroll * 0.15 + (modes.explode ? -0.1 : 0);
      const k = camera.aspect < 1.1 ? 1 + (1.1 - camera.aspect) * 1.2 : 1;
      const r = (orbit.radius + (modes.explode ? 16 : 0)) * k;
      camera.position.set(Math.sin(theta) * Math.sin(phi) * r, Math.cos(phi) * r, Math.cos(theta) * Math.sin(phi) * r);
      target.y = modes.explode ? 6.5 : 1.4;
      camera.lookAt(target);
      camera.getWorldDirection(camDir);
      // hotspots
      HOTSPOTS.forEach((h, i) => {
        const p = h.pos.clone();
        if (modes.explode) p.y += EXPLODE_ORDER.indexOf(hotLayer(i)) * 1.4;
        const s = projectToRect(p, camera, rect);
        const toCam = camera.position.clone().sub(p).normalize();
        const facing = toCam.dot(new THREE.Vector3(p.x, 0, p.z).normalize());
        const vis = s.z < 1 && facing > -0.15 && s.x > 10 && s.x < rect.width - 10 && s.y > 10 && s.y < rect.height - 10;
        const elx = hsEls[i];
        elx.classList.toggle('is-vis', vis);
        elx.classList.toggle('flip', s.x > rect.width * 0.62);
        elx.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`;
      });
    },
  });

  return { view, house };
}

function hotLayer(i) {
  return ['roof', 'wallFraming', 'glazing', 'cladding', 'foundation', 'deck'][i];
}
