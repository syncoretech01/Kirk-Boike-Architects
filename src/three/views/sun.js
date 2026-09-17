import * as THREE from 'three';
import { gsap } from 'gsap';
import { createHouse } from '../house.js';
import { stage } from '../stage.js';

/*
  Sun study: the hour slider and season chips move a real sun over the model
  (solar position for Port Townsend, 48.1 N). Shadows sweep across the page.
*/
const LAT = (48.1 * Math.PI) / 180;
const SEASONS = {
  jun: { decl: 23.4, label: 'June', note: 'Long evening light on the deck. The overhang keeps the glass in shade at noon.' },
  equinox: { decl: 0, label: 'March', note: 'Even light all day. Morning sun reaches deep into the plan through the east window.' },
  dec: { decl: -23.4, label: 'December', note: 'A low sun all day. Full-height glass lets it run across the floor and warm the slab.' },
};

export function createSunView(el, { reduced = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 300);
  const house = createHouse();
  scene.add(house.root);
  house.plan.solid.visible = false; house.plan.dashed.visible = false;
  scene.fog = new THREE.Fog(0xf4f5f3, 58, 110);

  const hemi = new THREE.HemisphereLight(0xe6edf7, 0xb6b0a5, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  scene.add(disc);
  // sun path arc for the current season
  const arcMat = new THREE.LineDashedMaterial({ color: 0x1e4fa3, dashSize: 0.6, gapSize: 0.4, transparent: true, opacity: 0.55 });
  let arc = null;

  camera.position.set(-24, 15, 26);
  const target = new THREE.Vector3(0, 1, 0);

  const state = { hour: 14, season: 'jun', lastInput: 0, dir: 1 };
  const timeEl = document.getElementById('sun-time');
  const seasonEl = document.getElementById('sun-season');
  const noteEl = document.getElementById('sun-note');
  const range = document.getElementById('sun-hour');

  const sunDir = (hour, decl) => {
    const d = (decl * Math.PI) / 180;
    const h = ((hour - 12) * 15 * Math.PI) / 180;
    const elev = Math.asin(Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(h));
    const az = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(LAT) - Math.tan(d) * Math.cos(LAT)); // 0 = south, + = west
    // scene: +z is south, +x is east
    return new THREE.Vector3(-Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev));
  };

  const buildArc = () => {
    if (arc) { scene.remove(arc); arc.geometry.dispose(); }
    const pts = [];
    for (let h = 4; h <= 21; h += 0.25) { const v = sunDir(h, SEASONS[state.season].decl); if (v.y > -0.02) pts.push(v.multiplyScalar(34)); }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    arc = new THREE.Line(g, arcMat);
    arc.computeLineDistances();
    scene.add(arc);
  };
  buildArc();

  const fmt = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); const ap = hh >= 12 ? 'pm' : 'am'; const h12 = ((hh + 11) % 12) + 1; return `${h12}:${String(mm).padStart(2, '0')} ${ap}`; };

  const apply = () => {
    const v = sunDir(state.hour, SEASONS[state.season].decl);
    const up = Math.max(0, v.y);
    sun.position.copy(v).multiplyScalar(40);
    sun.intensity = 2.6 * Math.min(1, up * 3.5);
    // warmer near the horizon
    sun.color.setHSL(0.09 - up * 0.02, 0.8 - up * 0.55, 0.62 + up * 0.28);
    hemi.intensity = 0.35 + up * 0.7;
    disc.position.copy(v).multiplyScalar(34);
    disc.visible = v.y > 0;
    disc.material.color.setHSL(0.1 - up * 0.02, 0.9, 0.62 + up * 0.2);
    timeEl.textContent = fmt(state.hour);
  };
  apply();

  range.addEventListener('input', () => { state.hour = Number(range.value); state.lastInput = performance.now(); apply(); });
  document.querySelectorAll('.sun__seasons .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.season = chip.dataset.season;
      document.querySelectorAll('.sun__seasons .chip').forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      seasonEl.textContent = SEASONS[state.season].label;
      gsap.fromTo(noteEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
      noteEl.textContent = SEASONS[state.season].note;
      buildArc();
      state.lastInput = performance.now();
      apply();
    });
  });

  const view = stage.add({
    el, scene, camera,
    update(dt) {
      // idle: the day plays on its own until someone touches the slider
      if (!reduced && performance.now() - state.lastInput > 4000) {
        state.hour += dt * 0.9 * state.dir;
        if (state.hour > 21) { state.hour = 21; state.dir = -1; }
        if (state.hour < 5) { state.hour = 5; state.dir = 1; }
        range.value = state.hour.toFixed(1);
        apply();
      }
      const k = camera.aspect < 1.1 ? 1 + (1.1 - camera.aspect) * 1.2 : 1;
      camera.position.set(-24 * k, 15 * k, 26 * k);
      camera.lookAt(target);
    },
  });

  return { view, house };
}
