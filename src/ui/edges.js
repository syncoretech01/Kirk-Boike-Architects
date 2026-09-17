/*
  Turns a photo into a line drawing with a Sobel edge pass.
  Used for the drawing-to-render wipe, the structural x-ray lens and the project compare slider.
  Falls back to a CSS blueprint filter when the image can't be read (CORS).
*/
const cache = new Map();

export function drawEdges(img, canvas, { bg = [15, 43, 90], line = [244, 245, 243], grid = true, lo = 40, hi = 150, maxW = 1400 } = {}) {
  const key = img.currentSrc || img.src;
  const run = () => {
    const ratio = img.naturalHeight / img.naturalWidth || 0.66;
    const w = Math.min(maxW, img.naturalWidth || maxW);
    const h = Math.round(w * ratio);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let src;
    try {
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const octx = off.getContext('2d', { willReadFrequently: true });
      octx.drawImage(img, 0, 0, w, h);
      src = octx.getImageData(0, 0, w, h);
    } catch (err) {
      canvas.classList.add('is-fallback');
      return false;
    }
    const cached = cache.get(key + w);
    if (cached) { ctx.putImageData(cached, 0, 0); return true; }

    const d = src.data;
    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) gray[j] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    // light blur to calm noise
    const blur = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      blur[i] = (gray[i - w - 1] + 2 * gray[i - w] + gray[i - w + 1] + 2 * gray[i - 1] + 4 * gray[i] + 2 * gray[i + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]) / 16;
    }
    const out = ctx.createImageData(w, h);
    const o = out.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let mag = 0;
      if (y > 0 && y < h - 1 && x > 0 && x < w - 1) {
        const gx = -blur[i - w - 1] + blur[i - w + 1] - 2 * blur[i - 1] + 2 * blur[i + 1] - blur[i + w - 1] + blur[i + w + 1];
        const gy = -blur[i - w - 1] - 2 * blur[i - w] - blur[i - w + 1] + blur[i + w - 1] + 2 * blur[i + w] + blur[i + w + 1];
        mag = Math.sqrt(gx * gx + gy * gy);
      }
      let a = Math.min(1, Math.max(0, (mag - lo) / (hi - lo)));
      if (grid && a < 0.1 && (x % 48 === 0 || y % 48 === 0)) a = 0.16;
      const k = i * 4;
      o[k] = bg[0] + (line[0] - bg[0]) * a;
      o[k + 1] = bg[1] + (line[1] - bg[1]) * a;
      o[k + 2] = bg[2] + (line[2] - bg[2]) * a;
      o[k + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    cache.set(key + w, out);
    return true;
  };
  if (img.complete && img.naturalWidth) return Promise.resolve(run());
  return new Promise((res) => {
    img.addEventListener('load', () => res(run()), { once: true });
    img.addEventListener('error', () => res(false), { once: true });
  });
}
