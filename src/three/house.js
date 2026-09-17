import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
  Procedural Pacific Northwest shed-roof house.
  Units are meters. The finished floor sits at y = FL.
  Geometry is merged per (layer, material) so each layer is a handful of draw calls,
  which keeps four separate scenes cheap enough to share one WebGL context.
*/

export const LAYER_ORDER = [
  'site', 'foundation', 'floorFraming', 'wallFraming', 'roofFraming',
  'cladding', 'glazing', 'roof', 'interior', 'deck', 'landscape',
];
export const FRAME_LAYERS = ['foundation', 'floorFraming', 'wallFraming', 'roofFraming'];
export const HOUSE_LAYERS = LAYER_ORDER.filter((l) => l !== 'site' && l !== 'landscape');

// dimensions
export const W = 14, D = 8, FL = 0.3, H_BACK = 3.0, H_FRONT = 4.4, T = 0.2, OVER = 0.8;
const SLOPE = Math.atan((H_FRONT - H_BACK) / D);
const wallH = (z) => H_BACK + ((z + D / 2) / D) * (H_FRONT - H_BACK);

const BASE_MATS = {
  concrete: () => new THREE.MeshStandardMaterial({ color: 0xb6b4ae, roughness: 0.95 }),
  wood: () => new THREE.MeshStandardMaterial({ color: 0xd9bb90, roughness: 0.82 }),
  glulam: () => new THREE.MeshStandardMaterial({ color: 0xc9a06e, roughness: 0.7 }),
  cedar: () => new THREE.MeshStandardMaterial({ color: 0x9a7254, roughness: 0.88 }),
  cedarDark: () => new THREE.MeshStandardMaterial({ color: 0x6e5039, roughness: 0.9 }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.42, metalness: 0.55 }),
  mullion: () => new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.5, metalness: 0.3 }),
  glass: () => new THREE.MeshStandardMaterial({ color: 0x9dc0e0, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.32, depthWrite: false }),
  floor: () => new THREE.MeshStandardMaterial({ color: 0xd2b285, roughness: 0.65 }),
  plaster: () => new THREE.MeshStandardMaterial({ color: 0xe9e7e1, roughness: 0.9 }),
  stone: () => new THREE.MeshStandardMaterial({ color: 0x77726c, roughness: 0.95 }),
  deck: () => new THREE.MeshStandardMaterial({ color: 0xa9825c, roughness: 0.85 }),
  ground: () => new THREE.MeshStandardMaterial({ color: 0xd4d9d0, roughness: 1 }),
  gravel: () => new THREE.MeshStandardMaterial({ color: 0xb8bab2, roughness: 1 }),
  foliage: () => new THREE.MeshStandardMaterial({ color: 0x4a6454, roughness: 0.95, flatShading: true }),
  trunk: () => new THREE.MeshStandardMaterial({ color: 0x584535, roughness: 1 }),
};

export function createHouse({ shadows = true, ground = 'shadow' } = {}) {
  const root = new THREE.Group();
  const layers = {};
  const buckets = {}; // key layer -> matKey -> geometries[]
  LAYER_ORDER.forEach((name) => {
    const g = new THREE.Group();
    g.name = name;
    layers[name] = g;
    root.add(g);
    buckets[name] = {};
  });

  const push = (layer, mat, geo) => {
    (buckets[layer][mat] ||= []).push(geo);
  };
  // box with origin at its bottom-centre, so y is the bottom face
  const box = (layer, mat, w, h, d, x, y, z, m) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    if (m) g.applyMatrix4(m);
    g.translate(x, y, z);
    push(layer, mat, g);
  };

  /* ---------- site ---------- */
  {
    const g = new THREE.CircleGeometry(90, 96);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.35, 0);
    push('site', 'ground', g);
    if (ground === 'solid') {
      // gravel drive coming in from the west
      const drive = new THREE.BoxGeometry(11, 0.04, 3.2);
      drive.translate(-13.5, -0.33, 5.2);
      push('site', 'gravel', drive);
      const pad = new THREE.BoxGeometry(4.5, 0.04, 6);
      pad.translate(-10.2, -0.33, 4.6);
      push('site', 'gravel', pad);
    }
  }

  /* ---------- foundation ---------- */
  {
    const f = 0.5;
    box('foundation', 'concrete', W + f, 0.25, f, 0, -0.9, -D / 2);
    box('foundation', 'concrete', W + f, 0.25, f, 0, -0.9, D / 2);
    box('foundation', 'concrete', f, 0.25, D, -W / 2, -0.9, 0);
    box('foundation', 'concrete', f, 0.25, D, W / 2, -0.9, 0);
    box('foundation', 'concrete', W, 0.65, 0.22, 0, -0.65, -D / 2 + 0.11);
    box('foundation', 'concrete', W, 0.65, 0.22, 0, -0.65, D / 2 - 0.11);
    box('foundation', 'concrete', 0.22, 0.65, D, -W / 2 + 0.11, -0.65, 0);
    box('foundation', 'concrete', 0.22, 0.65, D, W / 2 - 0.11, -0.65, 0);
    for (let x = -5.25; x <= 5.3; x += 3.5) box('foundation', 'concrete', 0.3, 0.65, 0.3, x, -0.65, 0);
  }

  /* ---------- floor framing ---------- */
  {
    box('floorFraming', 'glulam', W - 0.4, 0.3, 0.18, 0, -0.05, 0); // centre girder
    box('floorFraming', 'wood', W, 0.25, 0.05, 0, 0, -D / 2 + 0.025);
    box('floorFraming', 'wood', W, 0.25, 0.05, 0, 0, D / 2 - 0.025);
    for (let x = -W / 2 + 0.2; x <= W / 2 - 0.19; x += 0.4) box('floorFraming', 'wood', 0.05, 0.25, D - 0.1, x, 0, 0);
    box('floorFraming', 'wood', W - 0.02, 0.05, D - 0.02, 0, 0.25, 0); // subfloor
  }

  /* ---------- wall framing ---------- */
  {
    const sh = 0.04, sd = 0.09;
    // back wall plates + studs
    box('wallFraming', 'wood', W, 0.05, sd, 0, FL, -D / 2 + T / 2);
    box('wallFraming', 'wood', W, 0.05, sd, 0, FL + H_BACK - 0.05, -D / 2 + T / 2);
    for (let x = -W / 2 + 0.2; x <= W / 2 - 0.19; x += 0.4) box('wallFraming', 'wood', sh, H_BACK - 0.1, sd, x, FL + 0.05, -D / 2 + T / 2);
    // side walls (sloped top)
    for (const side of [-1, 1]) {
      const x = side * (W / 2 - T / 2);
      const wz = side < 0 ? 1.2 : -1.6, ww = 2.2, wy = 1.0, wh = 1.6;
      for (let z = -D / 2 + 0.2; z <= D / 2 - 0.19; z += 0.4) {
        const inWin = z > wz - ww / 2 && z < wz + ww / 2;
        if (!inWin) box('wallFraming', 'wood', sd, wallH(z) - 0.1, sh, x, FL + 0.05, z);
        else { box('wallFraming', 'wood', sd, wy - 0.1, sh, x, FL + 0.05, z); box('wallFraming', 'wood', sd, wallH(z) - wy - wh - 0.15, sh, x, FL + wy + wh + 0.1, z); }
      }
      box('wallFraming', 'wood', sd, 0.1, ww, x, FL + wy - 0.1, wz);
      box('wallFraming', 'glulam', sd, 0.1, ww + 0.1, x, FL + wy + wh, wz);
      box('wallFraming', 'wood', sd, 0.05, D, x, FL, 0);
      // sloped top plate
      const len = D / Math.cos(SLOPE);
      const m = new THREE.Matrix4().makeRotationX(-SLOPE);
      const g = new THREE.BoxGeometry(sd, 0.05, len);
      g.translate(0, 0, len / 2);
      g.applyMatrix4(m);
      g.translate(x, FL + H_BACK - 0.05, -D / 2);
      push('wallFraming', 'wood', g);
    }
    // front: end sections + posts + the glulam beam that carries the roof over the glass
    for (const x of [-6.8, -6.4, 6.4, 6.8]) box('wallFraming', 'wood', sh, H_FRONT - 0.1, sd, x, FL + 0.05, D / 2 - T / 2);
    box('wallFraming', 'glulam', 0.26, H_FRONT - 0.5, 0.26, -6, FL, D / 2 - 0.13);
    box('wallFraming', 'glulam', 0.26, H_FRONT - 0.5, 0.26, 6, FL, D / 2 - 0.13);
    box('wallFraming', 'glulam', W, 0.5, 0.28, 0, FL + H_FRONT - 0.5, D / 2 - 0.14);
    // interior partition framing
    for (let z = -D / 2 + 0.3; z <= 0; z += 0.4) box('wallFraming', 'wood', sd, 2.5, sh, 3.8, FL, z);
  }

  /* ---------- roof framing + roof ---------- */
  {
    const len = D / Math.cos(SLOPE) + OVER * 2;
    const m = new THREE.Matrix4().makeRotationX(-SLOPE);
    const rafter = (x) => {
      const g = new THREE.BoxGeometry(0.06, 0.28, len);
      g.translate(0, 0, len / 2 - OVER);
      g.applyMatrix4(m);
      g.translate(x, FL + H_BACK, -D / 2);
      push('roofFraming', 'wood', g);
    };
    for (let x = -W / 2 - 0.6; x <= W / 2 + 0.61; x += 0.6) rafter(x);
    // roof deck + standing seam metal + fascia
    const deckW = W + OVER * 2;
    const deck = new THREE.BoxGeometry(deckW, 0.06, len);
    deck.translate(0, 0.31, len / 2 - OVER);
    deck.applyMatrix4(m);
    deck.translate(0, FL + H_BACK, -D / 2);
    push('roof', 'metal', deck);
    for (let x = -deckW / 2 + 0.22; x < deckW / 2; x += 0.45) {
      const s = new THREE.BoxGeometry(0.035, 0.035, len);
      s.translate(x, 0.37, len / 2 - OVER);
      s.applyMatrix4(m);
      s.translate(0, FL + H_BACK, -D / 2);
      push('roof', 'metal', s);
    }
    const fasciaSide = (x) => {
      const g = new THREE.BoxGeometry(0.05, 0.36, len);
      g.translate(x, 0, len / 2 - OVER);
      g.applyMatrix4(m);
      g.translate(0, FL + H_BACK, -D / 2);
      push('roof', 'cedarDark', g);
    };
    fasciaSide(-deckW / 2 + 0.02);
    fasciaSide(deckW / 2 - 0.02);
    const fasciaEnd = (zLocal) => {
      const g = new THREE.BoxGeometry(deckW, 0.36, 0.05);
      g.translate(0, 0, zLocal);
      g.applyMatrix4(m);
      g.translate(0, FL + H_BACK, -D / 2);
      push('roof', 'cedarDark', g);
    };
    fasciaEnd(-OVER + 0.02);
    fasciaEnd(len - OVER - 0.02);
  }

  /* ---------- cladding ---------- */
  {
    // back wall solid
    box('cladding', 'cedar', W, H_BACK, T, 0, FL, -D / 2 + T / 2);
    // side walls: trapezoids following the roof line
    for (const side of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(-D / 2, 0);
      shape.lineTo(D / 2, 0);
      shape.lineTo(D / 2, H_FRONT);
      shape.lineTo(-D / 2, H_BACK);
      shape.closePath();
      // window opening (bedroom / living)
      const hole = new THREE.Path();
      const wz = side < 0 ? 1.2 : -1.6, ww = 2.2, wy = 1.0, wh = 1.6;
      hole.moveTo(wz - ww / 2, wy); hole.lineTo(wz + ww / 2, wy); hole.lineTo(wz + ww / 2, wy + wh); hole.lineTo(wz - ww / 2, wy + wh); hole.closePath();
      shape.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
      // shape is in (z, y) plane; rotate so extrusion runs along x
      g.rotateY(-Math.PI / 2);
      g.translate(side < 0 ? -W / 2 + T : W / 2, FL, 0);
      push('cladding', 'cedar', g);
      // window glass + frame for the opening
      const gx = side * (W / 2 - T / 2);
      const gg = new THREE.BoxGeometry(0.04, wh - 0.1, ww - 0.1);
      gg.translate(gx, FL + wy + wh / 2, wz);
      push('glazing', 'glass', gg);
      const fr = new THREE.BoxGeometry(0.08, wh, 0.06); fr.translate(gx, FL + wy + wh / 2, wz - ww / 2 + 0.03); push('glazing', 'mullion', fr);
      const fr2 = new THREE.BoxGeometry(0.08, wh, 0.06); fr2.translate(gx, FL + wy + wh / 2, wz + ww / 2 - 0.03); push('glazing', 'mullion', fr2);
      const fr3 = new THREE.BoxGeometry(0.08, 0.06, ww); fr3.translate(gx, FL + wy + 0.03, wz); push('glazing', 'mullion', fr3);
      const fr4 = new THREE.BoxGeometry(0.08, 0.06, ww); fr4.translate(gx, FL + wy + wh - 0.03, wz); push('glazing', 'mullion', fr4);
    }
    // front wall end panels
    box('cladding', 'cedar', 1, H_FRONT, T, -6.5, FL, D / 2 - T / 2);
    box('cladding', 'cedar', 1, H_FRONT, T, 6.5, FL, D / 2 - T / 2);
    // entry door on the west wall
    box('cladding', 'cedarDark', 0.06, 2.3, 1.1, -W / 2 - 0.02, FL, 2.6);
  }

  /* ---------- glazing: the south wall ---------- */
  {
    const z = D / 2 - T / 2;
    const gh = H_FRONT - 0.5;
    const g = new THREE.BoxGeometry(12, gh - 0.1, 0.03);
    g.translate(0, FL + gh / 2, z);
    push('glazing', 'glass', g);
    for (let x = -6; x <= 6.01; x += 2) box('glazing', 'mullion', 0.09, gh, 0.12, x, FL, z);
    box('glazing', 'mullion', 12, 0.09, 0.12, 0, FL + 2.6, z); // transom rail
    box('glazing', 'mullion', 12, 0.08, 0.12, 0, FL, z);
    box('glazing', 'mullion', 12, 0.08, 0.12, 0, FL + gh - 0.08, z);
    // sliding door track marker
    box('glazing', 'mullion', 4, 0.03, 0.14, 1, FL + 0.08, z);
  }

  /* ---------- interior ---------- */
  {
    box('interior', 'floor', W - T * 2, 0.03, D - T * 2, 0, FL - 0.01, 0);
    box('interior', 'plaster', 0.12, 2.5, D / 2, 3.8, FL, -D / 4); // partition
    box('interior', 'plaster', 2.6, 0.92, 0.9, 1.4, FL, 0.6); // kitchen island
    box('interior', 'plaster', 5.2, 0.9, 0.62, 1.4, FL, -D / 2 + 0.55); // back counter
    box('interior', 'stone', 1.4, H_BACK, 0.7, -3.2, FL, -D / 2 + 0.55); // fireplace mass
    box('interior', 'cedarDark', 2.6, 0.42, 1.0, -3.2, FL, 1.4); // low sofa / bench
    box('interior', 'plaster', 2.2, 0.72, 1.1, -0.8, FL, 1.6); // table
  }

  /* ---------- deck ---------- */
  {
    const dz = D / 2 + 1.6;
    box('deck', 'deck', W, 0.12, 3.2, 0, FL - 0.14, dz);
    for (let x = -W / 2 + 0.35; x <= W / 2; x += 1.6) box('deck', 'cedarDark', 0.14, 0.9, 0.14, x, FL - 0.14, dz);
    for (let x = -W / 2 + 0.35; x <= W / 2; x += 1.6) box('deck', 'cedarDark', 0.14, 0.7, 0.14, x, -0.9, dz); // posts
    box('deck', 'cedarDark', W, 0.06, 0.1, 0, FL + 0.7, dz + 1.55); // rail
    for (let x = -W / 2 + 0.35; x <= W / 2; x += 1.6) box('deck', 'cedarDark', 0.14, 0.9, 0.14, x, FL - 0.14, dz + 1.55);
    // steps down to grade on the west
    box('deck', 'deck', 1.4, 0.16, 1.2, -W / 2 - 0.7, -0.36, dz - 0.2);
    box('deck', 'deck', 1.4, 0.16, 1.2, -W / 2 - 0.7, -0.2, dz + 0.3);
  }

  /* ---------- landscape: firs ---------- */
  {
    const fir = (x, z, h, s = 1) => {
      const trunk = new THREE.CylinderGeometry(0.12 * s, 0.22 * s, h * 0.35, 6);
      trunk.translate(x, -0.35 + h * 0.175, z);
      push('landscape', 'trunk', trunk);
      const tiers = 4;
      for (let i = 0; i < tiers; i++) {
        const r = (1.55 - i * 0.32) * s;
        const ch = h * 0.34;
        const c = new THREE.ConeGeometry(r, ch, 7);
        c.translate(x, -0.35 + h * 0.22 + i * (h * 0.19) + ch / 2, z);
        push('landscape', 'foliage', c);
      }
    };
    fir(-12.5, -4.5, 8);
    fir(-14.5, 1.5, 6.5, 0.85);
    fir(13.5, -8, 8.5, 0.95);
    fir(16.5, -3.5, 7, 0.85);
    fir(-9.5, -11, 9, 1);
    fir(9, -12, 8, 0.9);
    fir(2, -13.5, 9.5, 1.05);
    fir(-4.5, -12.5, 7.5, 0.85);
    fir(-18, 7, 7, 0.8);
    fir(21, 4, 7.5, 0.85);
  }

  /* ---------- merge buckets into meshes ---------- */
  const mats = {}; // per layer: { matKey: material }
  Object.entries(buckets).forEach(([layer, byMat]) => {
    mats[layer] = {};
    Object.entries(byMat).forEach(([matKey, geos]) => {
      const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
      const merged = mergeGeometries(flat, false);
      geos.forEach((g) => g.dispose());
      flat.forEach((g) => g.dispose());
      // 'shadow' ground: the page itself is the ground plane, only shadows are drawn
      const mat = matKey === 'ground' && ground === 'shadow' ? new THREE.ShadowMaterial({ opacity: 0.16, transparent: true }) : BASE_MATS[matKey]();
      mat.side = THREE.DoubleSide;
      mat.userData.baseOpacity = mat.opacity;
      mat.userData.baseColor = mat.color.getHex();
      mats[layer][matKey] = mat;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = shadows && matKey !== 'glass' && layer !== 'site';
      mesh.receiveShadow = shadows;
      mesh.name = `${layer}:${matKey}`;
      layers[layer].add(mesh);
    });
  });

  /* ---------- plan lines (blueprint) ---------- */
  const plan = buildPlanLines();
  root.add(plan.solid, plan.dashed);

  /* ---------- state helpers ---------- */
  const eachMat = (fn) => Object.entries(mats).forEach(([layer, byMat]) => Object.entries(byMat).forEach(([k, m]) => fn(m, layer, k)));

  const setOpacity = (m, v) => {
    const base = m.userData.baseOpacity;
    m.transparent = v < 1 || base < 1;
    m.opacity = base * v;
    m.depthWrite = m.opacity > 0.5 && base >= 1;
    m.needsUpdate = false;
  };

  let xray = false, highlight = null;
  const apply = () => {
    eachMat((m, layer, key) => {
      let o = 1;
      if (xray && !FRAME_LAYERS.includes(layer) && layer !== 'site' && layer !== 'landscape') o = 0.07;
      if (highlight && layer !== highlight && layer !== 'site' && layer !== 'landscape') o = Math.min(o, 0.08);
      if (highlight === layer) o = 1;
      setOpacity(m, o);
      if (xray && FRAME_LAYERS.includes(layer)) {
        m.color.setHex(0x1e4fa3);
        m.emissive.setHex(0x0f2b5a);
        m.emissiveIntensity = 0.45;
      } else if (highlight === layer) {
        m.color.setHex(m.userData.baseColor);
        m.emissive.setHex(0x1e4fa3);
        m.emissiveIntensity = 0.25;
      } else {
        m.color.setHex(m.userData.baseColor);
        m.emissive.setHex(0x000000);
        m.emissiveIntensity = 0;
      }
    });
    // dimmed layers should not throw full shadows
    Object.values(layers).forEach((g) => g.children.forEach((mesh) => { mesh.castShadow = mesh.material.opacity > 0.5 && mesh.material.userData.baseOpacity >= 1 && g.name !== 'site'; }));
  };

  return {
    root, layers, mats, plan,
    setXray(on) { xray = on; apply(); },
    setHighlight(layer) { highlight = layer; apply(); },
    setClip(plane) {
      eachMat((m, layer) => {
        if (layer === 'site' || layer === 'landscape') return;
        m.clippingPlanes = plane ? [plane] : [];
        m.clipShadows = !!plane;
      });
    },
    dispose() {
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      eachMat((m) => m.dispose());
    },
  };
}

/* 2D floor plan drawn in blueprint blue, laid on the subfloor */
function buildPlanLines() {
  const pts = [];
  const seg = (x1, z1, x2, z2) => pts.push(x1, 0, z1, x2, 0, z2);
  const rect = (x1, z1, x2, z2) => { seg(x1, z1, x2, z1); seg(x2, z1, x2, z2); seg(x2, z2, x1, z2); seg(x1, z2, x1, z1); };
  const hw = W / 2, hd = D / 2;
  rect(-hw, -hd, hw, hd);
  rect(-hw + T, -hd + T, hw - T, hd - T);
  // partition + bathroom
  seg(3.8, -hd + T, 3.8, 0); seg(3.8, 0, hw - T, 0);
  seg(3.8, -1.8, hw - T, -1.8);
  // kitchen
  rect(0.1, 0.15, 2.7, 1.05);
  rect(-1.2, -hd + T, 4.0, -hd + T + 0.62);
  // fireplace
  rect(-3.9, -hd + T, -2.5, -hd + T + 0.7);
  // glazing mullion ticks along the south wall
  for (let x = -6; x <= 6.01; x += 2) seg(x, hd - T, x, hd + 0.1);
  seg(-6, hd - T / 2, 6, hd - T / 2);
  // entry door on the west wall with swing
  seg(-hw - 0.15, 2.05, -hw + T + 0.15, 2.05);
  seg(-hw - 0.15, 3.15, -hw + T + 0.15, 3.15);
  seg(-hw + T, 2.05, -hw + T + 1.1, 2.05);
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI / 2, a2 = ((i + 1) / 12) * Math.PI / 2;
    seg(-hw + T + Math.cos(a1) * 1.1, 2.05 + Math.sin(a1) * 1.1, -hw + T + Math.cos(a2) * 1.1, 2.05 + Math.sin(a2) * 1.1);
  }
  // dimension lines
  seg(-hw, hd + 1.4, hw, hd + 1.4); seg(-hw, hd + 1.1, -hw, hd + 1.7); seg(hw, hd + 1.1, hw, hd + 1.7);
  seg(hw + 1.4, -hd, hw + 1.4, hd); seg(hw + 1.1, -hd, hw + 1.7, -hd); seg(hw + 1.1, hd, hw + 1.7, hd);
  // north arrow
  seg(-hw - 1.6, -hd - 0.6, -hw - 1.6, -hd - 2.1); seg(-hw - 1.6, -hd - 2.1, -hw - 1.85, -hd - 1.7); seg(-hw - 1.6, -hd - 2.1, -hw - 1.35, -hd - 1.7);
  // deck outline
  rect(-hw, hd, hw, hd + 3.2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0x1e4fa3, transparent: true, opacity: 1 });
  const solid = new THREE.LineSegments(geo, mat);
  solid.position.y = FL + 0.02;

  // roof overhang, dashed
  const d = [];
  const o = OVER;
  const dr = (x1, z1, x2, z2) => d.push(x1, 0, z1, x2, 0, z2);
  dr(-hw - o, -hd - o, hw + o, -hd - o); dr(hw + o, -hd - o, hw + o, hd + o); dr(hw + o, hd + o, -hw - o, hd + o); dr(-hw - o, hd + o, -hw - o, -hd - o);
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.Float32BufferAttribute(d, 3));
  const dmat = new THREE.LineDashedMaterial({ color: 0x1e4fa3, dashSize: 0.35, gapSize: 0.2, transparent: true, opacity: 1 });
  const dashed = new THREE.LineSegments(dgeo, dmat);
  dashed.computeLineDistances();
  dashed.position.y = FL + 0.02;

  return { solid, dashed, mats: [mat, dmat] };
}

export function addDaylight(scene, { shadows = true, fog = 0xf4f5f3 } = {}) {
  scene.fog = new THREE.Fog(fog, 58, 110);
  const hemi = new THREE.HemisphereLight(0xe6edf7, 0xb6b0a5, 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.position.set(12, 18, 9);
  sun.castShadow = shadows;
  if (shadows) {
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -22; c.right = 22; c.top = 22; c.bottom = -22; c.near = 1; c.far = 60;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 3;
  }
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdbe6f5, 0.55);
  fill.position.set(-14, 8, -6);
  scene.add(fill);
  return { hemi, sun, fill };
}
