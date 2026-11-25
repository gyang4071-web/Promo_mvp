import * as THREE from 'three';

/** Lathe from (radius, height) pairs, with smooth normals. */
export function lathe(points: [number, number][], segments = 128) {
  const g = new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
  g.computeVertexNormals();
  return g;
}

/**
 * Precision-machined knurl: a cylinder whose wall is cut by `count`
 * trapezoid grooves (smooth-shaded flutes); vertex
 * colours darken the groove floors as baked ambient occlusion.
 */
export function groovedCylinder({
  radius,
  height,
  y0,
  count = 64,
  depth = 0.04,
  stepsPerGroove = 8,
}: {
  radius: number;
  height: number;
  y0: number;
  count?: number;
  depth?: number;
  stepsPerGroove?: number;
}) {
  const radial = count * stepsPerGroove;
  const rows = 6;
  const base = new THREE.CylinderGeometry(radius, radius, height, radial, rows, true);
  base.translate(0, y0 + height / 2, 0);
  const pos = base.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();

  // groove profile across one period (0..1): land, wall, floor, wall
  const profile = (p: number) => {
    if (p < 0.38) return 0; // land
    if (p < 0.5) return (p - 0.38) / 0.12; // wall down
    if (p < 0.88) return 1; // floor
    return 1 - (p - 0.88) / 0.12; // wall up
  };

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = Math.atan2(v.z, v.x);
    let p = ((theta / (Math.PI * 2)) * count) % 1;
    if (p < 0) p += 1;
    // chamfer the grooves out near the top/bottom edges (machined run-out)
    const h = (v.y - y0) / height;
    const runout = Math.min(1, Math.min(h, 1 - h) / 0.08);
    const d = profile(p) * depth * Math.max(0, runout);
    const r = radius - d;
    const len = Math.hypot(v.x, v.z) || 1;
    v.x = (v.x / len) * r;
    v.z = (v.z / len) * r;
    pos.setXYZ(i, v.x, v.y, v.z);
    const ao = 1 - (d / depth) * 0.38;
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = ao;
  }
  base.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  base.computeVertexNormals();
  return base;
}

/** Fine concentric brushing used as a roughness / bump map on lathe UVs. */
export function brushedTexture(size = 512, strength = 0.18) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = size;
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < size; y++) {
    const n = 0.5 + (Math.random() - 0.5) * strength * 2;
    const g = Math.round(n * 255);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(0, y, 8, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
