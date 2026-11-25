import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { atmosphere } from '../atmosphere/store';
import { START_DEG, TRAVEL } from './knob';

const TICKS = 41;
const TICK_R = 1.385;
const DECK_Y = 0.538;

/**
 * Illuminated details on the stationary housing:
 *  - a scale of LED ticks on the deck that fills up to the current value
 *  - a light-guide ring glowing in the gap between housing and knob
 * Both take the colour of the selected room light.
 */
export function LightIndicators({ markerMaterial }: { markerMaterial: THREE.MeshBasicMaterial }) {
  const ticks = useRef<THREE.InstancedMesh>(null);
  const guide = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const lastKey = useRef('');

  const tickGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.014, 0.006, 0.07);
    return g;
  }, []);

  useEffect(() => {
    const mesh = ticks.current!;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < TICKS; i++) {
      const deg = START_DEG + (TRAVEL * i) / (TICKS - 1);
      const psi = (deg * Math.PI) / 180;
      const major = i % 10 === 0;
      const r = TICK_R + (major ? 0.01 : 0);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -psi);
      m.compose(
        new THREE.Vector3(Math.sin(psi) * r, DECK_Y, -Math.cos(psi) * r),
        q,
        new THREE.Vector3(major ? 1.3 : 1, 1, major ? 1.6 : 1),
      );
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  const on = useMemo(() => new THREE.Color(), []);
  const off = useMemo(() => new THREE.Color('#2a2b2f'), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const p = atmosphere.get();
    const key = `${p.value.toFixed(1)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    on.setRGB(p.glow[0], p.glow[1], p.glow[2], THREE.SRGBColorSpace);
    const lit = (p.value / 100) * (TICKS - 1);
    const mesh = ticks.current!;
    for (let i = 0; i < TICKS; i++) {
      const k = Math.min(1, Math.max(0, lit - i + 1));
      tmp.copy(off).lerp(on, k).multiplyScalar(k > 0 ? 1.4 : 1);
      mesh.setColorAt(i, tmp);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // light-guide ring and position marker: brighter for lamp-heavy moods
    const strength = 0.55 + p.lampStrength * 0.9;
    guide.current!.color.copy(on).multiplyScalar(strength);
    markerMaterial.color.copy(on).multiplyScalar(1.6);
    if (light.current) {
      light.current.color.copy(on);
      light.current.intensity = 1.2 + p.lampStrength * 2.2;
    }
  });

  return (
    <group>
      <instancedMesh ref={ticks} args={[tickGeo, undefined, TICKS]}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh position={[0, 0.468, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.168, 0.011, 8, 180]} />
        <meshBasicMaterial ref={guide} toneMapped={false} />
      </mesh>
      {/* coloured bounce light that tints the knob's grooves and the deck */}
      <pointLight ref={light} position={[0, 0.62, 1.9]} distance={5} decay={2} />
    </group>
  );
}
