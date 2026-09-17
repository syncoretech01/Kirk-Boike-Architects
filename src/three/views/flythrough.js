import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHouse, FL } from '../house.js';
import { stage } from '../stage.js';

/*
  Dusk fly-through: the camera starts inside the living room, drifts through
  the south glazing onto the deck, then pulls back to a wide exterior.
  Scroll position drives the camera along two Catmull-Rom splines.
*/
export function createFlyView(el, pinEl, { reduced = false } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1319);
  scene.fog = new THREE.Fog(0x0e1319, 22, 60);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 200);
  const house = createHouse({ shadows: false, ground: 'solid' });
  scene.add(house.root);
  house.plan.solid.visible = false; house.plan.dashed.visible = false;

  // dusk lighting: warm interior, cool moon outside
  scene.add(new THREE.HemisphereLight(0x22324a, 0x0a0d12, 0.4));
  house.mats.site.ground.color.setHex(0x232a31);
  if (house.mats.site.gravel) house.mats.site.gravel.color.setHex(0x2c3239);
  house.mats.landscape.foliage.color.setHex(0x1f2d26);
  const moon = new THREE.DirectionalLight(0x8fb0e6, 0.7);
  moon.position.set(-10, 16, -8);
  scene.add(moon);
  const warm = (x, y, z, i = 40) => {
    const p = new THREE.PointLight(0xffc98a, i, 22, 2);
    p.position.set(x, y, z);
    scene.add(p);
  };
  warm(1.5, FL + 2.7, -0.5, 55);
  warm(-3.5, FL + 2.4, 0.5, 40);
  warm(5.5, FL + 2.3, -2, 30);
  warm(-2, FL + 1.2, 5.6, 18); // deck light
  const glow = house.mats.glazing?.glass;
  if (glow) { glow.opacity = 0.18; glow.color.setHex(0xffe0b0); }
  const floor = house.mats.interior?.floor; if (floor) floor.roughness = 0.4;

  const posCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.2, FL + 1.55, -2.2),
    new THREE.Vector3(-0.6, FL + 1.6, 0.6),
    new THREE.Vector3(0.4, FL + 1.65, 3.2),
    new THREE.Vector3(1.6, FL + 1.75, 6.4),
    new THREE.Vector3(6, FL + 2.6, 11),
    new THREE.Vector3(14, 5.5, 16),
    new THREE.Vector3(8, 9, 26),
  ], false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3, FL + 1.5, 3.5),
    new THREE.Vector3(1.5, FL + 1.7, 6),
    new THREE.Vector3(0, FL + 2, 10),
    new THREE.Vector3(-2, FL + 2.2, 4),
    new THREE.Vector3(-1, FL + 2, 0),
    new THREE.Vector3(0, 1.8, 0),
    new THREE.Vector3(0, 1.2, 0),
  ], false, 'centripetal');

  const caps = [...document.querySelectorAll('.fly__cap')];
  let cur = 0;
  const setCap = (i) => { if (i === cur) return; cur = i; caps.forEach((c, k) => c.classList.toggle('is-on', k === i)); };

  let progress = 0, smooth = 0;
  ScrollTrigger.create({
    trigger: pinEl,
    start: 'top top',
    end: '+=280%',
    pin: true,
    scrub: reduced ? false : 0.8,
    anticipatePin: 1,
    onUpdate: (self) => {
      progress = self.progress;
      setCap(progress < 0.3 ? 0 : progress < 0.6 ? 1 : 2);
    },
  });

  const p = new THREE.Vector3(), l = new THREE.Vector3();
  const view = stage.add({
    el, scene, camera,
    update(dt, t) {
      smooth += (progress - smooth) * Math.min(1, dt * 6);
      posCurve.getPointAt(smooth, p);
      lookCurve.getPointAt(smooth, l);
      // hand-held drift while inside
      const inside = 1 - Math.min(1, smooth / 0.45);
      p.y += Math.sin(t * 0.0011) * 0.03 * inside;
      p.x += Math.cos(t * 0.0009) * 0.04 * inside;
      camera.position.copy(p);
      camera.fov = 48 - smooth * 14;
      camera.updateProjectionMatrix();
      camera.lookAt(l);
    },
  });

  return { view, house };
}
