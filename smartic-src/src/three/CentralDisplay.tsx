import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { atmosphere } from '../atmosphere/store';
import { SCENES, rgbToHex } from '../atmosphere/palette';
import { KNOB } from './RotaryKnob';

const SIZE = 512;
const FONT = '"Noto Sans Armenian", system-ui, sans-serif';

/**
 * Round display embedded in the knob. It does not rotate with the knob,
 * so the scene label and time stay readable. Drawn to a canvas texture
 * only when what it shows actually changes.
 */
export function CentralDisplay({ compact = false }: { compact?: boolean }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [canvas]);
  const last = useRef('');
  const fontsReady = useRef(false);

  const draw = (force = false) => {
    const p = atmosphere.get();
    const pct = Math.round(p.value);
    const glow = rgbToHex(p.glow);
    const key = `${pct}|${p.clock}|${p.mood.id}|${glow}|${fontsReady.current}`;
    if (!force && key === last.current) return false;
    last.current = key;

    const ctx = canvas.getContext('2d')!;
    const c = SIZE / 2;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // glass background: deep, slightly lifted in the centre
    const bg = ctx.createRadialGradient(c, c * 0.85, 10, c, c, c);
    bg.addColorStop(0, '#15161a');
    bg.addColorStop(1, '#030304');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();

    // travel arc (track + value), gap at the bottom like the device scale
    const start = Math.PI * 0.75;
    const sweep = Math.PI * 1.5;
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(c, c, c - 46, start, start + sweep);
    ctx.stroke();
    ctx.strokeStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(c, c, c - 46, start, start + sweep * (p.value / 100) + 0.0001);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // time of day
    ctx.fillStyle = '#f4f1ec';
    ctx.font = `300 ${compact ? 128 : 116}px ${FONT}`;
    ctx.fillText(p.clock, c, c + 8);

    // mood label
    ctx.textAlign = 'center';
    ctx.fillStyle = glow;
    ctx.font = `600 ${compact ? 46 : 40}px ${FONT}`;
    ctx.fillText(p.mood.label, c, c - (compact ? 118 : 112));

    // zone dots (status indicators)
    if (!compact) {
      SCENES.forEach((m, i) => {
        const x = c + (i - 1) * 30;
        ctx.beginPath();
        ctx.fillStyle = m.id === p.mood.id ? glow : 'rgba(255,255,255,0.18)';
        ctx.arc(x, c + 112, m.id === p.mood.id ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    texture.needsUpdate = true;
    return true;
  };

  useEffect(() => {
    draw(true);
    document.fonts?.load(`600 40px "Noto Sans Armenian"`, 'Ջերմ երեկո').then(() => {
      fontsReady.current = true;
      draw(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    draw();
  });

  return (
    <group>
      <mesh position={[0, KNOB.displayY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[KNOB.displayR, 96]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* cover glass: only a faint specular sheen, keeps the screen deep black */}
      <mesh position={[0, KNOB.displayY + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[KNOB.displayR, 96]} />
        <meshPhysicalMaterial color="#000000" transparent opacity={0.12} roughness={0.05} metalness={0} clearcoat={1} envMapIntensity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}
