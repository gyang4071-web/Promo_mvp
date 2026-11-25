import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { brushedTexture, groovedCylinder, lathe } from './geometry';

export const KNOB = {
  radius: 1.1,
  bottom: 0.47,
  grooveTop: 1.08,
  top: 1.2,
  faceInner: 0.6,
  displayY: 1.135,
  displayR: 0.545,
};

/** Precision-machined grooves around the knob wall. */
export function MechanicalGrooves() {
  const geo = useMemo(
    () =>
      groovedCylinder({
        radius: KNOB.radius,
        height: KNOB.grooveTop - KNOB.bottom - 0.03,
        y0: KNOB.bottom + 0.03,
        count: 84,
        depth: 0.03,
      }),
    [],
  );
  return (
    <mesh geometry={geo} castShadow>
      <meshPhysicalMaterial side={THREE.DoubleSide}
        vertexColors
        color="#c9ccd2"
        metalness={1}
        roughness={0.34}
        clearcoat={0.2}
      />
    </mesh>
  );
}

/**
 * The rotating knob: grooved wall, polished outer ring, brushed top face
 * and a lit position marker. Everything here turns together; the display
 * (separate component) stays still so it is always readable.
 */
export const RotaryKnob = forwardRef<THREE.Group, { markerMaterial: THREE.Material }>(function RotaryKnob(
  { markerMaterial },
  ref,
) {
  const parts = useMemo(() => {
    const R = KNOB.radius;
    const base = lathe(
      [
        [R - 0.06, KNOB.bottom],
        [R - 0.012, KNOB.bottom + 0.008],
        [R, KNOB.bottom + 0.03],
      ],
      144,
    );
    // polished outer ring with a chamfer rolling onto the top face
    const ring = lathe(
      [
        [R, KNOB.grooveTop - 0.03],
        [R + 0.004, KNOB.grooveTop],
        [R + 0.004, KNOB.top - 0.045],
        [R - 0.006, KNOB.top - 0.018],
        [R - 0.03, KNOB.top - 0.004],
        [R - 0.07, KNOB.top],
      ],
      160,
    );
    // engraved line separating ring and face
    const engrave = new THREE.TorusGeometry(R - 0.082, 0.0035, 6, 180);
    engrave.rotateX(Math.PI / 2);
    engrave.translate(0, KNOB.top + 0.0005, 0);
    // brushed, slightly dished top face
    const face = lathe(
      [
        [R - 0.07, KNOB.top],
        [0.86, KNOB.top - 0.006],
        [0.7, KNOB.top - 0.01],
        [KNOB.faceInner, KNOB.top - 0.012],
      ],
      160,
    );
    // bezel stepping down to the display glass
    const bezel = lathe(
      [
        [KNOB.faceInner, KNOB.top - 0.012],
        [KNOB.faceInner - 0.012, KNOB.top - 0.02],
        [KNOB.faceInner - 0.03, KNOB.top - 0.05],
        [KNOB.displayR + 0.004, KNOB.displayY + 0.002],
      ],
      144,
    );
    // position marker (capsule laid radially on the face)
    const marker = new THREE.CapsuleGeometry(0.018, 0.12, 6, 12);
    marker.rotateX(Math.PI / 2);
    marker.translate(0, KNOB.top - 0.004, -0.78);
    return { base, ring, engrave, face, bezel, marker };
  }, []);

  const brush = useMemo(() => {
    const t = brushedTexture(1024, 0.3);
    t.repeat.set(1, 6);
    return t;
  }, []);

  return (
    <group ref={ref}>
      <MechanicalGrooves />
      <mesh geometry={parts.base}>
        <meshPhysicalMaterial side={THREE.DoubleSide} color="#bfc3c9" metalness={1} roughness={0.28} />
      </mesh>
      <mesh geometry={parts.ring} castShadow>
        <meshPhysicalMaterial side={THREE.DoubleSide} color="#e3e5e8" metalness={1} roughness={0.16} roughnessMap={brush} clearcoat={0.4} />
      </mesh>
      <mesh geometry={parts.engrave}>
        <meshStandardMaterial side={THREE.DoubleSide} color="#1a1a1c" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh geometry={parts.face}>
        <meshPhysicalMaterial side={THREE.DoubleSide} color="#5a5c62" metalness={0.9} roughness={0.3} roughnessMap={brush} />
      </mesh>
      <mesh geometry={parts.bezel}>
        <meshPhysicalMaterial side={THREE.DoubleSide} color="#d6d9dd" metalness={1} roughness={0.12} />
      </mesh>
      <mesh geometry={parts.marker} material={markerMaterial} />
    </group>
  );
});
