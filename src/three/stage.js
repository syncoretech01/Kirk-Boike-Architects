import * as THREE from 'three';

/*
  One WebGL context for the whole page.
  Each "view" owns a scene + camera and a DOM element; every frame we scissor the
  canvas to that element's rect and render. Views outside the viewport are skipped.
*/
class Stage {
  constructor() {
    this.canvas = document.getElementById('gl');
    const isSmall = window.matchMedia('(max-width: 900px)').matches;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.localClippingEnabled = true;
    this.views = [];
    this.w = 0; this.h = 0;
    this.resize();
    let raf = 0;
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => this.resize()); });
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  add(view) {
    this.views.push(view);
    return view;
  }

  render(dt, t) {
    const r = this.renderer;
    r.setScissorTest(false);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, true);
    for (const v of this.views) {
      if (v.enabled === false) continue;
      const rect = v.el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= this.h || rect.right <= 0 || rect.left >= this.w || rect.width === 0) {
        v.visible = false;
        continue;
      }
      v.visible = true;
      const left = Math.max(0, Math.floor(rect.left));
      const top = Math.max(0, Math.floor(rect.top));
      const right = Math.min(this.w, Math.ceil(rect.right));
      const bottom = Math.min(this.h, Math.ceil(rect.bottom));
      const width = right - left, height = bottom - top;
      if (width <= 0 || height <= 0) continue;
      const aspect = rect.width / rect.height;
      if (v.camera.aspect !== aspect) { v.camera.aspect = aspect; v.camera.updateProjectionMatrix(); }
      v.update && v.update(dt, t, rect);
      // full element viewport (may extend off-screen), scissor to the visible part
      const vx = Math.floor(rect.left), vy = Math.floor(this.h - rect.bottom);
      r.setViewport(vx, vy, Math.ceil(rect.width), Math.ceil(rect.height));
      r.setScissor(left, this.h - bottom, width, height);
      r.setScissorTest(true);
      r.render(v.scene, v.camera);
    }
  }
}

export const stage = new Stage();

export function projectToRect(vec3, camera, rect) {
  const p = vec3.clone().project(camera);
  return {
    x: (p.x * 0.5 + 0.5) * rect.width,
    y: (-p.y * 0.5 + 0.5) * rect.height,
    z: p.z,
  };
}
