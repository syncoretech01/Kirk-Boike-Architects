import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHouse, addDaylight } from '../house.js';
import { stage } from '../stage.js';

/*
  Hero: the floor plan lies flat in blueprint blue, the camera is top-down.
  On load the camera swings to a three-quarter view while the walls extrude up
  and the roof settles on. After that the model is pointer and drag driven.
*/
export function createHeroView(el, { reduced = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const house = createHouse();
  scene.add(house.root);
  addDaylight(scene);

  const target = new THREE.Vector3(0, 0, 0);
  camera.position.set(0.01, 40, 5);

  const L = house.layers;
  const state = { rot: 0.25, drag: 0, vel: 0, px: 0, py: 0, dragging: false, lastInput: 0, ready: false, scroll: 0 };

  // initial "plan" state
  const walls = [L.wallFraming, L.cladding, L.glazing, L.interior];
  walls.forEach((g) => g.scale.y = 0.001);
  L.deck.scale.y = 0.001;
  L.roof.position.y = 7; L.roofFraming.position.y = 7;
  L.roof.visible = false; L.roofFraming.visible = false;
  L.landscape.scale.set(0.001, 0.001, 0.001);
  house.plan.mats.forEach((m) => (m.opacity = 1));
  house.root.rotation.y = 0;

  const camProxy = { x: 0.01, y: 40, z: 5, tx: 0, ty: 0, tz: 0 };
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  intro
    .to(camProxy, { x: 22, y: 11.5, z: 25.5, tx: 0, ty: 1.3, tz: 0, duration: 2.6, ease: 'power3.inOut' }, 0)
    .to(house.root.rotation, { y: 0.25, duration: 2.6, ease: 'power3.inOut' }, 0)
    .to(L.wallFraming.scale, { y: 1, duration: 1.4 }, 0.7)
    .to(L.cladding.scale, { y: 1, duration: 1.4 }, 0.9)
    .to(L.glazing.scale, { y: 1, duration: 1.3 }, 1.05)
    .to(L.interior.scale, { y: 1, duration: 1.2 }, 1.1)
    .to(L.deck.scale, { y: 1, duration: 1.0 }, 1.2)
    .set([L.roofFraming, L.roof], { visible: true }, 1.35)
    .to(L.roofFraming.position, { y: 0, duration: 1.4 }, 1.35)
    .to(L.roof.position, { y: 0, duration: 1.5 }, 1.55)
    .to(L.landscape.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: 'back.out(1.4)' }, 1.2)
    .to(house.plan.mats, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 1.5)
    .add(() => { state.ready = true; }, 2.4);

  if (reduced) {
    intro.progress(1);
    state.ready = true;
  }

  // pointer + drag
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    state.px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    state.py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (state.dragging) {
      const dx = e.clientX - state.lastX;
      state.lastX = e.clientX;
      state.drag += dx * 0.008;
      state.vel = dx * 0.008;
      state.lastInput = performance.now();
    }
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', (e) => {
    state.dragging = true; state.lastX = e.clientX; state.vel = 0; state.lastInput = performance.now();
    el.setPointerCapture(e.pointerId);
    el.dispatchEvent(new CustomEvent('hero:drag'));
  });
  const end = () => { state.dragging = false; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => { state.px = 0; state.py = 0; });

  // scroll influence: the model turns and the camera lifts as the hero leaves
  ScrollTrigger.create({
    trigger: el.closest('section'),
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => { state.scroll = self.progress; },
  });

  let cur = { px: 0, py: 0 };
  const view = stage.add({
    el, scene, camera,
    update(dt) {
      // pull back on portrait viewports so the whole house fits
      const k = camera.aspect < 1.1 ? 1 + (1.1 - camera.aspect) * 1.15 : 1;
      camera.position.set(camProxy.x * k, (camProxy.y + state.scroll * 6) * k, camProxy.z * k);
      target.set(camProxy.tx, camProxy.ty, camProxy.tz);
      if (state.ready) {
        cur.px += (state.px - cur.px) * Math.min(1, dt * 4);
        cur.py += (state.py - cur.py) * Math.min(1, dt * 4);
        if (!state.dragging) {
          state.drag += state.vel;
          state.vel *= 0.92;
          if (performance.now() - state.lastInput > 2500 && !reduced) state.drag += dt * 0.06;
        }
        house.root.rotation.y = 0.25 + state.drag + cur.px * 0.28 + state.scroll * 0.9;
        camera.position.y += -cur.py * 1.6;
        camera.position.x += cur.px * 1.2;
      }
      camera.lookAt(target);
    },
  });

  return { view, house, intro, play: () => intro.play() };
}
