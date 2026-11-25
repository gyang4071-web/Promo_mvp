import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { atmosphere } from '../atmosphere/store';
import { DeviceHousing } from './DeviceHousing';
import { RotaryKnob, KNOB } from './RotaryKnob';
import { CentralDisplay } from './CentralDisplay';
import { LightIndicators } from './LightIndicators';
import { LightingEnvironment } from './LightingEnvironment';
import { createKnobState, travelToValue, TRAVEL, valueToPolar, valueToTravel, type KnobState } from './knob';

export interface HitZone {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

interface Props {
  /** element that receives the drag gestures (positioned over the knob) */
  hitRef: RefObject<HTMLDivElement>;
  onReady: () => void;
  compact: boolean;
  reducedMotion: boolean;
}

// ?poster renders a capturable frame for the static preview (build step only)
const POSTER_MODE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('poster');

const AZIMUTH = (20 * Math.PI) / 180;
const ELEVATION = (30 * Math.PI) / 180;
const TARGET = new THREE.Vector3(0, 0.62, 0);

/** Frames the device so it never gets cropped, at any aspect ratio. */
function CameraRig({ compact }: { compact: boolean }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const fitRadius = compact ? 1.9 : 1.85;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const dist = fitRadius / Math.sin(Math.min(vFov, hFov) / 2);
    cam.position.set(
      Math.sin(AZIMUTH) * Math.cos(ELEVATION) * dist,
      TARGET.y + Math.sin(ELEVATION) * dist,
      Math.cos(AZIMUTH) * Math.cos(ELEVATION) * dist,
    );
    cam.lookAt(TARGET);
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size, compact, invalidate]);
  return null;
}

/**
 * Interaction controller + knob physics.
 * Drag → angle (with rubber-band at the stops) → inertia with friction →
 * spring back inside the 270° travel. Programmatic targets (slider,
 * keyboard) use a critically damped spring, so the physical knob always
 * travels to the new position instead of jumping.
 */
function KnobRig({ hitRef, compact, reducedMotion }: Omit<Props, 'onReady'>) {
  const knob = useRef<THREE.Group>(null);
  const state = useRef<KnobState>(createKnobState(atmosphere.get().value));
  const { camera, size, invalidate, gl } = useThree();
  const zone = useRef<HitZone>({ x: 0, y: 0, rx: 1, ry: 1 });
  const markerMaterial = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);

  // Project the knob to screen space and place the hit zone over it.
  const updateZone = useCallback(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      for (const y of [KNOB.bottom, KNOB.top]) {
        pts.push(new THREE.Vector3(Math.cos(a) * KNOB.radius, y, Math.sin(a) * KNOB.radius));
      }
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach((p) => {
      p.project(camera);
      const x = ((p.x + 1) / 2) * size.width;
      const y = ((1 - p.y) / 2) * size.height;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    const pad = 10;
    zone.current = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, rx: (maxX - minX) / 2 + pad, ry: (maxY - minY) / 2 + pad };
    const el = hitRef.current;
    if (el) {
      const z = zone.current;
      el.style.left = `${z.x - z.rx}px`;
      el.style.top = `${z.y - z.ry}px`;
      el.style.width = `${z.rx * 2}px`;
      el.style.height = `${z.ry * 2}px`;
    }
  }, [camera, size, hitRef]);

  useEffect(() => {
    // wait one frame so CameraRig has positioned the camera
    const id = requestAnimationFrame(updateZone);
    return () => cancelAnimationFrame(id);
  }, [updateZone, compact]);

  // Register as the atmosphere driver (slider / keyboard / presets).
  useEffect(() => {
    atmosphere.setDriver((target, source) => {
      const s = state.current;
      s.target = valueToTravel(target);
      s.source = source === 'keyboard' ? 'keyboard' : 'slider';
      if (reducedMotion) {
        s.angle = s.target;
        s.velocity = 0;
      }
      invalidate();
    });
    const unsub = atmosphere.subscribe((_p, source) => {
      if (source !== 'knob' && source !== 'slider' && source !== 'keyboard') invalidate();
    });
    return () => {
      atmosphere.setDriver(null);
      unsub();
    };
  }, [invalidate, reducedMotion]);

  // Pointer gestures on the hit zone only — the rest of the canvas lets the
  // page scroll normally on touch screens.
  useEffect(() => {
    const el = hitRef.current;
    if (!el) return;
    let last = { x: 0, y: 0, t: 0 };
    let pointerId: number | null = null;

    const local = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const down = (e: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      el.setPointerCapture(e.pointerId);
      const p = local(e);
      last = { ...p, t: performance.now() };
      const s = state.current;
      s.dragging = true;
      s.target = null;
      s.velocity = 0;
      s.source = 'knob';
      el.dataset.active = 'true';
      invalidate();
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const p = local(e);
      const now = performance.now();
      const z = zone.current;
      // angular delta around the knob centre (ellipse normalised to a circle)
      const ratio = z.ry / z.rx;
      const ax = last.x - z.x, ay = (last.y - z.y) / ratio;
      const bx = p.x - z.x, by = (p.y - z.y) / ratio;
      const ang = (Math.atan2(ax * by - ay * bx, ax * bx + ay * by) * 180) / Math.PI;
      const dist = Math.hypot(bx, by);
      // near the centre, fall back to linear: right/up = more
      const lin = ((p.x - last.x) - (p.y - last.y)) * (95 / z.rx);
      const w = Math.min(1, Math.max(0, (dist - z.rx * 0.22) / (z.rx * 0.35)));
      let delta = ang * w + lin * (1 - w);
      const s = state.current;
      if (s.angle + delta < 0 || s.angle + delta > TRAVEL) delta *= 0.28; // resistance at the stops
      s.angle += delta;
      const dt = Math.max(1, now - last.t) / 1000;
      s.velocity = s.velocity * 0.6 + (delta / dt) * 0.4;
      last = { ...p, t: now };
      invalidate();
    };

    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      const s = state.current;
      s.dragging = false;
      if (performance.now() - last.t > 90 || reducedMotion) s.velocity = 0;
      s.velocity = Math.max(-720, Math.min(720, s.velocity));
      delete el.dataset.active;
      invalidate();
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [hitRef, gl, invalidate, reducedMotion]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = state.current;
    let active = s.dragging;

    if (!s.dragging) {
      if (s.target !== null) {
        // critically damped spring toward the requested value
        const k = reducedMotion ? 400 : 110;
        const c = 2 * Math.sqrt(k);
        s.velocity += (k * (s.target - s.angle) - c * s.velocity) * dt;
        s.angle += s.velocity * dt;
        if (Math.abs(s.target - s.angle) < 0.03 && Math.abs(s.velocity) < 0.3) {
          s.angle = s.target;
          s.velocity = 0;
          s.target = null;
        } else active = true;
      } else if (s.angle < 0 || s.angle > TRAVEL) {
        // bounce back inside the mechanical stops
        s.target = Math.min(TRAVEL, Math.max(0, s.angle));
        s.velocity *= 0.3;
        active = true;
      } else if (Math.abs(s.velocity) > 0.5) {
        // inertia with friction
        s.angle += s.velocity * dt;
        s.velocity *= Math.exp(-dt * 5.5);
        active = true;
      } else s.velocity = 0;
    }

    const value = travelToValue(s.angle);
    // visible rotation follows the physical angle, including rubber-band overshoot
    const overshoot = s.angle - valueToTravel(value);
    if (knob.current) knob.current.rotation.y = -(valueToPolar(value) + (overshoot * Math.PI) / 180);

    if (Math.abs(value - atmosphere.get().value) > 0.001) {
      atmosphere.set(value, s.source);
      const notch = Math.round(value / 10);
      if (s.dragging && notch !== s.lastNotch) {
        s.lastNotch = notch;
        navigator.vibrate?.(4);
      }
    }
    if (active) invalidate();
  });

  return (
    <group>
      <DeviceHousing />
      <RotaryKnob ref={knob} markerMaterial={markerMaterial} />
      <CentralDisplay compact={compact} />
      <LightIndicators markerMaterial={markerMaterial} />
    </group>
  );
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}

export default function RotaryController3D({ hitRef, onReady, compact, reducedMotion }: Props) {
  const [dpr] = useState<[number, number]>(() => [1, compact ? 1.6 : 2]);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: POSTER_MODE }}
      camera={{ fov: 26, near: 0.1, far: 50, position: [0, 4, 6] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden="true"
      style={{ touchAction: 'pan-y' }}
    >
      <CameraRig compact={compact} />
      <LightingEnvironment low={compact} />
      <KnobRig hitRef={hitRef} compact={compact} reducedMotion={reducedMotion} />
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
}
