import { useMemo } from 'react';
import * as THREE from 'three';
import { brushedTexture, lathe } from './geometry';

/**
 * Stationary housing: a substantial graphite puck with a soft fillet,
 * a machined top deck and a recessed well the knob sits in.
 */
export function DeviceHousing() {
  const { body, deck, well, split, feet } = useMemo(() => {
    const body = lathe(
      [
        [0.0, 0.0],
        [1.4, 0.0],
        [1.49, 0.012],
        [1.545, 0.05],
        [1.565, 0.11],
        [1.57, 0.2],
        [1.57, 0.42],
        [1.562, 0.47],
        [1.54, 0.505],
        [1.505, 0.527],
        [1.46, 0.535],
      ],
      160,
    );
    // top deck (separate material: finer anodised finish)
    const deck = lathe(
      [
        [1.46, 0.535],
        [1.36, 0.537],
        [1.3, 0.537],
        [1.262, 0.533],
        [1.245, 0.52],
      ],
      160,
    );
    // inner well wall + floor, dark so the knob reads as inset
    const well = lathe(
      [
        [1.245, 0.52],
        [1.24, 0.47],
        [1.225, 0.455],
        [0.2, 0.452],
        [0.0, 0.452],
      ],
      128,
    );
    // fine split line around the waist: reads as two machined parts
    const split = new THREE.TorusGeometry(1.571, 0.0045, 8, 200);
    split.rotateX(Math.PI / 2);
    split.translate(0, 0.2, 0);
    // a slim recessed foot that lifts the device off the surface
    const feet = lathe(
      [
        [0.0, -0.035],
        [1.34, -0.035],
        [1.38, -0.02],
        [1.4, 0.0],
      ],
      96,
    );
    return { body, deck, well, split, feet };
  }, []);

  const brush = useMemo(() => {
    const t = brushedTexture(512, 0.22);
    t.repeat.set(1, 3);
    return t;
  }, []);

  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial side={THREE.DoubleSide}
          color="#4d4e54"
          metalness={0.55}
          roughness={0.42}
          clearcoat={0.35}
          clearcoatRoughness={0.35}
          roughnessMap={brush}
        />
      </mesh>
      <mesh geometry={deck}>
        <meshPhysicalMaterial side={THREE.DoubleSide} color="#4a4b51" metalness={0.85} roughness={0.26} roughnessMap={brush} />
      </mesh>
      <mesh geometry={well}>
        <meshStandardMaterial side={THREE.DoubleSide} color="#0d0d0f" metalness={0.3} roughness={0.75} />
      </mesh>
      <mesh geometry={split}>
        <meshStandardMaterial side={THREE.DoubleSide} color="#0b0b0c" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh geometry={feet}>
        <meshStandardMaterial side={THREE.DoubleSide} color="#121214" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
}
